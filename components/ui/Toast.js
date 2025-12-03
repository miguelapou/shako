import React, { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Toast notification component
 *
 * Displays temporary notification messages with different severity levels
 *
 * @param {Object} props
 * @param {string} props.id - Unique identifier for the toast
 * @param {string} props.message - The message to display
 * @param {string} props.type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} props.duration - Duration in ms before auto-dismiss (default: 5000)
 * @param {Function} props.onClose - Callback when toast is closed
 * @param {boolean} props.darkMode - Dark mode flag
 */
const Toast = ({
  id,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  darkMode = false
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    const baseColors = {
      success: darkMode
        ? 'bg-green-900/90 border-green-700 text-green-100'
        : 'bg-green-50 border-green-200 text-green-800',
      error: darkMode
        ? 'bg-red-900/90 border-red-700 text-red-100'
        : 'bg-red-50 border-red-200 text-red-800',
      warning: darkMode
        ? 'bg-yellow-900/90 border-yellow-700 text-yellow-100'
        : 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: darkMode
        ? 'bg-blue-900/90 border-blue-700 text-blue-100'
        : 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const iconColors = {
      success: darkMode ? 'text-green-400' : 'text-green-600',
      error: darkMode ? 'text-red-400' : 'text-red-600',
      warning: darkMode ? 'text-yellow-400' : 'text-yellow-600',
      info: darkMode ? 'text-blue-400' : 'text-blue-600'
    };

    return {
      container: baseColors[type] || baseColors.info,
      icon: iconColors[type] || iconColors.info
    };
  };

  const colors = getColors();

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm animate-slide-in ${colors.container}`}
      role="alert"
    >
      <div className={colors.icon}>
        {getIcon()}
      </div>

      <p className="flex-1 text-sm font-medium">
        {message}
      </p>

      <button
        onClick={() => onClose(id)}
        className={`flex-shrink-0 rounded-lg p-1 transition-colors ${
          darkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
        }`}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
