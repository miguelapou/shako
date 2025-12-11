import React, { useState } from 'react';
import { Mail, ArrowRight, AlertCircle, Loader2, Info } from 'lucide-react';

/**
 * Modal for updating the login email by migrating to a new Google account
 * This initiates an OAuth flow with a new Google account and transfers all data
 */
const UpdateLoginEmailModal = ({
  isOpen,
  onClose,
  onInitiateMigration,
  darkMode,
  userEmail
}) => {
  const [isInitiating, setIsInitiating] = useState(false);
  const [error, setError] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleInitiate = async () => {
    setIsInitiating(true);
    setError(null);

    try {
      const result = await onInitiateMigration();
      if (!result.success) {
        setError(result.error?.message || 'Failed to initiate migration. Please try again.');
        setIsInitiating(false);
      }
      // On success, the page will redirect to Google OAuth
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setIsInitiating(false);
    }
  };

  const handleClose = () => {
    if (isInitiating) return;
    setIsClosing(true);
    setTimeout(() => {
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
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <h3
              className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-slate-800'}`}
              style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}
            >
              Update Login Email
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className={`px-6 py-4 space-y-4 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
          {/* Current email */}
          {userEmail && (
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-100'}`}>
              <p className={`text-xs uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                Current login email
              </p>
              <p className="font-medium">{userEmail}</p>
            </div>
          )}

          {/* Explanation */}
          <div className={`p-3 rounded-lg border ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-500 mb-1">How this works:</p>
                <ol className={`list-decimal list-inside space-y-1 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                  <li>Click the button below to sign in with your new Google account</li>
                  <li>All your data will be transferred to the new account</li>
                  <li className={darkMode ? 'text-yellow-400' : 'text-yellow-600'}>Your old account will be removed</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Data transfer note */}
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
            All your vehicles, projects, parts, and other data will be preserved and linked to your new login email.
          </p>

          {error && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${darkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-100 border border-red-300'}`}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 flex justify-end gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <button
            onClick={handleClose}
            disabled={isInitiating}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            } ${isInitiating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={handleInitiate}
            disabled={isInitiating}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isInitiating
                ? 'bg-blue-600/50 text-white/50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isInitiating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                Migrate to new account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateLoginEmailModal;
