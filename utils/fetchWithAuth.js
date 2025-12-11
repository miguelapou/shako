import { supabase } from '../lib/supabase';

/**
 * Fetch with Supabase auth token
 * Automatically includes the user's auth token in the Authorization header
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const fetchWithAuth = async (url, options = {}) => {
  const { data: { session } } = await supabase.auth.getSession();

  const headers = {
    ...options.headers,
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
