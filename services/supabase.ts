import { createClient } from '@supabase/supabase-js';

// Debug: Log what we're getting from environment
console.log('🔍 Environment Check:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has VITE_SUPABASE_ANON_KEY:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('Key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('URL present:', !!supabaseUrl);
  console.error('Key present:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

console.log('✅ Supabase configuration loaded successfully');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
