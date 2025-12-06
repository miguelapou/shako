-- =============================================
-- Migration: Add delete_user_account function
-- =============================================
-- This function allows users to delete their own account
-- and all associated data. It runs with elevated privileges
-- to access auth.users table.
-- =============================================

-- Create a function that deletes the current user's account
-- This function uses SECURITY DEFINER to run with owner privileges
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user's ID from the JWT
  current_user_id := auth.uid();

  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete user data from all tables (cascade should handle this, but being explicit)
  -- Note: ON DELETE CASCADE in foreign keys should handle most of this,
  -- but we explicitly delete to ensure everything is cleaned up

  -- Delete vehicle documents
  DELETE FROM public.vehicle_documents WHERE user_id = current_user_id;

  -- Delete parts
  DELETE FROM public.parts WHERE user_id = current_user_id;

  -- Delete projects
  DELETE FROM public.projects WHERE user_id = current_user_id;

  -- Delete vehicles
  DELETE FROM public.vehicles WHERE user_id = current_user_id;

  -- Delete vendor colors
  DELETE FROM public.vendors WHERE user_id = current_user_id;

  -- Delete the user from auth.users
  -- This requires the function to have SECURITY DEFINER
  DELETE FROM auth.users WHERE id = current_user_id;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION public.delete_user_account() IS
  'Deletes the current authenticated user and all their associated data.
   This action is irreversible.';
