import { useState, useEffect } from 'react';

/**
 * Custom hook for managing dark mode state with localStorage persistence
 *
 * Features:
 * - Syncs dark mode preference to localStorage
 * - Falls back to system preference if no saved value
 * - Prevents SSR hydration mismatch
 * - Manages scrollbar styling for dark mode
 *
 * @returns {Object} Dark mode state and handlers
 * @property {boolean} darkMode - Current dark mode state
 * @property {function} setDarkMode - Function to update dark mode
 * @property {boolean} darkModeInitialized - Whether dark mode has been initialized from localStorage
 * @property {boolean} mounted - Whether component has mounted (for SSR)
 */
const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(false); // Always start with false to match SSR
  const [darkModeInitialized, setDarkModeInitialized] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration mismatch by not rendering until mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize dark mode after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        setDarkMode(JSON.parse(saved));
      } else {
        setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
      setDarkModeInitialized(true);
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && darkModeInitialized) {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode, darkModeInitialized]);

  // Apply dark scrollbar styles to both html and body for cross-browser compatibility
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Detect if Safari (not Chrome)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (darkMode) {
        document.documentElement.classList.add('dark-scrollbar');
        document.body.classList.add('dark-scrollbar');
        // Only set color-scheme for Safari
        if (isSafari) {
          document.documentElement.style.colorScheme = 'dark';
        }
      } else {
        document.documentElement.classList.remove('dark-scrollbar');
        document.body.classList.remove('dark-scrollbar');
        // Only set color-scheme for Safari
        if (isSafari) {
          document.documentElement.style.colorScheme = 'light';
        }
      }
    }
  }, [darkMode]);

  return {
    darkMode,
    setDarkMode,
    darkModeInitialized,
    mounted
  };
};

export default useDarkMode;
