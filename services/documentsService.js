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
 * @returns {Promise<string>} Storage path of uploaded document (use getDocumentFileUrl to get accessible URL)
 * @throws {Error} With context about the failed operation
 */
export const uploadDocumentFile = async (file, userId) => {
  try {
    // Create a unique filename with user folder and timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `vehicle-documents/${userId}/${fileName}`;

    // Determine content type - use file.type or fallback for zip files
    let contentType = file.type;
    if (fileExt.toLowerCase() === 'zip' && !contentType) {
      contentType = 'application/zip';
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType || undefined
      });

    if (error) throw error;

    // Return the storage path - URL will be generated on demand
    return filePath;
  } catch (error) {
    error.message = `Failed to upload document: ${error.message}`;
    throw error;
  }
};

/**
 * Get a signed URL for a document file
 * @param {string} filePath - Storage path of the document
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Signed URL for the document
 * @throws {Error} With context about the failed operation
 */
export const getDocumentFileUrl = async (filePath, expiresIn = 3600) => {
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
    error.message = `Failed to get document URL: ${error.message}`;
    throw error;
  }
};

/**
 * Get signed URLs for multiple document files (batch operation)
 * @param {string[]} filePaths - Array of storage paths
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<Object>} Map of filePath to signedUrl
 * @throws {Error} With context about the failed operation
 */
export const getDocumentFileUrls = async (filePaths, expiresIn = 3600) => {
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
    error.message = `Failed to get document URLs: ${error.message}`;
    throw error;
  }
};
