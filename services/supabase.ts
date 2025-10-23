import { createClient } from '@supabase/supabase-js';

// Fix for TypeScript error "Property 'env' does not exist on type 'ImportMeta'".
// This augments the global `ImportMeta` type to include definitions for Vite's
// environment variables, which are accessed via `import.meta.env`.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_SUPABASE_URL: string;
      readonly VITE_SUPABASE_ANON_KEY: string;
    }
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
