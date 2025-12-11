import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Create a server-side Supabase client with the user's auth token
 * This ensures RLS policies work correctly on the server
 *
 * @param {Request} request - The incoming request with Authorization header
 * @returns {Object} Supabase client with user's auth context
 */
export const createServerClient = (request) => {
  // Extract auth token from request headers
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Return anonymous client if no auth token
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  const token = authHeader.replace('Bearer ', '');

  // Create client with user's auth token
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

/**
 * Anonymous server-side Supabase client (no auth)
 * Use only for public data or when auth is not required
 */
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
