'use client';

import AuthProvider, { useAuthContext } from '../components/AuthProvider';
import DemoProvider, { useDemoContext } from '../components/DemoProvider';
import LoginPage from '../components/LoginPage';
import Shako from '../components/Shako';
import { Loader2, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

// Key for migration token - must match useAuth.js
const MIGRATION_TOKEN_KEY = 'shako-pending-email-migration';

/**
 * Hook to get dark mode preference
 */
const useDarkModePreference = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        setDarkMode(JSON.parse(saved));
      } else {
        setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    }
  }, []);

  return { darkMode, mounted };
};

/**
 * Loading spinner shown while checking auth state
 */
const LoadingScreen = () => {
  const { darkMode, mounted } = useDarkModePreference();

  if (!mounted) return null;

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-slate-50'
      }`}
    >
      <Loader2
        className={`w-8 h-8 animate-spin ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
      />
    </div>
  );
};

/**
 * Screen shown when migration is in progress in another tab
 */
const MigrationInProgressScreen = () => {
  const { darkMode, mounted } = useDarkModePreference();

  if (!mounted) return null;

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        darkMode ? 'bg-gray-900' : 'bg-slate-50'
      }`}
    >
      <div className={`text-center max-w-md ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <Monitor className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        <h2 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          Migration in Progress
        </h2>
        <p className="text-sm">
          Account migration is happening in another window. Please complete the migration there, then refresh this page.
        </p>
      </div>
    </div>
  );
};

/**
 * Auth gate component that shows login or app based on auth state
 */
const AuthGate = () => {
  const { user, loading } = useAuthContext();
  const { isDemoMode, isInitialized } = useDemoContext();
  const [hasMigrationToken, setHasMigrationToken] = useState(false);
  const [migrationInOtherTab, setMigrationInOtherTab] = useState(false);

  // Check for migration token on mount and when auth state changes
  // This ensures we hide the login page during migration redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(MIGRATION_TOKEN_KEY);
      setHasMigrationToken(!!token);
    }
  }, [loading, user]);

  // Listen for storage events from other tabs
  // This detects when migration is started/completed in another window
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Only handle migration token changes
      if (e.key !== MIGRATION_TOKEN_KEY) return;

      if (e.newValue && !e.oldValue) {
        // Token was added in another tab - migration started there
        setMigrationInOtherTab(true);
      } else if (!e.newValue && e.oldValue) {
        // Token was removed in another tab - migration completed/cancelled
        setMigrationInOtherTab(false);
        // Reload to sync state after migration completes
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Show migration in progress screen if detected in another tab
  if (migrationInOtherTab) {
    return <MigrationInProgressScreen />;
  }

  // Wait for demo mode to initialize
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // If in demo mode, show the app with demo data
  if (isDemoMode) {
    return <Shako isDemo={true} />;
  }

  // Show loading during initial load or if migration redirect is in progress
  if (loading || hasMigrationToken) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <Shako />;
};

/**
 * Home page wrapped with auth and demo providers
 */
export default function Home() {
  return (
    <DemoProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </DemoProvider>
  );
}
