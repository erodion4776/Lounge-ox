import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gqcrhmncphjmkzdcnysc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxY3JobW5jcGhqbWt6ZGNueXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDkzODYsImV4cCI6MjA3NjgyNTM4Nn0.ZKNeghNJtjp09NywrsKtHxxskqJ31W9oRLX5Bk6NdHw';

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
