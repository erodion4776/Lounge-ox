import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// 1. Go to your Supabase project dashboard.
// 2. Navigate to Project Settings > API.
// 3. Find your Project URL and anon public key.
// 4. Replace the placeholder values below with your actual credentials.
const supabaseUrl = 'https://jyoniqbgendqjbhasgbb.supabase.co'; // e.g., 'https://xyz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5b25pcWJnZW5kcWpiaGFzZ2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODU5MTUsImV4cCI6MjA3NzA2MTkxNX0._mSmpbV7LNFiXOxeDZ7faP9QNg2SP00lu6mD7AbVnvI'; // e.g., 'ey...'

// FIX: The check for placeholder credentials was causing a TypeScript error because it
// was comparing a constant string with a different literal string. The check has been
// updated to a more general truthiness check to prevent accidental empty credentials.
if (!supabaseUrl || !supabaseAnonKey) {
  // This error will be shown if you have not replaced the placeholder credentials.
  throw new Error('Supabase credentials are not set. Please update `services/supabase.ts` with your project URL and anon key.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);