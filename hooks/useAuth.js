import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Constants for email migration
const MIGRATION_TOKEN_KEY = 'shako-pending-email-migration';
const MIGRATION_ERROR_KEY = 'shako-migration-error';
const MIGRATION_SUCCESS_KEY = 'shako-migration-success';
const MIGRATION_STARTED_KEY = 'shako-migration-started';

// Constants for new user confirmation
const ACCOUNT_CONFIRMED_PREFIX = 'shako-account-confirmed-';

// Migration timeout in milliseconds (5 minutes)
const MIGRATION_TIMEOUT_MS = 5 * 60 * 1000;

// Make error messages more user-friendly
const getFriendlyMigrationError = (error) => {
  if (!error) return 'An unknown error occurred. Please try again.';

  const errorLower = error.toLowerCase();

  if (errorLower.includes('not found') || errorLower.includes('expired')) {
    return 'Your migration session expired. Please try again.';
  }
  if (errorLower.includes('same user') || errorLower.includes('same account')) {
    return 'You selected the same account. Please choose a different Google account to migrate to.';
  }
  if (errorLower.includes('existing data') || errorLower.includes('already has')) {
    return 'The selected account already has data. Please choose an account with no existing data, or delete the data from that account first.';
  }

  return error;
};

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
    // Check for stale migration token (user cancelled or hit back button during OAuth)
    const migrationToken = localStorage.getItem(MIGRATION_TOKEN_KEY);
    const migrationStarted = localStorage.getItem(MIGRATION_STARTED_KEY);
    if (migrationToken && migrationStarted) {
      const startTime = parseInt(migrationStarted, 10);
      const elapsed = Date.now() - startTime;
      if (elapsed > MIGRATION_TIMEOUT_MS) {
        localStorage.removeItem(MIGRATION_TOKEN_KEY);
        localStorage.removeItem(MIGRATION_STARTED_KEY);
        localStorage.setItem(MIGRATION_ERROR_KEY, 'Migration was cancelled or timed out. Please try again.');
      }
    }

    // Check for stored migration error (from failed migration that caused sign out)
    const storedMigrationError = localStorage.getItem(MIGRATION_ERROR_KEY);
    if (storedMigrationError) {
      localStorage.removeItem(MIGRATION_ERROR_KEY);
      setMigrationResult({ success: false, error: storedMigrationError });
    }

    // Check for stored migration success (from successful migration before page reload)
    const storedMigrationSuccess = localStorage.getItem(MIGRATION_SUCCESS_KEY);
    if (storedMigrationSuccess) {
      localStorage.removeItem(MIGRATION_SUCCESS_KEY);
      try {
        const successData = JSON.parse(storedMigrationSuccess);
        setMigrationResult({
          success: true,
          recordsTransferred: successData.recordsTransferred,
          oldEmail: successData.oldEmail
        });
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
        } else {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          // Check for cancelled migration (token exists but no session and token is old enough)
          // This handles the case where user cancelled at Google's account picker or hit back
          const token = localStorage.getItem(MIGRATION_TOKEN_KEY);
          const startedAt = localStorage.getItem(MIGRATION_STARTED_KEY);
          if (token && !initialSession && startedAt) {
            const elapsed = Date.now() - parseInt(startedAt, 10);
            // If token is older than 5 seconds and no session, user likely cancelled
            if (elapsed > 5000) {
              localStorage.removeItem(MIGRATION_TOKEN_KEY);
              localStorage.removeItem(MIGRATION_STARTED_KEY);
              setMigrationResult({ success: false, error: 'Migration was cancelled. Please try again.' });
            }
          }
        }
      } catch (err) {
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
            setError(null);

            // Check for pending email migration BEFORE setting user state
            // This prevents briefly showing the wrong account's data
            if (currentSession?.user && !migrationAttemptedRef.current) {
              const migrationToken = localStorage.getItem(MIGRATION_TOKEN_KEY);

              if (migrationToken) {
                // Keep loading state - don't show any UI until migration completes
                // Attempt to complete the migration
                migrationAttemptedRef.current = true;

                // Run migration after a short delay to ensure client is ready
                setTimeout(async () => {
                  try {
                    const { data: result, error: completeError } = await supabase.rpc(
                      'complete_email_migration',
                      { p_migration_token: migrationToken }
                    );

                    // Clear the token and timestamp
                    localStorage.removeItem(MIGRATION_TOKEN_KEY);
                    localStorage.removeItem(MIGRATION_STARTED_KEY);

                    if (completeError) {
                      // Store friendly error in localStorage so it persists after sign out
                      localStorage.setItem(MIGRATION_ERROR_KEY, getFriendlyMigrationError(completeError.message));
                      // Sign out so user can try again
                      try { await supabase.auth.signOut(); } catch { /* ignore */ }
                    } else if (!result || !result.success) {
                      // Store friendly error in localStorage so it persists after sign out
                      localStorage.setItem(MIGRATION_ERROR_KEY, getFriendlyMigrationError(result?.error));
                      // Sign out so user can try again with a different account
                      try { await supabase.auth.signOut(); } catch { /* ignore */ }
                    } else {
                      // Migration successful - store in localStorage and reload to get the transferred data
                      // Store success info in localStorage so it persists across reload
                      localStorage.setItem(MIGRATION_SUCCESS_KEY, JSON.stringify({
                        recordsTransferred: result.records_transferred,
                        oldEmail: result.old_email
                      }));
                      // Reload the page to fetch the transferred data
                      window.location.reload();
                    }
                  } catch (err) {
                    localStorage.removeItem(MIGRATION_TOKEN_KEY);
                    localStorage.removeItem(MIGRATION_STARTED_KEY);
                    // Store friendly error in localStorage so it persists after sign out
                    localStorage.setItem(MIGRATION_ERROR_KEY, getFriendlyMigrationError(err.message));
                    // Sign out so user can try again
                    try { await supabase.auth.signOut(); } catch { /* ignore */ }
                  }
                }, 500); // 500ms delay to ensure client is ready

                // Don't set user/session or loading=false - migration handler will handle it
                break;
              }
            }

            // No migration pending - set user state normally
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);

            // Check if this is a new user (no existing data)
            if (currentSession?.user && !newUserCheckRef.current) {
                // No migration token - check if this is a new user
                newUserCheckRef.current = true;

                setTimeout(async () => {
                  try {
                    const userId = currentSession.user.id;

                    // Check if user has already confirmed their account (in user metadata)
                    if (currentSession.user.user_metadata?.account_confirmed) {
                      return;
                    }

                    // Also check localStorage as fallback cache
                    const accountConfirmedKey = ACCOUNT_CONFIRMED_PREFIX + userId;
                    if (localStorage.getItem(accountConfirmedKey)) {
                      return;
                    }

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

                    if (totalCount === 0) {
                      // This is a new user - show confirmation modal
                      setPendingNewUser({
                        email: currentSession.user.email,
                        id: currentSession.user.id
                      });
                    }
                  } catch (err) {
                    // On error, just let them through
                  }
                }, 300);
            }
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setSession(null);
            setPendingNewUser(null);
            // Reset flags on sign out
            migrationAttemptedRef.current = false;
            newUserCheckRef.current = false;

            // Check for stored migration error (stored just before signOut was called)
            const storedError = localStorage.getItem(MIGRATION_ERROR_KEY);
            if (storedError) {
              localStorage.removeItem(MIGRATION_ERROR_KEY);
              setMigrationResult({ success: false, error: storedError });
            }
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
        setError(signInError.message);
        setLoading(false);
      }
      // Note: On success, the page will redirect to Google
      // Loading state will be reset when the user returns and auth state changes
    } catch (err) {
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
        setError(signOutError.message);
      }
    } catch (err) {
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
        setError(initError.message);
        setLoading(false);
        return { success: false, error: initError };
      }

      // Store the migration token and start timestamp in localStorage
      localStorage.setItem(MIGRATION_TOKEN_KEY, migrationToken);
      localStorage.setItem(MIGRATION_STARTED_KEY, Date.now().toString());

      // Sign out current session first to force fresh Google account selection
      // This prevents Google from auto-selecting the current account
      await supabase.auth.signOut();

      // Small delay to ensure sign out completes
      await new Promise(resolve => setTimeout(resolve, 100));

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : undefined;

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
        // Clean up the migration token and timestamp if OAuth fails
        localStorage.removeItem(MIGRATION_TOKEN_KEY);
        localStorage.removeItem(MIGRATION_STARTED_KEY);
        setError(signInError.message);
        setLoading(false);
        return { success: false, error: signInError };
      }

      // Page will redirect to Google, loading state will be reset on return
      return { success: true };
    } catch (err) {
      localStorage.removeItem(MIGRATION_TOKEN_KEY);
      localStorage.removeItem(MIGRATION_STARTED_KEY);
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

      // Always clear the token and timestamp after attempting
      localStorage.removeItem(MIGRATION_TOKEN_KEY);
      localStorage.removeItem(MIGRATION_STARTED_KEY);

      if (completeError) {
        return { success: false, error: completeError.message };
      }

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Migration successful
      return {
        success: true,
        recordsTransferred: result.records_transferred,
        oldEmail: result.old_email
      };
    } catch (err) {
      localStorage.removeItem(MIGRATION_TOKEN_KEY);
      localStorage.removeItem(MIGRATION_STARTED_KEY);
      return { success: false, error: err.message };
    }
  }, []);

  // Cancel any pending email migration
  const cancelEmailMigration = useCallback(async () => {
    try {
      // Clear local storage
      localStorage.removeItem(MIGRATION_TOKEN_KEY);
      localStorage.removeItem(MIGRATION_STARTED_KEY);

      // Clear from database
      await supabase.rpc('cancel_email_migration');

      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  }, []);

  // Clear migration result (for dismissing the success message)
  const clearMigrationResult = useCallback(() => {
    setMigrationResult(null);
  }, []);

  // Confirm new user - clear the pending state and let them proceed
  const confirmNewUser = useCallback(async () => {
    // Persist confirmation to user metadata so it works across browsers/devices
    try {
      await supabase.auth.updateUser({
        data: { account_confirmed: true }
      });
    } catch (err) {
      // Ignore errors - localStorage fallback will still work
    }

    // Also save to localStorage as fallback cache
    if (pendingNewUser?.id) {
      const accountConfirmedKey = ACCOUNT_CONFIRMED_PREFIX + pendingNewUser.id;
      localStorage.setItem(accountConfirmedKey, 'true');
    }

    setPendingNewUser(null);
  }, [pendingNewUser]);

  // Cancel new user - sign out and delete the empty account
  const cancelNewUser = useCallback(async () => {
    setLoading(true);

    try {
      // Delete the empty account
      await supabase.rpc('delete_user_account');

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
