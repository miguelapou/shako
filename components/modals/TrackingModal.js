import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  const [isClosing, setIsClosing] = useState(false);
  const isSubmittingRef = useRef(false);
  const openTimeRef = useRef(0); // Track when modal opened to ignore immediate clicks

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      isSubmittingRef.current = false;
      openTimeRef.current = Date.now();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    // Ignore clicks within 200ms of opening (prevents click-through from dropdown)
    if (Date.now() - openTimeRef.current < 200) return;
    if (isClosing || isSubmittingRef.current) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 150);
  }, [onClose, isClosing]);

  const handleSkip = useCallback(() => {
    if (isSubmittingRef.current || isClosing) return;
    isSubmittingRef.current = true;
    setIsClosing(true);
    setTimeout(() => {
      skipTrackingInfo();
    }, 150);
  }, [skipTrackingInfo, isClosing]);

  const handleSave = useCallback(() => {
    if (isSubmittingRef.current || isClosing) return;
    isSubmittingRef.current = true;
    setIsClosing(true);
    setTimeout(() => {
      saveTrackingInfo();
    }, 150);
  }, [saveTrackingInfo, isClosing]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 modal-backdrop ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div
        className={`rounded-lg shadow-xl max-w-md w-full modal-content ${
          isClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`border-b px-6 py-4 flex items-center justify-between rounded-t-lg ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <h2 className={`text-xl font-bold ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Add Tracking Info</h2>
          <button
            onClick={handleClose}
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
              onClick={handleSkip}
              className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Skip
            </button>
            <button
              onClick={handleSave}
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
