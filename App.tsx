import { supabase } from './supabase';
import { User, Product, Sale, DashboardStats } from '../types';

export const api = {
  signIn: async (email: string, password: string): Promise<User> => {
    try {
      console.log('API: Starting signIn...');
      
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout after 10 seconds')), 10000)
      );
      
      const signInPromise = async () => {
        // Step 1: Try to sign in
        console.log('API: Calling Supabase auth...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          console.error('API: Auth error:', authError);
          throw new Error(authError.message);
        }
        
        if (!authData.user) {
          throw new Error('No user data returned');
        }

        console.log('API: Auth successful, fetching user profile...');
        
        // Step 2: Get user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (userError) {
          console.error('API: User profile error:', userError);
          throw new Error(`Profile error: ${userError.message}`);
        }
        
        if (!userData) {
          throw new Error('User profile not found in database');
        }

        console.log('API: User profile fetched successfully');
        
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        };
      };
      
      // Race between timeout and actual sign in
      return await Promise.race([
        signInPromise(),
        timeoutPromise
      ]) as User;
      
    } catch (error) {
      console.error('API signIn error:', error);
      throw error;
    }
  },

  // ... rest of your API methods
