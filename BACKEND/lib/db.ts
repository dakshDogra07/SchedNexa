import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using the service role key.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * to be set as environment variables.
 */
function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      'Missing environment variable NEXT_PUBLIC_SUPABASE_URL. ' +
      'Set it before running the backend.'
    );
  }
  if (!key) {
    throw new Error(
      'Missing environment variable SUPABASE_SERVICE_ROLE_KEY. ' +
      'Set it before running the backend.'
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Lazily initialised, singleton Supabase client for server-side use. */
let _client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!_client) {
    _client = getSupabaseClient();
  }
  return _client;
}
