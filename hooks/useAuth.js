import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Constants for email migration
const MIGRATION_TOKEN_KEY = 'shako-pending-email-migration';

/**
 * Custom hook for managing authentication state with Supabase
 *
 * Features:
 * - Tracks current user session
 * - Handles Google OAuth sign in/out
 * - Listens for auth state changes
 * - Automatic token refresh handling
 * - Session expiration detection and recovery
 * - Email migration (account transfer) support
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
 * @property {function} initiateEmailMigration - Start the email migration process
 * @property {Object|null} migrationResult - Result of completed migration
 */
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [pendingNewUser, setPendingNewUser] = useState(null); // For new user confirmation

  // Track if we're currently refreshing to avoid duplicate refresh attempts
  const refreshPromiseRef = useRef(null);
  // Track if we've already attempted migration completion
  const migrationAttemptedRef = useRef(false);
  // Track if we've already checked for new user
  const newUserCheckRef = useRef(false);

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
            console.log('[Auth] SIGNED_IN event received');
            console.log('[Auth] User:', currentSession?.user?.email);
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setError(null);
            setLoading(false); // Set loading to false immediately so app doesn't hang

            // Check for pending email migration after sign-in
            // This happens when user signs in with a new Google account during migration
            console.log('[Migration] Checking for pending migration...');
            console.log('[Migration] Has user:', !!currentSession?.user);
            console.log('[Migration] Migration already attempted:', migrationAttemptedRef.current);

            if (currentSession?.user && !migrationAttemptedRef.current) {
              const migrationToken = localStorage.getItem(MIGRATION_TOKEN_KEY);
              console.log('[Migration] Token from localStorage:', migrationToken ? 'Found' : 'Not found');

              if (migrationToken) {
                // Attempt to complete the migration
                migrationAttemptedRef.current = true;
                console.log('[Migration] Attempting to complete migration...');
                console.log('[Migration] Token value:', migrationToken.substring(0, 10) + '...');

                // Run migration in background after a short delay to ensure client is ready
                // Use setTimeout to not block the auth state change handler
                setTimeout(async () => {
                  try {
                    console.log('[Migration] Calling complete_email_migration RPC...');

                    // Create an AbortController for timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

                    const { data: result, error: completeError } = await supabase.rpc(
                      'complete_email_migration',
                      { p_migration_token: migrationToken }
                    );

                    clearTimeout(timeoutId);

                    console.log('[Migration] RPC response - data:', result);
                    console.log('[Migration] RPC response - error:', completeError);

                    // Clear the token
                    localStorage.removeItem(MIGRATION_TOKEN_KEY);
                    console.log('[Migration] Token cleared from localStorage');

                    if (completeError) {
                      console.error('[Migration] Error completing migration:', completeError);
                      setMigrationResult({ success: false, error: completeError.message });
                    } else if (!result || !result.success) {
                      console.error('[Migration] Migration failed:', result?.error);
                      setMigrationResult({ success: false, error: result?.error || 'Unknown error' });
                    } else {
                      // Migration successful - reload to get the transferred data
                      console.log('[Migration] SUCCESS! Records transferred:', result.records_transferred);
                      setMigrationResult({
                        success: true,
                        recordsTransferred: result.records_transferred,
                        oldEmail: result.old_email
                      });
                      // Reload the page to fetch the transferred data
                      window.location.reload();
                    }
                  } catch (err) {
                    console.error('[Migration] Exception during migration:', err);
                    localStorage.removeItem(MIGRATION_TOKEN_KEY);
                    setMigrationResult({ success: false, error: err.message });
                  }
                }, 500); // 500ms delay to ensure client is ready
              } else if (!newUserCheckRef.current) {
                // No migration token - check if this is a new user
                newUserCheckRef.current = true;
                console.log('[NewUser] Checking if user is new...');

                setTimeout(async () => {
                  try {
                    const userId = currentSession.user.id;

                    // Check if user has any existing data (explicitly filter by user_id)
                    const { count: vehicleCount } = await supabase
                      .from('vehicles')
                      .select('*', { count: 'exact', head: true })
                      .eq('user_id', userId);

                    const { count: projectCount } = await supabase
                      .from('projects')
                      .select('*', { count: 'exact', head: true })
                      .eq('user_id', userId);

                    const { count: partCount } = await supabase
                      .from('parts')
                      .select('*', { count: 'exact', head: true })
                      .eq('user_id', userId);

                    const totalCount = (vehicleCount || 0) + (projectCount || 0) + (partCount || 0);
                    console.log('[NewUser] Total existing records:', totalCount);

                    if (totalCount === 0) {
                      // This is a new user - show confirmation modal
                      console.log('[NewUser] New user detected, showing confirmation');
                      setPendingNewUser({
                        email: currentSession.user.email,
                        id: currentSession.user.id
                      });
                    }
                  } catch (err) {
                    console.error('[NewUser] Error checking for new user:', err);
                    // On error, just let them through
                  }
                }, 300);
              }
            }
            console.log('[Auth] SIGNED_IN handling complete');
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setSession(null);
            setPendingNewUser(null);
            // Reset flags on sign out
            migrationAttemptedRef.current = false;
            newUserCheckRef.current = false;
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
      // This may fail with 403 since the user no longer exists - that's expected
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signOut errors after successful account deletion
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.message);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Initiate email migration - creates a migration token and redirects to Google OAuth
  const initiateEmailMigration = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the database function to create a migration token
      const { data: migrationToken, error: initError } = await supabase.rpc('initiate_email_migration');

      if (initError) {
        console.error('Error initiating migration:', initError);
        setError(initError.message);
        setLoading(false);
        return { success: false, error: initError };
      }

      console.log('[Migration] Token created:', migrationToken);

      // Store the migration token in localStorage
      localStorage.setItem(MIGRATION_TOKEN_KEY, migrationToken);

      // Sign out current session first to force fresh Google account selection
      // This prevents Google from auto-selecting the current account
      console.log('[Migration] Signing out current session...');
      await supabase.auth.signOut();

      // Small delay to ensure sign out completes
      await new Promise(resolve => setTimeout(resolve, 100));

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : undefined;

      console.log('[Migration] Redirect URL:', redirectUrl);
      console.log('[Migration] Starting OAuth with prompt: consent select_account');

      // Redirect to Google OAuth with the new account
      // Use 'consent select_account' to force both account picker and fresh consent
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'consent select_account',
            access_type: 'offline',
          },
        },
      });

      if (signInError) {
        console.error('[Migration] Error redirecting to Google:', signInError);
        // Clean up the migration token if OAuth fails
        localStorage.removeItem(MIGRATION_TOKEN_KEY);
        setError(signInError.message);
        setLoading(false);
        return { success: false, error: signInError };
      }

      console.log('[Migration] OAuth initiated, redirecting to Google...');
      // Page will redirect to Google, loading state will be reset on return
      return { success: true };
    } catch (err) {
      console.error('[Migration] Error initiating migration:', err);
      localStorage.removeItem(MIGRATION_TOKEN_KEY);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err };
    }
  }, []);

  // Complete a pending email migration (called automatically after OAuth redirect)
  const completePendingMigration = useCallback(async () => {
    // Only attempt once per session
    if (migrationAttemptedRef.current) return null;
    migrationAttemptedRef.current = true;

    // Check for pending migration token
    const migrationToken = localStorage.getItem(MIGRATION_TOKEN_KEY);
    if (!migrationToken) return null;

    try {
      // Call the database function to complete the migration
      const { data: result, error: completeError } = await supabase.rpc(
        'complete_email_migration',
        { p_migration_token: migrationToken }
      );

      // Always clear the token after attempting
      localStorage.removeItem(MIGRATION_TOKEN_KEY);

      if (completeError) {
        console.error('Error completing migration:', completeError);
        return { success: false, error: completeError.message };
      }

      if (!result.success) {
        console.error('Migration failed:', result.error);
        return { success: false, error: result.error };
      }

      // Migration successful
      return {
        success: true,
        recordsTransferred: result.records_transferred,
        oldEmail: result.old_email
      };
    } catch (err) {
      console.error('Error completing migration:', err);
      localStorage.removeItem(MIGRATION_TOKEN_KEY);
      return { success: false, error: err.message };
    }
  }, []);

  // Cancel any pending email migration
  const cancelEmailMigration = useCallback(async () => {
    try {
      // Clear local storage
      localStorage.removeItem(MIGRATION_TOKEN_KEY);

      // Clear from database
      await supabase.rpc('cancel_email_migration');

      return { success: true };
    } catch (err) {
      console.error('Error canceling migration:', err);
      return { success: false, error: err };
    }
  }, []);

  // Clear migration result (for dismissing the success message)
  const clearMigrationResult = useCallback(() => {
    setMigrationResult(null);
  }, []);

  // Confirm new user - clear the pending state and let them proceed
  const confirmNewUser = useCallback(() => {
    console.log('[NewUser] User confirmed account creation');
    setPendingNewUser(null);
  }, []);

  // Cancel new user - sign out and delete the empty account
  const cancelNewUser = useCallback(async () => {
    console.log('[NewUser] User cancelled account creation');
    setLoading(true);

    try {
      // Delete the empty account
      const { error: deleteError } = await supabase.rpc('delete_user_account');

      if (deleteError) {
        console.error('[NewUser] Error deleting account:', deleteError);
      }

      // Clear state
      setPendingNewUser(null);
      setUser(null);
      setSession(null);

      // Sign out - may fail with 403 since user no longer exists, that's expected
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signOut errors after account deletion
      }
    } catch (err) {
      console.error('[NewUser] Error canceling new user:', err);
      // Still try to sign out
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore
      }
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
    migrationResult,
    pendingNewUser,
    signInWithGoogle,
    signOut,
    deleteAccount,
    refreshSession,
    handleAuthError,
    initiateEmailMigration,
    completePendingMigration,
    cancelEmailMigration,
    clearMigrationResult,
    confirmNewUser,
    cancelNewUser,
  };
};

export default useAuth;
