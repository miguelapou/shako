import React, { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext(null);

export const UIProvider = ({ children, darkMode, setDarkMode, toast }) => {
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {}
  });

  // Modal closing animation state
  const [isModalClosing, setIsModalClosing] = useState(false);

  // Generic modal close handler with animation
  const handleCloseModal = useCallback((onClose) => {
    setIsModalClosing(true);
    setTimeout(() => {
      onClose();
      setIsModalClosing(false);
    }, 200);
  }, []);

  // Show confirmation dialog helper
  const showConfirm = useCallback(({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm
    });
  }, []);

  // Close confirmation dialog
  const closeConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  const value = {
    // Dark mode
    darkMode,
    setDarkMode,
    // Toast notifications (passed from Shako)
    toast,
    // Confirm dialog
    confirmDialog,
    setConfirmDialog,
    showConfirm,
    closeConfirm,
    // Modal animation
    isModalClosing,
    setIsModalClosing,
    handleCloseModal
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export default UIContext;
