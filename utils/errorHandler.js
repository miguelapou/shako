/**
 * Centralized error handling utility
 *
 * Provides consistent error handling across the application
 * with user-friendly error messages and logging
 */

/**
 * Error types for categorization
 */
export const ErrorType = {
  NETWORK: 'NETWORK',
  DATABASE: 'DATABASE',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Determine error type from error object
 * @param {Error} error - The error object
 * @returns {string} Error type
 */
const getErrorType = (error) => {
  if (!error) return ErrorType.UNKNOWN;

  const message = error.message?.toLowerCase() || '';

  if (message.includes('network') || message.includes('fetch')) {
    return ErrorType.NETWORK;
  }
  if (message.includes('not found') || error.status === 404) {
    return ErrorType.NOT_FOUND;
  }
  if (message.includes('auth') || error.status === 401) {
    return ErrorType.AUTHENTICATION;
  }
  if (message.includes('permission') || error.status === 403) {
    return ErrorType.AUTHORIZATION;
  }
  if (message.includes('database') || message.includes('query')) {
    return ErrorType.DATABASE;
  }
  if (message.includes('invalid') || message.includes('validation')) {
    return ErrorType.VALIDATION;
  }

  return ErrorType.UNKNOWN;
};

/**
 * Get user-friendly error message based on error type
 * @param {Error} error - The error object
 * @param {string} operation - The operation that failed (e.g., 'loading parts', 'saving vehicle')
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyMessage = (error, operation = 'completing the operation') => {
  const errorType = getErrorType(error);

  const messages = {
    [ErrorType.NETWORK]: `Unable to connect to the server while ${operation}. Please check your internet connection and try again.`,
    [ErrorType.DATABASE]: `A database error occurred while ${operation}. Please try again in a moment.`,
    [ErrorType.VALIDATION]: `Invalid data provided while ${operation}. Please check your input and try again.`,
    [ErrorType.AUTHENTICATION]: `Authentication required for ${operation}. Please sign in and try again.`,
    [ErrorType.AUTHORIZATION]: `You don't have permission for ${operation}.`,
    [ErrorType.NOT_FOUND]: `The requested resource was not found while ${operation}.`,
    [ErrorType.UNKNOWN]: `An unexpected error occurred while ${operation}. Please try again.`
  };

  return messages[errorType] || messages[ErrorType.UNKNOWN];
};

/**
 * Log error for debugging and monitoring
 * @param {Error} error - The error object
 * @param {Object} context - Additional context about the error
 */
export const logError = (error, context = {}) => {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      type: getErrorType(error),
      context,
      timestamp: new Date().toISOString()
    });
  }

  // In production, you might want to send errors to a logging service
  // Example: sendToErrorTracking(error, context);
};

/**
 * Handle errors with consistent logging and user feedback
 * @param {Error} error - The error object
 * @param {Object} options - Configuration options
 * @param {string} options.operation - The operation that failed
 * @param {Function} options.onError - Callback to handle the error (e.g., show toast)
 * @param {Object} options.context - Additional context for logging
 * @param {boolean} options.silent - If true, don't show user feedback
 */
export const handleError = (error, options = {}) => {
  const {
    operation = 'completing the operation',
    onError,
    context = {},
    silent = false
  } = options;

  // Log the error
  logError(error, {
    operation,
    ...context
  });

  // Get user-friendly message
  const message = getUserFriendlyMessage(error, operation);

  // Call error callback if provided (e.g., to show a toast)
  if (!silent && onError) {
    onError(message);
  }

  // Return the error info for further handling
  return {
    message,
    type: getErrorType(error),
    originalError: error
  };
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {Function} options.shouldRetry - Function to determine if should retry
 * @returns {Promise} The result of the function
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    shouldRetry = () => true
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or if we shouldn't retry
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);

      // Log retry attempt
      if (process.env.NODE_ENV === 'development') {
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Check if error is retryable (typically network errors)
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is retryable
 */
export const isRetryableError = (error) => {
  const errorType = getErrorType(error);
  return errorType === ErrorType.NETWORK || errorType === ErrorType.DATABASE;
};
