import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'sales_staff';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'sales_staff';
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'sales_staff';
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          cost: number;
          stock: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          cost: number;
          stock: number;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          cost?: number;
          stock?: number;
        };
      };
      sales: {
        Row: {
          id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          total_price: number;
          user_id: string;
          date: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          product_name: string;
          quantity: number;
          total_price: number;
          user_id: string;
        };
      };
    };
  };
};
