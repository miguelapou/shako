import { supabase } from '../lib/supabase';

/**
 * Service layer for vehicle documents-related Supabase operations
 * Centralizes all database calls for vehicle_documents table and storage operations
 *
 * Note: With RLS enabled, queries automatically filter by authenticated user.
 * user_id must be included when creating new records.
 */

/**
 * Load all documents for a specific vehicle
 * @param {number} vehicleId - Vehicle ID
 * @returns {Promise<Array>} Array of documents
 * @throws {Error} With context about the failed operation
 */
export const getVehicleDocuments = async (vehicleId) => {
  try {
    const { data, error } = await supabase
      .from('vehicle_documents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    error.message = `Failed to load documents: ${error.message}`;
    throw error;
  }
};

/**
 * Create a new document record
 * @param {Object} documentData - Document data to insert
 * @param {string} userId - User ID to associate with the document
 * @returns {Promise<Object>} Created document
 * @throws {Error} With context about the failed operation
 */
export const createDocument = async (documentData, userId) => {
  try {
    const { data, error } = await supabase
      .from('vehicle_documents')
      .insert([{ ...documentData, user_id: userId }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    error.message = `Failed to create document: ${error.message}`;
    throw error;
  }
};

/**
 * Update a document by ID
 * @param {number} documentId - Document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const updateDocument = async (documentId, updates) => {
  try {
    const { error } = await supabase
      .from('vehicle_documents')
      .update(updates)
      .eq('id', documentId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to update document: ${error.message}`;
    throw error;
  }
};

/**
 * Delete a document by ID
 * @param {number} documentId - Document ID
 * @param {string} fileUrl - URL of the file to delete from storage
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const deleteDocument = async (documentId, fileUrl) => {
  try {
    // Extract the file path from the URL to delete from storage
    if (fileUrl) {
      const urlParts = fileUrl.split('/vehicle-documents/');
      if (urlParts.length > 1) {
        const filePath = `vehicle-documents/${urlParts[1]}`;
        await supabase.storage.from('vehicles').remove([filePath]);
      }
    }

    // Delete the database record
    const { error } = await supabase
      .from('vehicle_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to delete document: ${error.message}`;
    throw error;
  }
};

/**
 * Delete all documents for a vehicle (including storage files)
 * @param {number} vehicleId - Vehicle ID
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const deleteAllVehicleDocuments = async (vehicleId) => {
  try {
    // First, get all documents for this vehicle to get their file URLs
    const documents = await getVehicleDocuments(vehicleId);

    // Delete files from storage
    if (documents.length > 0) {
      const filePaths = documents
        .filter(doc => doc.file_url)
        .map(doc => {
          const urlParts = doc.file_url.split('/vehicle-documents/');
          if (urlParts.length > 1) {
            return `vehicle-documents/${urlParts[1]}`;
          }
          return null;
        })
        .filter(Boolean);

      if (filePaths.length > 0) {
        await supabase.storage.from('vehicles').remove(filePaths);
      }
    }

    // Database records will be deleted via CASCADE when vehicle is deleted
  } catch (error) {
    error.message = `Failed to delete vehicle documents: ${error.message}`;
    throw error;
  }
};

/**
 * Upload a document file to Supabase storage
 * @param {File} file - Document file to upload
 * @param {string} userId - User ID for organizing storage
 * @returns {Promise<string>} Public URL of uploaded document
 * @throws {Error} With context about the failed operation
 */
export const uploadDocumentFile = async (file, userId) => {
  try {
    // Create a unique filename with user folder and timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `vehicle-documents/${userId}/${fileName}`;

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
    error.message = `Failed to upload document: ${error.message}`;
    throw error;
  }
};
