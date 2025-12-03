import { supabase } from '../lib/supabase';

/**
 * Service layer for vehicles-related Supabase operations
 * Centralizes all database calls for vehicles table and storage operations
 */

/**
 * Load all vehicles from database
 * @returns {Promise<Array>} Array of vehicles
 */
export const getAllVehicles = async () => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('display_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Create a new vehicle
 * @param {Object} vehicleData - Vehicle data to insert
 * @returns {Promise<Object>} Created vehicle
 */
export const createVehicle = async (vehicleData) => {
  const { data, error } = await supabase
    .from('vehicles')
    .insert([vehicleData])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Update a vehicle by ID
 * @param {number} vehicleId - Vehicle ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateVehicle = async (vehicleId, updates) => {
  const { error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', vehicleId);

  if (error) throw error;
};

/**
 * Delete a vehicle by ID
 * @param {number} vehicleId - Vehicle ID
 * @returns {Promise<void>}
 */
export const deleteVehicle = async (vehicleId) => {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId);

  if (error) throw error;
};

/**
 * Update display order for a vehicle
 * @param {number} vehicleId - Vehicle ID
 * @param {number} displayOrder - New display order
 * @returns {Promise<void>}
 */
export const updateVehicleDisplayOrder = async (vehicleId, displayOrder) => {
  const { error } = await supabase
    .from('vehicles')
    .update({ display_order: displayOrder })
    .eq('id', vehicleId);

  if (error) throw error;
};

/**
 * Upload a vehicle image to Supabase storage
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Public URL of uploaded image
 */
export const uploadVehicleImage = async (file) => {
  // Create a unique filename with timestamp
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `vehicle-images/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('vehicles')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('vehicles')
    .getPublicUrl(filePath);

  return publicUrl;
};
