import React, { useRef, useState } from 'react';
import { X, Package, FileSpreadsheet, Upload } from 'lucide-react';
import { useUI } from '../../contexts';

const AddPartOptionsModal = ({
  isOpen,
  darkMode,
  isModalClosing,
  handleCloseModal,
  onClose,
  onSinglePartClick,
  onCSVUpload
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useUI();

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onCSVUpload(file);
      } else {
        toast?.warning('Please upload a CSV file');
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onCSVUpload(file);
      } else {
        toast?.warning('Please upload a CSV file');
      }
    }
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
        isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={() => handleCloseModal(onClose)}
    >
      <div
        className={`rounded-lg shadow-xl max-w-2xl w-full modal-content ${
          isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <h2 className={`text-2xl font-bold ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Add Parts</h2>
          <button
            onClick={() => handleCloseModal(onClose)}
            className={`transition-colors ${
              darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Single Part Card */}
            <button
              onClick={onSinglePartClick}
              className={`p-6 rounded-lg border-2 transition-all text-left group ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 hover:border-blue-500 hover:bg-gray-650'
                  : 'bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
                darkMode
                  ? 'bg-blue-600/20 group-hover:bg-blue-600/30'
                  : 'bg-blue-100 group-hover:bg-blue-200'
              }`}>
                <Package className={`w-6 h-6 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${
                darkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                Add Single Part
              </h3>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Manually enter details for one part at a time
              </p>
            </button>

            {/* CSV Upload Card */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-lg border-2 border-dashed transition-all text-left cursor-pointer group ${
                isDragging
                  ? darkMode
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'bg-blue-100 border-blue-500'
                  : darkMode
                    ? 'bg-gray-700 border-gray-600 hover:border-blue-500 hover:bg-gray-650'
                    : 'bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
                isDragging
                  ? darkMode
                    ? 'bg-blue-600/30'
                    : 'bg-blue-200'
                  : darkMode
                    ? 'bg-green-600/20 group-hover:bg-green-600/30'
                    : 'bg-green-100 group-hover:bg-green-200'
              }`}>
                {isDragging ? (
                  <Upload className={`w-6 h-6 ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                ) : (
                  <FileSpreadsheet className={`w-6 h-6 ${
                    darkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                )}
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${
                darkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {isDragging ? 'Drop CSV File' : 'Import from CSV'}
              </h3>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {isDragging
                  ? 'Release to upload file'
                  : 'Drag & drop a CSV file or click to browse'
                }
              </p>
            </div>
          </div>
        </div>

        <div className={`border-t ${
          darkMode ? 'border-gray-700' : 'border-slate-200'
        }`}></div>
        <div className="p-6">
          <button
            onClick={() => handleCloseModal(onClose)}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPartOptionsModal;
