-- =============================================
-- Migration: Fix storage handling in email migration
-- =============================================
-- Problem: The previous migration tried to rename storage object paths by
-- updating storage.objects.name, but Supabase Storage doesn't support this -
-- the underlying file data stays at the original path, making files inaccessible.
--
-- Solution:
-- 1. Update complete_email_migration to NOT modify storage paths or URL columns
-- 2. Update storage RLS policies to allow access based on 'owner' column
--    (the migration already correctly updates owner to the new user)
-- =============================================

-- =============================================
-- STEP 1: Update storage RLS policies to check owner
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload vehicle files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own vehicle files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own vehicle files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own vehicle files" ON storage.objects;

-- Policy: Allow authenticated users to upload files to their own folder
-- (unchanged - users still upload to their own folder)
CREATE POLICY "Users can upload vehicle files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicles' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow authenticated users to view files they own OR files in their folder
-- This allows access to transferred files (owner updated) even if path has old user ID
CREATE POLICY "Users can view own vehicle files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicles' AND
  (
    (storage.foldername(name))[2] = auth.uid()::text
    OR owner = auth.uid()
  )
);

-- Policy: Allow authenticated users to update files they own OR files in their folder
CREATE POLICY "Users can update own vehicle files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicles' AND
  (
    (storage.foldername(name))[2] = auth.uid()::text
    OR owner = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'vehicles' AND
  (
    (storage.foldername(name))[2] = auth.uid()::text
    OR owner = auth.uid()
  )
);

-- Policy: Allow authenticated users to delete files they own OR files in their folder
CREATE POLICY "Users can delete own vehicle files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicles' AND
  (
    (storage.foldername(name))[2] = auth.uid()::text
    OR owner = auth.uid()
  )
);

-- =============================================
-- STEP 2: Update complete_email_migration function
-- =============================================
-- Remove the broken storage path renaming logic
-- Keep only: ownership transfer (which works correctly)

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

  -- Update vehicles (image_url paths stay the same - RLS now allows access via owner)
  UPDATE public.vehicles SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  records_updated := records_updated + temp_count;

  -- Update vendors
  UPDATE public.vendors SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  records_updated := records_updated + temp_count;

  -- Update vehicle_documents (file_url paths stay the same - RLS now allows access via owner)
  UPDATE public.vehicle_documents SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  records_updated := records_updated + temp_count;

  -- Update service_events
  UPDATE public.service_events SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  records_updated := records_updated + temp_count;

  -- =============================================
  -- Handle storage files
  -- =============================================
  -- Only update ownership - DO NOT try to rename paths!
  -- The file paths (e.g., vehicle-images/OLD_USER_ID/file.jpg) stay the same.
  -- Updated RLS policies allow the new owner to access files via the 'owner' column.

  UPDATE storage.objects
  SET owner = new_user_id
  WHERE owner = old_user_id
    AND bucket_id = 'vehicles';

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

-- =============================================
-- VERIFICATION (run after migration)
-- =============================================
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects';

-- =============================================
-- NOTE: Previously corrupted data
-- =============================================
-- If a migration already ran with the broken logic, images may be inaccessible.
-- Users with corrupted data will need to re-upload their vehicle images.
