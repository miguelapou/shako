import { useCallback } from 'react';
import { useAuthContext } from '../components/AuthProvider';
import { isTokenExpiredError } from '../utils/errorHandler';

/**
 * Hook that provides authenticated fetch functionality with automatic
 * session refresh on token expiration.
 *
 * Use this hook when making service calls that need to handle token
 * expiration gracefully by refreshing the session and retrying.
 *
 * @returns {Object} Object containing authenticatedFetch function
 *
 * @example
 * const { authenticatedFetch } = useAuthenticatedFetch();
 *
 * const loadData = async () => {
 *   try {
 *     const data = await authenticatedFetch(
 *       () => partsService.loadParts(),
 *       { context: 'loading parts' }
 *     );
 *     setParts(data);
 *   } catch (error) {
 *     if (error.needsReauth) {
 *       // User needs to sign in again
 *       signOut();
 *     } else {
 *       setError(error.message);
 *     }
 *   }
 * };
 */
const useAuthenticatedFetch = () => {
  const { refreshSession, handleAuthError } = useAuthContext();

  /**
   * Execute a service call with automatic retry on token expiration
   *
   * @param {Function} serviceFn - The async function to execute
   * @param {Object} options - Configuration options
   * @param {string} options.context - Context string for error messages
   * @param {number} options.maxRetries - Maximum retry attempts (default: 1)
   * @returns {Promise<any>} The result of the service call
   */
  const authenticatedFetch = useCallback(async (serviceFn, options = {}) => {
    const { context = 'fetching data', maxRetries = 1 } = options;

    try {
      return await serviceFn();
    } catch (error) {
      // Check if this is a token expiration error
      if (isTokenExpiredError(error) && maxRetries > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Token expired during ${context}, attempting refresh via hook...`);
        }

        // Use the context's handleAuthError for retry
        const result = await handleAuthError(error, serviceFn);

        if (result.handled) {
          if (result.needsReauth) {
            const reauthError = new Error('Your session has expired. Please sign in again.');
            reauthError.needsReauth = true;
            throw reauthError;
          }
          if (result.error) {
            throw result.error;
          }
          return result.result;
        }
      }

      // Re-throw the original error if not handled
      throw error;
    }
  }, [handleAuthError]);

  return { authenticatedFetch, refreshSession };
};

export default useAuthenticatedFetch;
