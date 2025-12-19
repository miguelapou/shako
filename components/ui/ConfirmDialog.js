import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isLoading) return; // Prevent closing while loading
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  }, [onClose, isLoading]);

  const handleConfirm = useCallback(() => {
    if (isLoading) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onConfirm();
      onClose();
    }, 150);
  }, [onConfirm, onClose, isLoading]);

  const handleSecondary = useCallback(async () => {
    if (!secondaryAction || isLoading) return;
    setIsLoading(true);
    try {
      await secondaryAction();
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        setIsLoading(false);
        onClose();
      }, 150);
    } catch (error) {
      console.error('Secondary action failed:', error);
      setIsLoading(false);
    }
  }, [secondaryAction, onClose, isLoading]);

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
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : ''
            } ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : ''
            } ${
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
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isLoading
                  ? 'opacity-75 cursor-not-allowed'
                  : ''
              } ${
                secondaryDangerous
                  ? 'bg-red-800 hover:bg-red-900 text-white'
                  : 'bg-blue-800 hover:bg-blue-900 text-white'
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {secondaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
