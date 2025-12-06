'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

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
  const { signInWithGoogle, loading, error } = useAuthContext();
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

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
            className={`text-3xl font-bold mb-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-900'
            }`}
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

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
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
