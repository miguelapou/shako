import { supabase } from '../lib/supabase';

/**
 * Service layer for vendors-related Supabase operations
 * Centralizes all database calls for vendors table
 *
 * Note: With RLS enabled, queries automatically filter by authenticated user.
 * user_id must be included when creating new records.
 */

/**
 * Load all vendors for the authenticated user
 * @returns {Promise<Array>} Array of vendors
 * @throws {Error} With context about the failed operation
 */
export const getAllVendors = async () => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    error.message = `Failed to load vendors: ${error.message}`;
    throw error;
  }
};

/**
 * Upsert a vendor (insert or update)
 * @param {string} vendorName - Vendor name
 * @param {string} color - Vendor color
 * @param {string} userId - User ID to associate with the vendor
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const upsertVendor = async (vendorName, color, userId) => {
  try {
    // First check if vendor exists for this user
    const { data: existing } = await supabase
      .from('vendors')
      .select('id')
      .eq('name', vendorName)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing vendor
      const { error } = await supabase
        .from('vendors')
        .update({ color })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new vendor
      const { error } = await supabase
        .from('vendors')
        .insert({ name: vendorName, color, user_id: userId });

      if (error) throw error;
    }
  } catch (error) {
    // Ignore "no rows" error from .single() when vendor doesn't exist
    if (error.code === 'PGRST116') {
      // Vendor doesn't exist, insert it
      const { error: insertError } = await supabase
        .from('vendors')
        .insert({ name: vendorName, color, user_id: userId });

      if (insertError) {
        insertError.message = `Failed to save vendor color: ${insertError.message}`;
        throw insertError;
      }
      return;
    }
    error.message = `Failed to save vendor color: ${error.message}`;
    throw error;
  }
};

/**
 * Delete a vendor by name
 * @param {string} vendorName - Vendor name to delete
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const deleteVendor = async (vendorName) => {
  try {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('name', vendorName);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to delete vendor: ${error.message}`;
    throw error;
  }
};

/**
 * Rename a vendor
 * @param {string} oldName - Current vendor name
 * @param {string} newName - New vendor name
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const renameVendor = async (oldName, newName) => {
  try {
    const { error } = await supabase
      .from('vendors')
      .update({ name: newName })
      .eq('name', oldName);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to rename vendor: ${error.message}`;
    throw error;
  }
};
