import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'sales_rep';
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔍 Checking for existing session...');
        
        // First check if there's a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('❌ No session found');
          setUser(null);
          setLoading(false);
          return;
        }

        console.log('✅ Session found, getting user data...');
        const currentUser = await api.getCurrentUser();
        
        if (currentUser) {
          console.log('✅ User found:', currentUser.email);
          setUser(currentUser);
        } else {
          console.log('❌ No user data found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Failed to get current user:', error);
        setUser(null);
      } finally {
        console.log('✅ Auth loading complete');
        setLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.error('⏰ Auth initialization timeout');
      setLoading(false);
    }, 10000); // Increased to 10 seconds

    initAuth().finally(() => clearTimeout(timeout));

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        try {
          const currentUser = await api.getCurrentUser();
          console.log('✅ User signed in:', currentUser?.email);
          setUser(currentUser);
        } catch (error) {
          console.error('❌ Failed to get user on sign in:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
        // Session is still valid, keep user data
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = (newUser: User) => {
    console.log('✅ Login called:', newUser.email);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      console.log('👋 Logging out...');
      await api.signOut();
      setUser(null);
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
