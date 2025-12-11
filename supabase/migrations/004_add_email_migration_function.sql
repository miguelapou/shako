-- =============================================
-- Migration: Add email migration (account transfer) function
-- =============================================
-- This migration enables users to transfer their data to a new Google account
-- by creating a secure pending_migrations table and transfer function.
-- =============================================

-- =============================================
-- STEP 1: Create pending_migrations table
-- =============================================

CREATE TABLE IF NOT EXISTS public.pending_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  migration_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_pending_migrations_token ON pending_migrations(migration_token);

-- Enable RLS
ALTER TABLE pending_migrations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pending migrations
CREATE POLICY "Users can view own pending migrations" ON pending_migrations
  FOR SELECT USING (auth.uid() = old_user_id);

-- Users can only create migrations for themselves
CREATE POLICY "Users can create own pending migrations" ON pending_migrations
  FOR INSERT WITH CHECK (auth.uid() = old_user_id);

-- Users can delete their own pending migrations
CREATE POLICY "Users can delete own pending migrations" ON pending_migrations
  FOR DELETE USING (auth.uid() = old_user_id);

-- =============================================
-- STEP 2: Function to initiate migration
-- =============================================

CREATE OR REPLACE FUNCTION public.initiate_email_migration()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  new_token text;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete any existing pending migrations for this user
  DELETE FROM pending_migrations WHERE old_user_id = current_user_id;

  -- Generate a secure random token (using gen_random_uuid instead of gen_random_bytes for compatibility)
  new_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  -- Create the pending migration record
  INSERT INTO pending_migrations (old_user_id, migration_token)
  VALUES (current_user_id, new_token);

  RETURN new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initiate_email_migration() TO authenticated;

-- =============================================
-- STEP 3: Function to complete migration
-- =============================================

CREATE OR REPLACE FUNCTION public.complete_email_migration(p_migration_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
  migration_record pending_migrations%ROWTYPE;
  new_user_id uuid;
  old_user_id uuid;
  old_user_email text;
  records_updated integer := 0;
  temp_count integer;
  has_existing_data boolean := false;
BEGIN
  -- Get the new user's ID (the one completing the migration)
  new_user_id := auth.uid();

  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find and validate the migration record
  SELECT * INTO migration_record
  FROM pending_migrations
  WHERE migration_token = p_migration_token
    AND expires_at > NOW();

  IF migration_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired migration token'
    );
  END IF;

  old_user_id := migration_record.old_user_id;

  -- Cannot migrate to the same account
  IF new_user_id = old_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot migrate to the same account. Please sign in with a different Google account.'
    );
  END IF;

  -- Check if new account already has existing data
  SELECT EXISTS (SELECT 1 FROM public.vehicles WHERE user_id = new_user_id LIMIT 1)
      OR EXISTS (SELECT 1 FROM public.projects WHERE user_id = new_user_id LIMIT 1)
      OR EXISTS (SELECT 1 FROM public.parts WHERE user_id = new_user_id LIMIT 1)
  INTO has_existing_data;

  IF has_existing_data THEN
    -- Delete the pending migration record since we can't proceed
    DELETE FROM pending_migrations WHERE id = migration_record.id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'The selected Google account already has vehicles, projects, or parts. Please choose an account without existing data (an empty account is fine).'
    );
  END IF;

  -- Get old user's email for logging
  SELECT email INTO old_user_email FROM auth.users WHERE id = old_user_id;

  -- =============================================
  -- Transfer all data to new user
  -- =============================================

  -- Update parts
  UPDATE public.parts SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  records_updated := records_updated + temp_count;

  -- Update projects
  UPDATE public.projects SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  records_updated := records_updated + temp_count;

  -- Update vehicles
  UPDATE public.vehicles SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  records_updated := records_updated + temp_count;

  -- Update vendors
  UPDATE public.vendors SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  records_updated := records_updated + temp_count;

  -- Update vehicle_documents
  UPDATE public.vehicle_documents SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  records_updated := records_updated + temp_count;

  -- Update service_events
  UPDATE public.service_events SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  records_updated := records_updated + temp_count;

  -- =============================================
  -- Handle storage files (update paths and ownership)
  -- Note: Storage files use paths like vehicle-images/{user_id}/filename
  -- We need to: 1) update paths, 2) update ownership, 3) update URL references
  -- =============================================

  -- Update vehicle-images paths in storage
  UPDATE storage.objects
  SET name = regexp_replace(name, '^vehicle-images/' || old_user_id::text || '/', 'vehicle-images/' || new_user_id::text || '/')
  WHERE bucket_id = 'vehicles'
    AND name LIKE 'vehicle-images/' || old_user_id::text || '/%';

  -- Update vehicle-documents paths in storage
  UPDATE storage.objects
  SET name = regexp_replace(name, '^vehicle-documents/' || old_user_id::text || '/', 'vehicle-documents/' || new_user_id::text || '/')
  WHERE bucket_id = 'vehicles'
    AND name LIKE 'vehicle-documents/' || old_user_id::text || '/%';

  -- Update storage object ownership to new user
  UPDATE storage.objects
  SET owner = new_user_id
  WHERE owner = old_user_id
    AND bucket_id = 'vehicles';

  -- Update image_url in vehicles table
  -- Handle both full URLs (with /) and path-only values (without leading /)
  UPDATE public.vehicles
  SET image_url = replace(image_url, old_user_id::text, new_user_id::text)
  WHERE user_id = new_user_id
    AND image_url LIKE '%' || old_user_id::text || '%';

  -- Update file_url in vehicle_documents table
  -- Handle both full URLs and path-only values
  UPDATE public.vehicle_documents
  SET file_url = replace(file_url, old_user_id::text, new_user_id::text)
  WHERE user_id = new_user_id
    AND file_url LIKE '%' || old_user_id::text || '%';

  -- =============================================
  -- Cleanup
  -- =============================================

  -- Delete the pending migration record
  DELETE FROM pending_migrations WHERE id = migration_record.id;

  -- Delete the old user account from auth.users
  DELETE FROM auth.users WHERE id = old_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'records_transferred', records_updated,
    'old_email', old_user_email
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_email_migration(TEXT) TO authenticated;

-- =============================================
-- STEP 4: Function to cancel pending migration
-- =============================================

CREATE OR REPLACE FUNCTION public.cancel_email_migration()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM pending_migrations WHERE old_user_id = current_user_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_email_migration() TO authenticated;

-- =============================================
-- STEP 5: Cleanup job for expired migrations
-- =============================================

-- This function can be called periodically to clean up expired migrations
CREATE OR REPLACE FUNCTION public.cleanup_expired_migrations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM pending_migrations WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Only allow service role to call this cleanup function
REVOKE ALL ON FUNCTION public.cleanup_expired_migrations() FROM PUBLIC;

COMMENT ON FUNCTION public.initiate_email_migration() IS
  'Initiates an email migration by creating a secure token. The user must then sign in with their new Google account and call complete_email_migration with this token.';

COMMENT ON FUNCTION public.complete_email_migration(TEXT) IS
  'Completes an email migration by transferring all data from the old account to the currently authenticated account. Requires a valid migration token.';

COMMENT ON FUNCTION public.cancel_email_migration() IS
  'Cancels any pending email migration for the current user.';
