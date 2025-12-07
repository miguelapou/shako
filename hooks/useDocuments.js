import { useState, useCallback } from 'react';
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
  const [isDocumentModalClosing, setIsDocumentModalClosing] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentFile, setNewDocumentFile] = useState(null);
  const [isDraggingDocument, setIsDraggingDocument] = useState(false);

  /**
   * Load documents for a specific vehicle and resolve file URLs
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

      if (data && data.length > 0) {
        // Resolve signed URLs for document files
        const filePaths = data
          .map(doc => doc.file_url)
          .filter(url => url && !url.startsWith('http'));

        if (filePaths.length > 0) {
          try {
            const urlMap = await documentsService.getDocumentFileUrls(filePaths);
            // Update documents with resolved URLs
            const withResolvedUrls = data.map(doc => {
              if (doc.file_url && !doc.file_url.startsWith('http')) {
                return {
                  ...doc,
                  file_url_resolved: urlMap[doc.file_url] || doc.file_url
                };
              }
              return {
                ...doc,
                file_url_resolved: doc.file_url
              };
            });
            setDocuments(withResolvedUrls);
          } catch (urlError) {
            // If URL resolution fails, use original data
            setDocuments(data);
          }
        } else {
          // No storage paths to resolve, use URLs as-is
          const withResolvedUrls = data.map(doc => ({
            ...doc,
            file_url_resolved: doc.file_url
          }));
          setDocuments(withResolvedUrls);
        }
      } else {
        setDocuments([]);
      }
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

  /**
   * Handle closing the add document modal with animation
   */
  const handleCloseDocumentModal = () => {
    // Start closing animation
    setIsDocumentModalClosing(true);
    setTimeout(() => {
      setIsDocumentModalClosing(false);
      setShowAddDocumentModal(false);
      setNewDocumentFile(null);
      setNewDocumentTitle('');
    }, 150);
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
   * Uses resolved URL if available, otherwise gets signed URL on-demand
   * @param {Object} document - Document object with file_url and file_url_resolved
   */
  const openDocument = async (document) => {
    if (!document) return;

    // Use resolved URL if available
    if (document.file_url_resolved) {
      window.open(document.file_url_resolved, '_blank');
      return;
    }

    // Fall back to original URL (legacy or already a full URL)
    if (document.file_url) {
      if (document.file_url.startsWith('http')) {
        window.open(document.file_url, '_blank');
      } else {
        // Get signed URL on-demand
        try {
          const signedUrl = await documentsService.getDocumentFileUrl(document.file_url);
          window.open(signedUrl, '_blank');
        } catch (error) {
          alert('Error opening document');
        }
      }
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
    isDocumentModalClosing,
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
    handleCloseDocumentModal,
    openDocument,

    // Drag and drop handlers
    handleDocumentDragEnter,
    handleDocumentDragLeave,
    handleDocumentDragOver,
    handleDocumentDrop
  };
};

export default useDocuments;
