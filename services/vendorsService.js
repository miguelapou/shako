import { supabase } from '../lib/supabase';

/**
 * Service layer for vendors-related Supabase operations
 * Centralizes all database calls for vendors table
 */

/**
 * Load all vendors from database
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
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const upsertVendor = async (vendorName, color) => {
  try {
    const { error } = await supabase
      .from('vendors')
      .upsert(
        { name: vendorName, color },
        { onConflict: 'name' }
      );

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to save vendor color: ${error.message}`;
    throw error;
  }
};
