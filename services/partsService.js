import { supabase } from '../lib/supabase';

/**
 * Service layer for parts-related Supabase operations
 * Centralizes all database calls for parts table
 *
 * Note: With RLS enabled, queries automatically filter by authenticated user.
 * user_id must be included when creating new records.
 */

/**
 * Load all parts for the authenticated user
 * @returns {Promise<Array>} Array of parts
 * @throws {Error} With context about the failed operation
 */
export const getAllParts = async () => {
  try {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    error.message = `Failed to load parts: ${error.message}`;
    throw error;
  }
};

/**
 * Create a new part
 * @param {Object} partData - Part data to insert
 * @param {string} userId - User ID to associate with the part
 * @returns {Promise<Object>} Created part
 * @throws {Error} With context about the failed operation
 */
export const createPart = async (partData, userId) => {
  try {
    const { data, error } = await supabase
      .from('parts')
      .insert({ ...partData, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    error.message = `Failed to create part: ${error.message}`;
    throw error;
  }
};

/**
 * Update a part by ID
 * @param {number} partId - Part ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const updatePart = async (partId, updates) => {
  try {
    const { error } = await supabase
      .from('parts')
      .update(updates)
      .eq('id', partId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to update part: ${error.message}`;
    throw error;
  }
};

/**
 * Delete a part by ID
 * @param {number} partId - Part ID
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const deletePart = async (partId) => {
  try {
    const { error } = await supabase
      .from('parts')
      .delete()
      .eq('id', partId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to delete part: ${error.message}`;
    throw error;
  }
};

/**
 * Update all parts with a specific vendor name
 * @param {string} oldVendorName - Current vendor name
 * @param {string} newVendorName - New vendor name
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const updatePartsVendor = async (oldVendorName, newVendorName) => {
  try {
    const { error } = await supabase
      .from('parts')
      .update({ vendor: newVendorName })
      .eq('vendor', oldVendorName);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to rename vendor: ${error.message}`;
    throw error;
  }
};

/**
 * Remove vendor from all parts
 * @param {string} vendorName - Vendor name to remove
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const removeVendorFromParts = async (vendorName) => {
  try {
    const { error } = await supabase
      .from('parts')
      .update({ vendor: '' })
      .eq('vendor', vendorName);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to remove vendor from parts: ${error.message}`;
    throw error;
  }
};
