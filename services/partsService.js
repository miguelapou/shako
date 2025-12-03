import { supabase } from '../lib/supabase';

/**
 * Service layer for parts-related Supabase operations
 * Centralizes all database calls for parts table
 */

/**
 * Load all parts from database
 * @returns {Promise<Array>} Array of parts
 */
export const getAllParts = async () => {
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Create a new part
 * @param {Object} partData - Part data to insert
 * @returns {Promise<Object>} Created part
 */
export const createPart = async (partData) => {
  const { data, error } = await supabase
    .from('parts')
    .insert(partData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update a part by ID
 * @param {number} partId - Part ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updatePart = async (partId, updates) => {
  const { error } = await supabase
    .from('parts')
    .update(updates)
    .eq('id', partId);

  if (error) throw error;
};

/**
 * Delete a part by ID
 * @param {number} partId - Part ID
 * @returns {Promise<void>}
 */
export const deletePart = async (partId) => {
  const { error } = await supabase
    .from('parts')
    .delete()
    .eq('id', partId);

  if (error) throw error;
};

/**
 * Update all parts with a specific vendor name
 * @param {string} oldVendorName - Current vendor name
 * @param {string} newVendorName - New vendor name
 * @returns {Promise<void>}
 */
export const updatePartsVendor = async (oldVendorName, newVendorName) => {
  const { error } = await supabase
    .from('parts')
    .update({ vendor: newVendorName })
    .eq('vendor', oldVendorName);

  if (error) throw error;
};

/**
 * Remove vendor from all parts
 * @param {string} vendorName - Vendor name to remove
 * @returns {Promise<void>}
 */
export const removeVendorFromParts = async (vendorName) => {
  const { error } = await supabase
    .from('parts')
    .update({ vendor: '' })
    .eq('vendor', vendorName);

  if (error) throw error;
};
