import { useState, useCallback } from 'react';

/**
 * Custom hook for managing toast notifications
 *
 * Provides functions to show and dismiss toast messages
 *
 * @returns {Object} Toast state and functions
 */
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Toast options
   * @param {string} options.type - Toast type: 'success', 'error', 'warning', 'info'
   * @param {number} options.duration - Duration in ms before auto-dismiss (0 = no auto-dismiss)
   * @returns {string} Toast ID
   */
  const showToast = useCallback((message, options = {}) => {
    const {
      type = 'info',
      duration = 5000
    } = options;

    const id = `toast-${Date.now()}-${Math.random()}`;

    const newToast = {
      id,
      message,
      type,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    return id;
  }, []);

  /**
   * Show a success toast
   * @param {string} message - The message to display
   * @param {Object} options - Toast options
   */
  const success = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'success' });
  }, [showToast]);

  /**
   * Show an error toast
   * @param {string} message - The message to display
   * @param {Object} options - Toast options
   */
  const error = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'error', duration: options.duration || 7000 });
  }, [showToast]);

  /**
   * Show a warning toast
   * @param {string} message - The message to display
   * @param {Object} options - Toast options
   */
  const warning = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'warning' });
  }, [showToast]);

  /**
   * Show an info toast
   * @param {string} message - The message to display
   * @param {Object} options - Toast options
   */
  const info = useCallback((message, options = {}) => {
    return showToast(message, { ...options, type: 'info' });
  }, [showToast]);

  /**
   * Dismiss a toast by ID
   * @param {string} id - Toast ID to dismiss
   */
  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Dismiss all toasts
   */
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    dismissToast,
    dismissAll
  };
};

export default useToast;
