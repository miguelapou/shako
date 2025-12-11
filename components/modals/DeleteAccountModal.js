import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Modal for confirming account deletion
 * Requires user to type confirmation text to prevent accidental deletion
 */
const DeleteAccountModal = ({
  isOpen,
  onClose,
  onConfirm,
  darkMode,
  userEmail
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const CONFIRMATION_TEXT = 'delete my account';
  const isConfirmEnabled = confirmText.toLowerCase() === CONFIRMATION_TEXT;

  const handleConfirm = async () => {
    if (!isConfirmEnabled) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await onConfirm();
      if (!result.success) {
        setError(result.error?.message || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
      }
      // On success, the auth state change will redirect to login
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setIsClosing(true);
    setTimeout(() => {
      setConfirmText('');
      setError(null);
      setIsClosing(false);
      onClose();
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm modal-backdrop ${
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
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-red-900/20' : 'border-slate-200 bg-red-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3
              className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-slate-800'}`}
              style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}
            >
              Delete Account
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className={`px-6 py-4 space-y-4 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
            <p className="text-sm text-red-500 font-medium">
              This action cannot be undone.
            </p>
          </div>

          <p>
            This will permanently delete your account and all associated data including:
          </p>

          <ul className={`list-disc list-inside space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
            <li>All vehicles and their images</li>
            <li>All projects and tasks</li>
            <li>All parts and tracking information</li>
            <li>All service events</li>
            <li>All vendor information</li>
            <li>All documents</li>
          </ul>

          {userEmail && (
            <p className="text-sm">
              Account: <span className="font-medium">{userEmail}</span>
            </p>
          )}

          <div className="pt-2">
            <label
              htmlFor="confirm-delete"
              className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}
            >
              Type <span className="font-mono font-bold text-red-500">{CONFIRMATION_TEXT}</span> to confirm:
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              placeholder={CONFIRMATION_TEXT}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-red-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-red-500'
              } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-100 border border-red-300'}`}>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 flex justify-end gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isDeleting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isConfirmEnabled && !isDeleting
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-600/50 text-white/50 cursor-not-allowed'
            }`}
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
