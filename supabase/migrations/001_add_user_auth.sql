-- Migration: Add user authentication and Row Level Security
-- Run this in your Supabase SQL Editor

-- =============================================
-- STEP 1: Add user_id columns to all tables
-- =============================================

-- Add user_id to parts table
ALTER TABLE parts
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to vehicles table
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to vehicle_documents table (if not already linked via vehicle)
ALTER TABLE vehicle_documents
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- =============================================
-- STEP 2: Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_parts_user_id ON parts(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_user_id ON vehicle_documents(user_id);

-- =============================================
-- STEP 3: Enable Row Level Security
-- =============================================

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: Create RLS Policies for PARTS
-- =============================================

-- Users can only see their own parts
CREATE POLICY "Users can view own parts" ON parts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert parts for themselves
CREATE POLICY "Users can insert own parts" ON parts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own parts
CREATE POLICY "Users can update own parts" ON parts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own parts
CREATE POLICY "Users can delete own parts" ON parts
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 5: Create RLS Policies for PROJECTS
-- =============================================

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 6: Create RLS Policies for VEHICLES
-- =============================================

CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 7: Create RLS Policies for VENDORS
-- =============================================

CREATE POLICY "Users can view own vendors" ON vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendors" ON vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendors" ON vendors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendors" ON vendors
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 8: Create RLS Policies for VEHICLE_DOCUMENTS
-- =============================================

CREATE POLICY "Users can view own vehicle_documents" ON vehicle_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicle_documents" ON vehicle_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicle_documents" ON vehicle_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicle_documents" ON vehicle_documents
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 9: Storage Policies for vehicle images/documents
-- =============================================

-- Note: Run these in the Supabase Dashboard under Storage > Policies
-- or use the following SQL if your bucket is set up:

-- Allow authenticated users to upload to their own folder
-- CREATE POLICY "Users can upload vehicle files"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'vehicles' AND
--   auth.role() = 'authenticated'
-- );

-- Allow users to view all vehicle files (public bucket)
-- CREATE POLICY "Public can view vehicle files"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'vehicles');

-- Allow users to delete their uploaded files
-- CREATE POLICY "Users can delete own vehicle files"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'vehicles' AND
--   auth.role() = 'authenticated'
-- );

-- =============================================
-- VERIFICATION QUERIES (run after migration)
-- =============================================

-- Check that columns were added:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'parts' AND column_name = 'user_id';

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename IN ('parts', 'projects', 'vehicles', 'vendors');

-- List all policies:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
