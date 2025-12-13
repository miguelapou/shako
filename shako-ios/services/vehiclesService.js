import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

/**
 * Service layer for vehicles-related Supabase operations
 * Adapted for React Native with expo-image-picker
 */

const VALID_VEHICLE_COLUMNS = [
  'nickname',
  'name',
  'make',
  'year',
  'license_plate',
  'vin',
  'odometer_range',
  'odometer_unit',
  'color',
  'image_url',
  'archived',
  'display_order',
  'fuel_filter',
  'air_filter',
  'oil_filter',
  'oil_type',
  'oil_capacity',
  'oil_brand',
  'drain_plug',
  'battery',
  'insurance_policy'
];

const NUMERIC_COLUMNS = ['year', 'odometer_range', 'display_order'];

const filterValidColumns = (data) => {
  const filtered = {};
  for (const key of Object.keys(data)) {
    if (VALID_VEHICLE_COLUMNS.includes(key)) {
      const value = data[key];
      if (NUMERIC_COLUMNS.includes(key)) {
        if (value !== '' && value !== null && value !== undefined) {
          filtered[key] = value;
        }
      } else {
        if (value !== null && value !== undefined) {
          filtered[key] = value;
        }
      }
    }
  }
  return filtered;
};

export const getAllVehicles = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    error.message = `Failed to load vehicles: ${error.message}`;
    throw error;
  }
};

export const createVehicle = async (vehicleData, userId) => {
  try {
    const filteredData = filterValidColumns(vehicleData);
    const { data, error } = await supabase
      .from('vehicles')
      .insert([{ ...filteredData, user_id: userId }])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    error.message = `Failed to create vehicle: ${error.message}`;
    throw error;
  }
};

export const updateVehicle = async (vehicleId, updates) => {
  try {
    const filteredUpdates = filterValidColumns(updates);
    const { error } = await supabase
      .from('vehicles')
      .update(filteredUpdates)
      .eq('id', vehicleId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to update vehicle: ${error.message}`;
    throw error;
  }
};

export const deleteVehicle = async (vehicleId) => {
  try {
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
 * Upload a vehicle image to Supabase storage from React Native
 * @param {string} imageUri - Local URI from expo-image-picker
 * @param {string} userId - User ID for organizing storage
 * @returns {Promise<string>} Storage path of uploaded image
 */
export const uploadVehicleImage = async (imageUri, userId) => {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Get file extension from URI
    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `vehicle-images/${userId}/${fileName}`;

    // Convert base64 to ArrayBuffer and upload
    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExt}`,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return filePath;
  } catch (error) {
    error.message = `Failed to upload vehicle image: ${error.message}`;
    throw error;
  }
};

export const getVehicleImageUrl = async (filePath, expiresIn = 3600) => {
  try {
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

export const getVehicleImageUrls = async (filePaths, expiresIn = 3600) => {
  try {
    const urlMap = {};
    const pathsToSign = [];

    for (const path of filePaths) {
      if (path.startsWith('http')) {
        urlMap[path] = path;
      } else if (path) {
        pathsToSign.push(path);
      }
    }

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
