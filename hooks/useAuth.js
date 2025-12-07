import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for managing authentication state with Supabase
 *
 * Features:
 * - Tracks current user session
 * - Handles Google OAuth sign in/out
 * - Listens for auth state changes
 * - Automatic token refresh handling
 * - Session expiration detection and recovery
 * - Provides loading and error states
 *
 * @returns {Object} Auth state and handlers
 * @property {Object|null} user - Current authenticated user
 * @property {Object|null} session - Current session
 * @property {boolean} loading - Whether auth state is being determined
 * @property {string|null} error - Any auth error message
 * @property {boolean} isRefreshing - Whether session is being refreshed
 * @property {function} signInWithGoogle - Initiates Google OAuth flow
 * @property {function} signOut - Signs out the current user
 * @property {function} deleteAccount - Permanently delete user account and all data
 * @property {function} refreshSession - Manually refresh the session
 * @property {function} handleAuthError - Handle auth errors with retry
 */
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track if we're currently refreshing to avoid duplicate refresh attempts
  const refreshPromiseRef = useRef(null);

  // Manually refresh the session
  const refreshSession = useCallback(async () => {
    // If already refreshing, return the existing promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    setIsRefreshing(true);

    refreshPromiseRef.current = (async () => {
      try {
        const { data: { session: newSession }, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('Error refreshing session:', refreshError);

          // If refresh fails, the token might be completely invalid
          // In this case, we need to sign out and let the user re-authenticate
          if (refreshError.message?.includes('Invalid Refresh Token') ||
              refreshError.message?.includes('Refresh Token Not Found')) {
            setUser(null);
            setSession(null);
            setError('Your session has expired. Please sign in again.');
            return { success: false, needsReauth: true };
          }

          return { success: false, error: refreshError };
        }

        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          setError(null);
          return { success: true, session: newSession };
        }

        return { success: false, error: new Error('No session returned') };
      } catch (err) {
        console.error('Error during session refresh:', err);
        return { success: false, error: err };
      } finally {
        setIsRefreshing(false);
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  // Handle auth errors by attempting to refresh and optionally retrying
  const handleAuthError = useCallback(async (error, retryFn = null) => {
    // Check if this is a token expiration error
    const isTokenExpired =
      error?.status === 401 ||
      error?.code === 'PGRST301' || // PostgREST JWT expired
      error?.message?.toLowerCase().includes('jwt expired') ||
      error?.message?.toLowerCase().includes('token expired') ||
      error?.message?.toLowerCase().includes('invalid jwt') ||
      error?.message?.toLowerCase().includes('not authenticated');

    if (!isTokenExpired) {
      return { handled: false, error };
    }

    // Attempt to refresh the session
    const refreshResult = await refreshSession();

    if (refreshResult.success && retryFn) {
      // Session refreshed successfully, retry the operation
      try {
        const result = await retryFn();
        return { handled: true, result };
      } catch (retryError) {
        return { handled: true, error: retryError };
      }
    }

    if (refreshResult.needsReauth) {
      return { handled: true, needsReauth: true };
    }

    return { handled: false, error };
  }, [refreshSession]);

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
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setError(null);
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setSession(null);
            break;

          case 'TOKEN_REFRESHED':
            // Token was automatically refreshed by Supabase
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setError(null);
            break;

          case 'USER_UPDATED':
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            break;

          default:
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
        }

        setLoading(false);
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
          queryParams: {
            prompt: 'select_account',
          },
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

  // Delete user account and all associated data
  const deleteAccount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the database function to delete the user account
      const { error: deleteError } = await supabase.rpc('delete_user_account');

      if (deleteError) {
        console.error('Error deleting account:', deleteError);
        setError(deleteError.message);
        return { success: false, error: deleteError };
      }

      // Clear local state
      setUser(null);
      setSession(null);

      // Sign out to clear any remaining session data
      await supabase.auth.signOut();

      return { success: true };
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.message);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    session,
    loading,
    error,
    isRefreshing,
    signInWithGoogle,
    signOut,
    deleteAccount,
    refreshSession,
    handleAuthError,
  };
};

export default useAuth;
