import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for managing authentication state with Supabase
 *
 * Features:
 * - Tracks current user session
 * - Handles Google OAuth sign in/out
 * - Listens for auth state changes
 * - Provides loading and error states
 *
 * @returns {Object} Auth state and handlers
 * @property {Object|null} user - Current authenticated user
 * @property {Object|null} session - Current session
 * @property {boolean} loading - Whether auth state is being determined
 * @property {string|null} error - Any auth error message
 * @property {function} signInWithGoogle - Initiates Google OAuth flow
 * @property {function} signOut - Signs out the current user
 */
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError(sessionError.message);
        } else {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        setError(null);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/`
            : undefined,
        },
      });

      if (signInError) {
        console.error('Error signing in with Google:', signInError);
        setError(signInError.message);
        setLoading(false);
      }
      // Note: On success, the page will redirect to Google
      // Loading state will be reset when the user returns and auth state changes
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('Error signing out:', signOutError);
        setError(signOutError.message);
      }
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signOut,
  };
};

export default useAuth;
