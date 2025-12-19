import React, { useState, useEffect, useCallback } from 'react';

// ConfirmDialog - Custom styled confirmation modal
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  darkMode,
  isDangerous = true,
  // Optional secondary action (e.g., "Delete All")
  secondaryAction,
  secondaryText,
  secondaryDangerous = true
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onConfirm();
      onClose();
    }, 150);
  }, [onConfirm, onClose]);

  const handleSecondary = useCallback(() => {
    if (!secondaryAction) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      secondaryAction();
      onClose();
    }, 150);
  }, [secondaryAction, onClose]);

  // Handle Enter key to confirm
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleConfirm]);

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
            {title}
          </h3>
        </div>
        {/* Body */}
        <div className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
          <p>{message}</p>
        </div>
        {/* Footer */}
        <div className={`px-6 py-4 flex justify-end gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <button
            onClick={handleClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {confirmText}
          </button>
          {secondaryAction && secondaryText && (
            <button
              onClick={handleSecondary}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                secondaryDangerous
                  ? 'bg-red-800 hover:bg-red-900 text-white'
                  : 'bg-blue-800 hover:bg-blue-900 text-white'
              }`}
            >
              {secondaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
