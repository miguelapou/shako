import { useState } from 'react';
import * as documentsService from '../services/documentsService';

/**
 * Custom hook for managing vehicle documents
 *
 * Features:
 * - Load documents for a specific vehicle
 * - Add, update, and delete documents
 * - File upload to Supabase storage
 *
 * @param {string} userId - Current user's ID for data isolation
 * @returns {Object} Documents state and operations
 */
const useDocuments = (userId) => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentFile, setNewDocumentFile] = useState(null);
  const [isDraggingDocument, setIsDraggingDocument] = useState(false);

  /**
   * Load documents for a specific vehicle
   * @param {number} vehicleId - Vehicle ID
   */
  const loadDocuments = async (vehicleId) => {
    if (!vehicleId) {
      setDocuments([]);
      return;
    }
    try {
      setLoadingDocuments(true);
      const data = await documentsService.getVehicleDocuments(vehicleId);
      setDocuments(data || []);
    } catch (error) {
      // Error loading documents - silently fail
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  /**
   * Add a new document
   * @param {number} vehicleId - Vehicle ID
   * @param {string} title - Document title
   * @param {File} file - Document file
   */
  const addDocument = async (vehicleId, title, file) => {
    if (!vehicleId || !title || !file || !userId) return null;

    try {
      setUploadingDocument(true);

      // Upload file to storage
      const fileUrl = await documentsService.uploadDocumentFile(file, userId);

      // Create document record
      const documentData = {
        vehicle_id: vehicleId,
        title: title,
        file_url: fileUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size
      };

      const newDocument = await documentsService.createDocument(documentData, userId);
      setDocuments(prev => [newDocument, ...prev]);

      return newDocument;
    } catch (error) {
      alert('Error uploading document. Please try again.');
      return null;
    } finally {
      setUploadingDocument(false);
    }
  };

  /**
   * Update a document title
   * @param {number} documentId - Document ID
   * @param {string} newTitle - New title
   */
  const updateDocumentTitle = async (documentId, newTitle) => {
    try {
      await documentsService.updateDocument(documentId, { title: newTitle });
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === documentId ? { ...doc, title: newTitle } : doc
        )
      );
    } catch (error) {
      alert('Error updating document');
    }
  };

  /**
   * Delete a document
   * @param {number} documentId - Document ID
   * @param {string} fileUrl - File URL to delete from storage
   */
  const deleteDocument = async (documentId, fileUrl) => {
    try {
      await documentsService.deleteDocument(documentId, fileUrl);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error) {
      alert('Error deleting document');
    }
  };

  /**
   * Handle document file selection
   * @param {Event} e - File input change event
   */
  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB for documents)
      if (file.size > 10 * 1024 * 1024) {
        alert('Document size must be less than 10MB');
        return;
      }
      setNewDocumentFile(file);
    }
  };

  /**
   * Clear document selection
   */
  const clearDocumentSelection = () => {
    setNewDocumentFile(null);
    setNewDocumentTitle('');
  };

  // ========================================
  // DOCUMENT DRAG AND DROP HANDLERS
  // ========================================

  const handleDocumentDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocument(true);
  };

  const handleDocumentDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocument(false);
  };

  const handleDocumentDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDocumentDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocument(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      // Validate file size (max 10MB for documents)
      if (file.size > 10 * 1024 * 1024) {
        alert('Document size must be less than 10MB');
        return;
      }
      setNewDocumentFile(file);
    }
  };

  /**
   * Open document in new tab
   * @param {string} fileUrl - File URL
   */
  const openDocument = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  return {
    // State
    documents,
    setDocuments,
    loadingDocuments,
    uploadingDocument,
    showAddDocumentModal,
    setShowAddDocumentModal,
    newDocumentTitle,
    setNewDocumentTitle,
    newDocumentFile,
    setNewDocumentFile,
    isDraggingDocument,

    // Operations
    loadDocuments,
    addDocument,
    updateDocumentTitle,
    deleteDocument,
    handleDocumentFileChange,
    clearDocumentSelection,
    openDocument,

    // Drag and drop handlers
    handleDocumentDragEnter,
    handleDocumentDragLeave,
    handleDocumentDragOver,
    handleDocumentDrop
  };
};

export default useDocuments;
