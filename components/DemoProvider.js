'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DEMO_USER,
  DEMO_STORAGE_KEYS,
  initializeDemoData,
  clearDemoData,
  resetDemoData,
} from '../data/demoData';

/**
 * Demo context for managing demo mode state
 */
const DemoContext = createContext({
  isDemoMode: false,
  demoUser: null,
  enterDemoMode: () => {},
  exitDemoMode: () => {},
  resetDemo: () => {},
});

/**
 * Hook to access demo context
 * @returns {Object} Demo context value
 */
export const useDemoContext = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
};

/**
 * Demo provider component that manages demo mode state
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
const DemoProvider = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for existing demo mode on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDemoMode = localStorage.getItem(DEMO_STORAGE_KEYS.IS_DEMO_MODE);
      if (storedDemoMode === 'true') {
        setIsDemoMode(true);
        initializeDemoData();
      }
      setIsInitialized(true);
    }
  }, []);

  const enterDemoMode = useCallback(() => {
    localStorage.setItem(DEMO_STORAGE_KEYS.IS_DEMO_MODE, 'true');
    initializeDemoData();
    setIsDemoMode(true);
  }, []);

  const exitDemoMode = useCallback(() => {
    clearDemoData();
    setIsDemoMode(false);
    // Reload the page to reset all state
    window.location.reload();
  }, []);

  const resetDemo = useCallback(() => {
    resetDemoData();
    // Reload to refresh all data
    window.location.reload();
  }, []);

  const value = {
    isDemoMode,
    demoUser: isDemoMode ? DEMO_USER : null,
    enterDemoMode,
    exitDemoMode,
    resetDemo,
    isInitialized,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
};

export default DemoProvider;
