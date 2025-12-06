'use client';

import { createContext, useContext } from 'react';
import useAuth from '../hooks/useAuth';

/**
 * Auth context for providing authentication state throughout the app
 */
const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  error: null,
  isRefreshing: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshSession: async () => {},
  handleAuthError: async () => {},
});

/**
 * Hook to access auth context
 * @returns {Object} Auth context value
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

/**
 * Auth provider component that wraps the app and provides auth state
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
const AuthProvider = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
