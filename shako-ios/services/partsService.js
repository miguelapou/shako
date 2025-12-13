import { supabase } from '../lib/supabase';

/**
 * Service layer for parts-related Supabase operations
 * Centralizes all database calls for parts table
 */

export const getAllParts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    error.message = `Failed to load parts: ${error.message}`;
    throw error;
  }
};

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

export const updatePartsVendor = async (oldVendorName, newVendorName, userId) => {
  try {
    const { error } = await supabase
      .from('parts')
      .update({ vendor: newVendorName })
      .eq('vendor', oldVendorName)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to rename vendor: ${error.message}`;
    throw error;
  }
};

export const removeVendorFromParts = async (vendorName, userId) => {
  try {
    const { error } = await supabase
      .from('parts')
      .update({ vendor: '' })
      .eq('vendor', vendorName)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to remove vendor from parts: ${error.message}`;
    throw error;
  }
};
