import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { useUI } from '../../contexts';

/**
 * Modal for adding a new document to a vehicle
 * Manages its own closing animation state internally
 */
const AddDocumentModal = ({
  isOpen,
  onClose,
  darkMode,
  // Document state
  newDocumentTitle,
  setNewDocumentTitle,
  newDocumentFile,
  setNewDocumentFile,
  // Handlers
  onUpload,
  uploading,
  handleDocumentFileChange,
  // Drag and drop
  isDraggingDocument,
  handleDocumentDragEnter,
  handleDocumentDragLeave,
  handleDocumentDragOver,
  handleDocumentDrop
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const { toast } = useUI();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setNewDocumentFile(null);
      setNewDocumentTitle('');
      onClose();
    }, 150);
  };

  const handleUpload = async () => {
    if (!newDocumentTitle.trim()) {
      toast?.warning('Please enter a document title');
      return;
    }
    if (!newDocumentFile) {
      toast?.warning('Please select a file to upload');
      return;
    }
    const result = await onUpload();
    if (result) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] modal-backdrop ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div
        className={`rounded-lg shadow-xl max-w-md w-full mx-4 modal-content ${
          isClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-50'
        }`}>
          <h3 className={`text-lg font-semibold ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
            Add Document
          </h3>
          <button
            onClick={handleClose}
            className={`p-1 rounded transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newDocumentTitle}
              onChange={(e) => setNewDocumentTitle(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
              }`}
              placeholder="e.g., Insurance Certificate"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              File <span className="text-red-500">*</span>
            </label>
            {newDocumentFile ? (
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <FileText className={`w-8 h-8 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {newDocumentFile.name}
                  </p>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {(newDocumentFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setNewDocumentFile(null)}
                  className={`p-1 rounded ${
                    darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                onDragEnter={handleDocumentDragEnter}
                onDragLeave={handleDocumentDragLeave}
                onDragOver={handleDocumentDragOver}
                onDrop={handleDocumentDrop}
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                isDraggingDocument
                  ? darkMode
                    ? 'border-blue-400 bg-blue-900/20'
                    : 'border-blue-500 bg-blue-50'
                  : darkMode
                    ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <Upload className={`w-8 h-8 mb-2 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Click to upload or drag and drop
                </p>
                <p className={`text-xs mt-1 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  PDF, DOC, Images, ZIP (max 10MB)
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.zip"
                  onChange={handleDocumentFileChange}
                />
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
        }`}>
          <button
            onClick={handleClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !newDocumentTitle.trim() || !newDocumentFile}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              uploading || !newDocumentTitle.trim() || !newDocumentFile
                ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDocumentModal;
