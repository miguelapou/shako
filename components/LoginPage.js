'use client';

import { useState, useEffect } from 'react';
import { Loader2, Play } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { useDemoContext } from './DemoProvider';

/**
 * Google icon SVG component
 */
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

/**
 * Login page component with Google authentication
 */
const LoginPage = () => {
  const { signInWithGoogle, loading, error, migrationResult, clearMigrationResult } = useAuthContext();
  const { enterDemoMode } = useDemoContext();
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [migrationError, setMigrationError] = useState(null);

  // Handle migration error display
  useEffect(() => {
    if (migrationResult && !migrationResult.success) {
      setMigrationError(migrationResult.error);
      clearMigrationResult();
    }
  }, [migrationResult, clearMigrationResult]);

  // Initialize dark mode preference
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

  // Wait for FoundationOne font to load before showing title
  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      // Check if font is already loaded
      if (document.fonts.check("1em 'FoundationOne'")) {
        setFontLoaded(true);
        return;
      }

      // Wait for fonts to be ready
      document.fonts.ready.then(() => {
        // Double-check the specific font loaded
        if (document.fonts.check("1em 'FoundationOne'")) {
          setFontLoaded(true);
        } else {
          // Font might still be loading, use load() to trigger it
          document.fonts.load("1em 'FoundationOne'").then(() => {
            setFontLoaded(true);
          }).catch(() => {
            // Font failed to load, show title anyway with fallback
            setFontLoaded(true);
          });
        }
      });
    } else {
      // Fallback for browsers without fonts API
      setFontLoaded(true);
    }
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${
        darkMode ? 'bg-gray-900' : 'bg-slate-50'
      }`}
    >
      <div
        className={`w-full max-w-md p-8 rounded-2xl shadow-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1
            className={`text-3xl font-bold mb-2 transition-opacity duration-200 ${
              darkMode ? 'text-gray-100' : 'text-gray-900'
            } ${fontLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}
          >
            Shako
          </h1>
          <p
            className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Track your vehicle restoration projects
          </p>
        </div>

        {/* Error messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Migration error message */}
        {migrationError && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${
            darkMode
              ? 'bg-red-900/30 border border-red-800 text-red-400'
              : 'bg-red-100 border border-red-300 text-red-700'
          }`}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-medium mb-1">Migration Failed</p>
                <p>{migrationError}</p>
              </div>
              <button
                onClick={() => setMigrationError(null)}
                className={`text-lg leading-none ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Sign in button */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>or</span>
          <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>

        {/* Demo mode button */}
        <button
          onClick={enterDemoMode}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${
            darkMode
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Play className="w-4 h-4" />
          <span>Try Demo</span>
        </button>

        {/* Footer text */}
        <p
          className={`mt-6 text-xs text-center ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          Your data is securely stored and only accessible to you
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
