// Context exports
export { UIProvider, useUI } from './UIContext';
export { DocumentProvider, useDocuments } from './DocumentContext';
export { ServiceEventProvider, useServiceEvents } from './ServiceEventContext';

// Combined provider for convenience
import React from 'react';
import { UIProvider } from './UIContext';
import { DocumentProvider } from './DocumentContext';
import { ServiceEventProvider } from './ServiceEventContext';

/**
 * AppProviders - Combines all context providers into a single wrapper
 *
 * Usage in Shako.js:
 *
 * <AppProviders darkMode={darkMode} setDarkMode={setDarkMode} userId={userId}>
 *   <YourComponents />
 * </AppProviders>
 *
 * Then in child components:
 *
 * const { darkMode, showConfirm, isModalClosing, handleCloseModal } = useUI();
 * const { documents, addDocument, loadDocuments } = useDocuments();
 * const { serviceEvents, addServiceEvent } = useServiceEvents();
 */
export const AppProviders = ({ children, darkMode, setDarkMode, userId, toast, isDemo = false }) => {
  return (
    <UIProvider darkMode={darkMode} setDarkMode={setDarkMode} toast={toast}>
      <DocumentProvider userId={userId} toast={toast} isDemo={isDemo}>
        <ServiceEventProvider userId={userId} toast={toast} isDemo={isDemo}>
          {children}
        </ServiceEventProvider>
      </DocumentProvider>
    </UIProvider>
  );
};
