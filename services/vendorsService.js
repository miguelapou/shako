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
 * @param {string} userId - User ID to filter by (defense-in-depth with RLS)
 * @returns {Promise<Array>} Array of vendors
 * @throws {Error} With context about the failed operation
 */
export const getAllVendors = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
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
    // Use maybeSingle() so 0 rows returns null (no error) instead of HTTP 406
    const { data: existing, error: selectError } = await supabase
      .from('vendors')
      .select('id')
      .eq('name', vendorName)
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) throw selectError;

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

      if (error) {
        // 23505 = unique_violation: a concurrent request already inserted this vendor
        if (error.code === '23505') {
          const { error: updateError } = await supabase
            .from('vendors')
            .update({ color })
            .eq('name', vendorName)
            .eq('user_id', userId);

          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    error.message = `Failed to save vendor color: ${error.message}`;
    throw error;
  }
};

/**
 * Delete a vendor by name
 * @param {string} vendorName - Vendor name to delete
 * @param {string} userId - User ID to filter by (prevents cross-user deletes)
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const deleteVendor = async (vendorName, userId) => {
  try {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('name', vendorName)
      .eq('user_id', userId);

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
 * @param {string} userId - User ID to filter by (prevents cross-user updates)
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const renameVendor = async (oldName, newName, userId) => {
  try {
    const { error } = await supabase
      .from('vendors')
      .update({ name: newName })
      .eq('name', oldName)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to rename vendor: ${error.message}`;
    throw error;
  }
};
