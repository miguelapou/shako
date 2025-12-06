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
 * @returns {Promise<string>} Storage path of uploaded image (use getVehicleImageUrl to get accessible URL)
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

    // Return the storage path - URL will be generated on demand
    return filePath;
  } catch (error) {
    error.message = `Failed to upload vehicle image: ${error.message}`;
    throw error;
  }
};

/**
 * Get a signed URL for a vehicle image
 * @param {string} filePath - Storage path of the image
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Signed URL for the image
 * @throws {Error} With context about the failed operation
 */
export const getVehicleImageUrl = async (filePath, expiresIn = 3600) => {
  try {
    // If it's already a full URL (legacy data), return as-is
    if (filePath.startsWith('http')) {
      return filePath;
    }

    const { data, error } = await supabase.storage
      .from('vehicles')
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    error.message = `Failed to get vehicle image URL: ${error.message}`;
    throw error;
  }
};

/**
 * Get signed URLs for multiple vehicle images (batch operation)
 * @param {string[]} filePaths - Array of storage paths
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<Object>} Map of filePath to signedUrl
 * @throws {Error} With context about the failed operation
 */
export const getVehicleImageUrls = async (filePaths, expiresIn = 3600) => {
  try {
    const urlMap = {};

    // Separate legacy URLs from storage paths
    const pathsToSign = [];
    for (const path of filePaths) {
      if (path.startsWith('http')) {
        urlMap[path] = path;
      } else if (path) {
        pathsToSign.push(path);
      }
    }

    // Batch create signed URLs for storage paths
    if (pathsToSign.length > 0) {
      const { data, error } = await supabase.storage
        .from('vehicles')
        .createSignedUrls(pathsToSign, expiresIn);

      if (error) throw error;

      for (const item of data) {
        if (item.signedUrl) {
          urlMap[item.path] = item.signedUrl;
        }
      }
    }

    return urlMap;
  } catch (error) {
    error.message = `Failed to get vehicle image URLs: ${error.message}`;
    throw error;
  }
};
