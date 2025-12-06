'use client';

import AuthProvider, { useAuthContext } from '../components/AuthProvider';
import LoginPage from '../components/LoginPage';
import Shako from '../components/Shako';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Loading spinner shown while checking auth state
 */
const LoadingScreen = () => {
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
 * Auth gate component that shows login or app based on auth state
 */
const AuthGate = () => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <Shako />;
};

/**
 * Home page wrapped with auth provider
 */
export default function Home() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
