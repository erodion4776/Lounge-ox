import { createClient } from '@supabase/supabase-js';

// Hardcoded for mobile development
// TODO: Move to environment variables in production
const supabaseUrl = 'https://gqcrhmncphjmkzdcnysc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxY3JobW5jcGhqbWt6ZGNueXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDkzODYsImV4cCI6MjA3NjgyNTM4Nn0.ZKNeghNJtjp09NywrsKtHxxskqJ31W9oRLX5Bk6NdHw';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration is missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  },
});
