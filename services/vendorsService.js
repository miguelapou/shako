import { supabase } from '../lib/supabase';

/**
 * Service layer for vendors-related Supabase operations
 * Centralizes all database calls for vendors table
 */

/**
 * Load all vendors from database
 * @returns {Promise<Array>} Array of vendors
 */
export const getAllVendors = async () => {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Upsert a vendor (insert or update)
 * @param {string} vendorName - Vendor name
 * @param {string} color - Vendor color
 * @returns {Promise<void>}
 */
export const upsertVendor = async (vendorName, color) => {
  const { error } = await supabase
    .from('vendors')
    .upsert(
      { name: vendorName, color },
      { onConflict: 'name' }
    );

  if (error) throw error;
};
