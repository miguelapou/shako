import { supabase } from '../lib/supabase';

/**
 * Service layer for vendors-related Supabase operations
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

export const upsertVendor = async (vendorName, color, userId) => {
  try {
    const { data: existing } = await supabase
      .from('vendors')
      .select('id')
      .eq('name', vendorName)
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('vendors')
        .update({ color })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('vendors')
        .insert({ name: vendorName, color, user_id: userId });
      if (error) throw error;
    }
  } catch (error) {
    if (error.code === 'PGRST116') {
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
