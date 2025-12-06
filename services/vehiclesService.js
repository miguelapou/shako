import { supabase } from '../lib/supabase';
import { deleteAllVehicleDocuments } from './documentsService';

/**
 * Service layer for vehicles-related Supabase operations
 * Centralizes all database calls for vehicles table and storage operations
 *
 * Note: With RLS enabled, queries automatically filter by authenticated user.
 * user_id must be included when creating new records.
 */

/**
 * Load all vehicles for the authenticated user
 * @returns {Promise<Array>} Array of vehicles
 * @throws {Error} With context about the failed operation
 */
export const getAllVehicles = async () => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('display_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    error.message = `Failed to load vehicles: ${error.message}`;
    throw error;
  }
};

/**
 * Create a new vehicle
 * @param {Object} vehicleData - Vehicle data to insert
 * @param {string} userId - User ID to associate with the vehicle
 * @returns {Promise<Object>} Created vehicle
 * @throws {Error} With context about the failed operation
 */
export const createVehicle = async (vehicleData, userId) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([{ ...vehicleData, user_id: userId }])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    error.message = `Failed to create vehicle: ${error.message}`;
    throw error;
  }
};

/**
 * Update a vehicle by ID
 * @param {number} vehicleId - Vehicle ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const updateVehicle = async (vehicleId, updates) => {
  try {
    const { error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', vehicleId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to update vehicle: ${error.message}`;
    throw error;
  }
};

/**
 * Delete a vehicle by ID
 * Also cleans up associated document files from storage
 * @param {number} vehicleId - Vehicle ID
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const deleteVehicle = async (vehicleId) => {
  try {
    // Clean up document files from storage before deleting vehicle
    // (database records will be deleted via CASCADE)
    await deleteAllVehicleDocuments(vehicleId);

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to delete vehicle: ${error.message}`;
    throw error;
  }
};

/**
 * Update display order for a vehicle
 * @param {number} vehicleId - Vehicle ID
 * @param {number} displayOrder - New display order
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const updateVehicleDisplayOrder = async (vehicleId, displayOrder) => {
  try {
    const { error } = await supabase
      .from('vehicles')
      .update({ display_order: displayOrder })
      .eq('id', vehicleId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to update vehicle order: ${error.message}`;
    throw error;
  }
};

/**
 * Upload a vehicle image to Supabase storage
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID for organizing storage
 * @returns {Promise<string>} Public URL of uploaded image
 * @throws {Error} With context about the failed operation
 */
export const uploadVehicleImage = async (file, userId) => {
  try {
    // Create a unique filename with user folder and timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `vehicle-images/${userId}/${fileName}`;

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
  } catch (error) {
    error.message = `Failed to upload vehicle image: ${error.message}`;
    throw error;
  }
};
