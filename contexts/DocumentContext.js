import React, { createContext, useContext, useState, useCallback } from 'react';
import * as documentsService from '../services/documentsService';

const DocumentContext = createContext(null);

export const DocumentProvider = ({ children, userId }) => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentFile, setNewDocumentFile] = useState(null);
  const [isDraggingDocument, setIsDraggingDocument] = useState(false);

  // Load documents for a specific vehicle and resolve file URLs
  const loadDocuments = useCallback(async (vehicleId) => {
    if (!vehicleId) {
      setDocuments([]);
      return;
    }
    try {
      setLoadingDocuments(true);
      const data = await documentsService.getVehicleDocuments(vehicleId);

      if (data && data.length > 0) {
        const filePaths = data
          .map(doc => doc.file_url)
          .filter(url => url && !url.startsWith('http'));

        if (filePaths.length > 0) {
          try {
            const urlMap = await documentsService.getDocumentFileUrls(filePaths);
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
            setDocuments(data);
          }
        } else {
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
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  // Add a new document - matches original hook signature
  const addDocument = useCallback(async (vehicleId, title, file) => {
    if (!vehicleId || !title || !file || !userId) return null;

    try {
      setUploadingDocument(true);
      const fileUrl = await documentsService.uploadDocumentFile(file, userId);
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
  }, [userId]);

  // Delete a document
  const deleteDocument = useCallback(async (documentId, fileUrl) => {
    try {
      await documentsService.deleteDocument(documentId, fileUrl);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error) {
      alert('Error deleting document');
    }
  }, []);

  // Handle document file selection
  const handleDocumentFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Document size must be less than 10MB');
        return;
      }
      setNewDocumentFile(file);
    }
  }, []);

  // Clear document selection
  const clearDocumentSelection = useCallback(() => {
    setNewDocumentFile(null);
    setNewDocumentTitle('');
  }, []);

  // Open document in new tab
  const openDocument = useCallback(async (document) => {
    if (!document) return;

    if (document.file_url_resolved) {
      window.open(document.file_url_resolved, '_blank');
      return;
    }

    if (document.file_url) {
      if (document.file_url.startsWith('http')) {
        window.open(document.file_url, '_blank');
      } else {
        try {
          const signedUrl = await documentsService.getDocumentFileUrl(document.file_url);
          window.open(signedUrl, '_blank');
        } catch (error) {
          alert('Error opening document');
        }
      }
    }
  }, []);

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

    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Document size must be less than 10MB');
        return;
      }
      setNewDocumentFile(file);
    }
  }, []);

  const value = {
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
    // Actions
    loadDocuments,
    addDocument,
    deleteDocument,
    handleDocumentFileChange,
    clearDocumentSelection,
    openDocument,
    handleDocumentDragEnter,
    handleDocumentDragLeave,
    handleDocumentDragOver,
    handleDocumentDrop
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
