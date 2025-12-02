import React from 'react';
import { X } from 'lucide-react';

const TrackingModal = ({
  isOpen,
  darkMode,
  trackingInput,
  setTrackingInput,
  skipTrackingInfo,
  saveTrackingInfo,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop-enter modal-backdrop"
      onClick={onClose}
    >
      <div
        className={`rounded-lg shadow-xl max-w-md w-full modal-popup-enter ${
          darkMode ? 'bg-gray-800' : 'bg-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`border-b px-6 py-4 flex items-center justify-between rounded-t-lg ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <h2 className={`text-xl font-bold ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Add Tracking Info</h2>
          <button
            onClick={onClose}
            className={`transition-colors ${
              darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 modal-scrollable">
          <p className={`text-sm mb-4 ${
            darkMode ? 'text-gray-400' : 'text-slate-600'
          }`}>
            Enter the tracking number for this shipment (optional)
          </p>
          <label className={`block text-sm font-medium mb-2 ${
            darkMode ? 'text-gray-300' : 'text-slate-700'
          }`}>
            Tracking Number
          </label>
          <input
            type="text"
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
            }`}
            placeholder="e.g., 1Z999AA10123456784"
            autoFocus
          />
          <div className="flex gap-3 mt-6">
            <button
              onClick={skipTrackingInfo}
              className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Skip
            </button>
            <button
              onClick={saveTrackingInfo}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingModal;
