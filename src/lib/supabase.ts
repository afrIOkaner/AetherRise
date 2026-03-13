// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * @file supabase.ts
 * @description Centralized Supabase client initialization.
 * Used for interacting with PostgreSQL tables (profiles, notes).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);