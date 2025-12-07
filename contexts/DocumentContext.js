import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  fetchDocuments,
  uploadDocument,
  removeDocument,
  getDocumentUrl
} from '../services/documentsService';

const DocumentContext = createContext(null);

export const DocumentProvider = ({ children }) => {
  // Document list state
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Add document modal state
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentFile, setNewDocumentFile] = useState(null);
  const [isDraggingDocument, setIsDraggingDocument] = useState(false);

  // Load documents for a vehicle
  const loadDocuments = useCallback(async (vehicleId) => {
    if (!vehicleId) return;
    setLoadingDocuments(true);
    try {
      const docs = await fetchDocuments(vehicleId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  // Add a new document
  const addDocument = useCallback(async (vehicleId) => {
    if (!newDocumentFile || !vehicleId) return;

    setUploadingDocument(true);
    try {
      const title = newDocumentTitle.trim() || newDocumentFile.name;
      await uploadDocument(vehicleId, newDocumentFile, title);
      await loadDocuments(vehicleId);
      // Reset form
      setShowAddDocumentModal(false);
      setNewDocumentTitle('');
      setNewDocumentFile(null);
    } catch (error) {
      alert('Error uploading document: ' + error.message);
    } finally {
      setUploadingDocument(false);
    }
  }, [newDocumentFile, newDocumentTitle, loadDocuments]);

  // Delete a document
  const deleteDocument = useCallback(async (documentId, vehicleId) => {
    try {
      await removeDocument(documentId);
      await loadDocuments(vehicleId);
    } catch (error) {
      alert('Error deleting document: ' + error.message);
    }
  }, [loadDocuments]);

  // Open document in new tab
  const openDocument = useCallback(async (document) => {
    try {
      const url = await getDocumentUrl(document.file_path);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      alert('Error opening document: ' + error.message);
    }
  }, []);

  // File input change handler
  const handleDocumentFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewDocumentFile(file);
      if (!newDocumentTitle) {
        setNewDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [newDocumentTitle]);

  // Drag and drop handlers
  const handleDocumentDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocument(true);
  }, []);

  const handleDocumentDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocument(false);
  }, []);

  const handleDocumentDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDocumentDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocument(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setNewDocumentFile(file);
      if (!newDocumentTitle) {
        setNewDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [newDocumentTitle]);

  // Reset form state
  const resetDocumentForm = useCallback(() => {
    setShowAddDocumentModal(false);
    setNewDocumentTitle('');
    setNewDocumentFile(null);
    setIsDraggingDocument(false);
  }, []);

  const value = {
    // State
    documents,
    loadingDocuments,
    uploadingDocument,
    showAddDocumentModal,
    newDocumentTitle,
    newDocumentFile,
    isDraggingDocument,
    // Setters
    setShowAddDocumentModal,
    setNewDocumentTitle,
    setNewDocumentFile,
    // Actions
    loadDocuments,
    addDocument,
    deleteDocument,
    openDocument,
    handleDocumentFileChange,
    handleDocumentDragEnter,
    handleDocumentDragLeave,
    handleDocumentDragOver,
    handleDocumentDrop,
    resetDocumentForm
  };

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

export default DocumentContext;
