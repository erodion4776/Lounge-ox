import { createClient } from '@supabase/supabase-js';

// The environment variables are expected to be available in the execution context.
// Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Initialize the client only if the variables are present.
// This prevents the application from crashing on startup if the environment is not configured.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
