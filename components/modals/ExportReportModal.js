import React, { useState } from 'react';
import { FileDown, FileText } from 'lucide-react';

const ExportReportModal = ({
  isOpen,
  onClose,
  onConfirm,
  darkMode,
  vehicleName,
  generating
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [saveToDocuments, setSaveToDocuments] = useState(true);

  const handleClose = () => {
    if (generating) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleConfirm = () => {
    onConfirm(saveToDocuments);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm modal-backdrop ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden modal-content ${
          isClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-slate-50 border border-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <h3
            className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-slate-800'}`}
            style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}
          >
            Generate Report
          </h3>
        </div>

        {/* Body */}
        <div className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
          <p className="mb-4">
            Generate a PDF report for <span className="font-semibold">{vehicleName}</span>?
          </p>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
            The report will include vehicle information, maintenance specs, service history, and project details.
          </p>

          {/* Save to documents checkbox */}
          <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
            darkMode
              ? 'bg-gray-700/50 hover:bg-gray-700'
              : 'bg-slate-100 hover:bg-slate-200'
          }`}>
            <input
              type="checkbox"
              checked={saveToDocuments}
              onChange={(e) => setSaveToDocuments(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <FileText className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`} />
              <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                Save to Documents section
              </span>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 flex justify-end gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <button
            onClick={handleClose}
            disabled={generating}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              generating
                ? 'opacity-50 cursor-not-allowed'
                : ''
            } ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={generating}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              generating
                ? 'bg-blue-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            <FileDown className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;
