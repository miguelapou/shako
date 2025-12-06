/**
 * Utility for retrying service calls after token refresh
 *
 * Provides a wrapper for Supabase service calls that automatically
 * detects token expiration errors, refreshes the session, and retries.
 */

import { supabase } from '../lib/supabase';
import { isTokenExpiredError } from './errorHandler';

// Track ongoing refresh to avoid duplicate refresh attempts
let refreshPromise = null;

/**
 * Refresh the session token
 * @returns {Promise<{success: boolean, error?: Error}>}
 */
const refreshSession = async () => {
  // If already refreshing, return the existing promise
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Failed to refresh session:', error);
        return { success: false, error };
      }

      if (session) {
        return { success: true };
      }

      return { success: false, error: new Error('No session returned after refresh') };
    } catch (err) {
      console.error('Error during session refresh:', err);
      return { success: false, error: err };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Execute a service call with automatic retry on token expiration
 *
 * @param {Function} serviceFn - The async function to execute (should return Supabase query result)
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 1)
 * @param {string} options.context - Context string for error messages
 * @returns {Promise<any>} The result of the service call
 * @throws {Error} If the call fails after all retry attempts
 *
 * @example
 * // Basic usage
 * const parts = await withAuthRetry(
 *   () => supabase.from('parts').select('*'),
 *   { context: 'loading parts' }
 * );
 *
 * @example
 * // With existing service function
 * const loadParts = async () => {
 *   return withAuthRetry(
 *     async () => {
 *       const { data, error } = await supabase.from('parts').select('*');
 *       if (error) throw error;
 *       return data;
 *     },
 *     { context: 'loading parts' }
 *   );
 * };
 */
export const withAuthRetry = async (serviceFn, options = {}) => {
  const { maxRetries = 1, context = 'service call' } = options;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await serviceFn();
    } catch (error) {
      lastError = error;

      // Check if this is a token expiration error
      if (isTokenExpiredError(error) && attempt < maxRetries) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Token expired during ${context}, attempting refresh...`);
        }

        // Attempt to refresh the session
        const refreshResult = await refreshSession();

        if (refreshResult.success) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Session refreshed, retrying ${context}...`);
          }
          // Continue to next iteration to retry
          continue;
        } else {
          // Refresh failed, throw a more descriptive error
          const refreshError = new Error(
            `Session refresh failed during ${context}. Please sign in again.`
          );
          refreshError.originalError = error;
          refreshError.refreshError = refreshResult.error;
          throw refreshError;
        }
      }

      // Not a token error or no retries left, throw the error
      throw error;
    }
  }

  throw lastError;
};

/**
 * Create a wrapped version of a service function that includes auth retry
 *
 * @param {Function} serviceFn - The service function to wrap
 * @param {string} context - Context string for error messages
 * @returns {Function} Wrapped function with auth retry
 *
 * @example
 * const loadPartsWithRetry = createAuthRetryWrapper(
 *   partsService.loadParts,
 *   'loading parts'
 * );
 */
export const createAuthRetryWrapper = (serviceFn, context) => {
  return async (...args) => {
    return withAuthRetry(() => serviceFn(...args), { context });
  };
};

/**
 * Check if the current session is valid and not expired
 * @returns {Promise<{valid: boolean, session?: Object, error?: Error}>}
 */
export const checkSessionValidity = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return { valid: false, error };
    }

    if (!session) {
      return { valid: false, error: new Error('No active session') };
    }

    // Check if token is about to expire (within 60 seconds)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiresAtMs = expiresAt * 1000; // Convert to milliseconds
      const now = Date.now();
      const bufferMs = 60 * 1000; // 60 seconds buffer

      if (expiresAtMs - now < bufferMs) {
        // Token is about to expire, proactively refresh
        if (process.env.NODE_ENV === 'development') {
          console.log('Token expiring soon, proactively refreshing...');
        }
        const refreshResult = await refreshSession();
        if (refreshResult.success) {
          const { data: { session: newSession } } = await supabase.auth.getSession();
          return { valid: true, session: newSession };
        }
        return { valid: false, error: refreshResult.error };
      }
    }

    return { valid: true, session };
  } catch (err) {
    return { valid: false, error: err };
  }
};

export default withAuthRetry;
