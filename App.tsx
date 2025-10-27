// App.tsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { User } from './types/User'; // Assuming you have a User type
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (user: User) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sessionLoadTimeout = setTimeout(() => {
            // This check is important. It prevents setting state if the component unmounted
            // or if the auth state change already resolved.
            if (loading) {
                console.warn("Session loading timed out after 8 seconds. Showing login page.");
                setLoading(false);
            }
        }, 8000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            try {
                if (session?.user) {
                    const { data: userProfile, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (error) {
                        console.error("Error fetching user profile:", error.message);
                        await supabase.auth.signOut(); // Log out user if profile is inaccessible
                        setUser(null);
                    } else if (userProfile) {
                        setUser(userProfile as User);
                    } else {
                        console.warn(`No user profile for UID: ${session.user.id}. Signing out.`);
                        await supabase.auth.signOut();
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (e) {
                console.error("An unexpected error occurred in onAuthStateChange:", e);
                setUser(null); // Ensure user is null on any unexpected error
            } finally {
                clearTimeout(sessionLoadTimeout);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(sessionLoadTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const login = (newUser: User) => {
        setUser(newUser);
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error during sign out:", error.message);
        }
        // onAuthStateChange will handle setting user to null and updating state.
    };

    const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading session...</div>;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }>
