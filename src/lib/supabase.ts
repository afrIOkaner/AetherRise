import { createClient } from '@supabase/supabase-js';

// 1. Get credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 2. Safety check: Throw clear error if variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase Environment Variables: Check your .env.local file.'
  );
}

/**
 * @description Centralized Supabase client initialization.
 * No other imports from local files allowed here to avoid circular dependencies.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Keeps user logged in after refresh (Point 20 Fix)
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});