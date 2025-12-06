-- Migration: Add RLS policies to Supabase Storage for vehicle images/documents
-- Run this in your Supabase SQL Editor
--
-- Storage Structure:
--   Bucket: vehicles
--   Paths:
--     - vehicle-images/{user_id}/{filename}
--     - vehicle-documents/{user_id}/{filename}
--
-- This migration secures the storage bucket so users can only access their own files.

-- =============================================
-- STEP 1: Ensure the bucket exists and configure it
-- =============================================

-- Insert the bucket if it doesn't exist (or update if it does)
-- Set public = false to require authentication for all access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicles',
  'vehicles',
  false,  -- Private bucket - requires authentication
  52428800,  -- 50MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']::text[];

-- =============================================
-- STEP 2: Remove any existing policies (clean slate)
-- =============================================

DROP POLICY IF EXISTS "Users can upload vehicle files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own vehicle files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own vehicle files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own vehicle files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view vehicle files" ON storage.objects;

-- =============================================
-- STEP 3: Create RLS Policies for Storage
-- =============================================

-- Helper function to extract user_id from storage path
-- Path format: vehicle-images/{user_id}/{filename} or vehicle-documents/{user_id}/{filename}
CREATE OR REPLACE FUNCTION storage.get_user_id_from_path(path text)
RETURNS uuid AS $$
BEGIN
  -- Split path by '/' and get the second element (index 2 in split_part is 1-based)
  -- Example: 'vehicle-images/abc-123-uuid/file.jpg' -> 'abc-123-uuid'
  RETURN (split_part(path, '/', 2))::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Policy: Allow authenticated users to upload files to their own folder
-- Checks that the user_id in the path matches the authenticated user
CREATE POLICY "Users can upload vehicle files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicles' AND
  storage.get_user_id_from_path(name) = auth.uid()
);

-- Policy: Allow authenticated users to view their own files
CREATE POLICY "Users can view own vehicle files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicles' AND
  storage.get_user_id_from_path(name) = auth.uid()
);

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update own vehicle files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicles' AND
  storage.get_user_id_from_path(name) = auth.uid()
)
WITH CHECK (
  bucket_id = 'vehicles' AND
  storage.get_user_id_from_path(name) = auth.uid()
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own vehicle files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicles' AND
  storage.get_user_id_from_path(name) = auth.uid()
);

-- =============================================
-- ALTERNATIVE: Public read access (optional)
-- =============================================

-- If you want images to be publicly viewable (e.g., for sharing vehicle photos)
-- but still restrict upload/delete to owners, use these policies instead:

-- Uncomment the following to allow public read access:
-- DROP POLICY IF EXISTS "Users can view own vehicle files" ON storage.objects;
-- CREATE POLICY "Public can view vehicle files"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'vehicles');

-- And update the bucket to be public for reads:
-- UPDATE storage.buckets SET public = true WHERE id = 'vehicles';

-- =============================================
-- VERIFICATION QUERIES (run after migration)
-- =============================================

-- Check bucket configuration:
-- SELECT id, name, public, file_size_limit, allowed_mime_types
-- FROM storage.buckets WHERE id = 'vehicles';

-- List storage policies:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects';

-- Test the helper function:
-- SELECT storage.get_user_id_from_path('vehicle-images/123e4567-e89b-12d3-a456-426614174000/test.jpg');

-- =============================================
-- ROLLBACK (if needed)
-- =============================================

-- To rollback this migration, run:
-- DROP POLICY IF EXISTS "Users can upload vehicle files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can view own vehicle files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update own vehicle files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own vehicle files" ON storage.objects;
-- DROP FUNCTION IF EXISTS storage.get_user_id_from_path(text);
-- UPDATE storage.buckets SET public = true WHERE id = 'vehicles';
