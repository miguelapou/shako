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
-- STEP 1: Configure the bucket
-- =============================================

-- Update bucket to be private (if it exists)
UPDATE storage.buckets
SET public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']::text[]
WHERE id = 'vehicles';

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

-- Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload vehicle files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicles' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow authenticated users to view their own files
CREATE POLICY "Users can view own vehicle files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicles' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update own vehicle files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicles' AND
  (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'vehicles' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own vehicle files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicles' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- =============================================
-- ALTERNATIVE: Public read access (optional)
-- =============================================

-- If you want images to be publicly viewable (e.g., for sharing vehicle photos)
-- but still restrict upload/delete to owners, uncomment and run these:

-- DROP POLICY IF EXISTS "Users can view own vehicle files" ON storage.objects;
-- CREATE POLICY "Public can view vehicle files"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'vehicles');

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

-- =============================================
-- ROLLBACK (if needed)
-- =============================================

-- DROP POLICY IF EXISTS "Users can upload vehicle files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can view own vehicle files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update own vehicle files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own vehicle files" ON storage.objects;
-- UPDATE storage.buckets SET public = true WHERE id = 'vehicles';
