import React from 'react';
import Toast from './Toast';

/**
 * ToastContainer component
 *
 * Container for displaying toast notifications
 * Positioned in the top-right corner of the screen
 *
 * @param {Object} props
 * @param {Array} props.toasts - Array of toast objects
 * @param {Function} props.onDismiss - Function to dismiss a toast
 * @param {boolean} props.darkMode - Dark mode flag
 */
const ToastContainer = ({ toasts, onDismiss, darkMode = false }) => {
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
          pointer-events: auto;
        }
      `}</style>

      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={onDismiss}
          darkMode={darkMode}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
