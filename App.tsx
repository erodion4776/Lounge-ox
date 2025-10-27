

import React, { useState, useContext, createContext, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Outlet, Navigate, useLocation } from 'react-router-dom';
import { AuthApiError } from '@supabase/supabase-js';
import { User } from './types';
import LoginPage from './pages/LoginPage';
import DashboardPage from './DashboardPage';
import SalesPage from './pages/SalesPage';
import ProductsPage from './pages/ProductsPage';
import UsersPage from './pages/UsersPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { supabase } from './services/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggingIn: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);


  useEffect(() => {
    // This effect is now primarily for loading the initial session on app start
    // and handling auth state changes from other tabs/windows.
    const sessionLoadTimeout = setTimeout(() => {
        if (loading) { 
            console.warn("Session loading timed out after 15 seconds. Showing login page.");
            setLoading(false);
        }
    }, 15000);

    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: userProfile, error } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();

                if (userProfile && !error) {
                    setUser(userProfile as User);
                } else {
                    // If there's a session but we can't get a profile, log them out.
                    if (error) console.error("Error fetching profile on session load:", error.message);
                    await supabase.auth.signOut();
                    setUser(null);
                }
            }
        } catch (e) {
            console.error("Error in checkSession:", e);
        } finally {
            setLoading(false);
            clearTimeout(sessionLoadTimeout);
        }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            setUser(null);
        } else if (event === 'SIGNED_IN' && !user) {
            // A sign-in happened (e.g. from another tab or after password recovery)
            // Re-fetch the user profile.
            checkSession();
        }
    });
    
    return () => {
        clearTimeout(sessionLoadTimeout);
        subscription.unsubscribe();
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (authError) {
            if (authError instanceof AuthApiError && authError.message.includes('Email not confirmed')) {
                throw new Error('Login failed: Please check your email to confirm your account first.');
            }
            throw new Error(authError.message);
        }

        if (!authData.user) {
            throw new Error("Login successful, but no user data was returned. Please try again.");
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
            await supabase.auth.signOut();
            throw new Error(`Login failed: Could not retrieve your user profile after authentication. This might be due to a network issue or a permissions problem (Row Level Security) in the database. Details: ${profileError.message}`);
        }
        
        if (!userProfile) {
            await supabase.auth.signOut();
            const errorMessage = `Login failed: User authenticated successfully (UID: ${authData.user.id}), but no corresponding profile was found in the 'users' table. This is often caused by a missing database trigger that should copy new users into the public profile table. Please check your Supabase project settings. Signing out.`;
            throw new Error(errorMessage);
        }
        
        setUser(userProfile as User);

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during login.';
        console.error("Login process error:", e);
        setLoginError(errorMessage);
    } finally {
        setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error during sign out:", error.message);
    }
    // setUser(null) is handled by the onAuthStateChange listener
  };

  const value = useMemo(() => ({ user, loading, isLoggingIn, loginError, login, logout }), [user, loading, isLoggingIn, loginError]);
  
  if (loading) {
      return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading session...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
      return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const Sidebar: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: <HomeIcon /> },
        { path: '/sales', label: 'Sales', icon: <ChartBarIcon /> },
        { path: '/products', label: 'Products', icon: <CubeIcon /> },
    ];
    
    const adminNavItems = user?.role === 'admin' ? [
        { path: '/users', label: 'Users', icon: <UsersIcon /> },
    ] : [];

    const NavLink: React.FC<{ path: string; label: string; icon: React.ReactNode }> = ({ path, label, icon }) => {
        const isActive = location.pathname === path;
        return (
            <Link to={path} onClick={onNavigate} className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive ? 'bg-gray-700 text-amber-400' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                <span className="mr-3">{icon}</span>
                {label}
            </Link>
        );
    };
    
    const handleLogout = async () => {
        await logout();
        if (onNavigate) {
            onNavigate();
        }
    };

    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
            <div className="flex items-center justify-center h-16 lg:h-20 border-b border-gray-800">
                <Link to="/" onClick={onNavigate}>
                    <h1 className="text-2xl font-bold text-amber-400 tracking-wider">XO</h1>
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(item => <NavLink key={item.path} {...item} />)}
                {adminNavItems.length > 0 && <hr className="border-gray-700 my-2" />}
                {adminNavItems.map(item => <NavLink key={item.path} {...item} />)}
            </nav>
            <div className="p-4 border-t border-gray-800">
                <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-red-500 hover:text-white transition-colors">
                    <LogoutIcon />
                    <span className="ml-3">Logout</span>
                </button>
            </div>
        </div>
    );
};

const ProtectedLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
      <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
        {/* Static sidebar for desktop */}
        <div className="hidden lg:flex lg:flex-shrink-0 no-print">
          <Sidebar />
        </div>
  
        {/* Mobile sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:hidden no-print ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
        </div>
  
        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden no-print"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          ></div>
        )}
  
        <div className="flex flex-col flex-1 min-w-0">
          {/* Mobile header */}
          <div className="lg:hidden flex-shrink-0 flex h-16 bg-gray-900 border-b border-gray-800 items-center justify-between px-4 no-print">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 p-1 rounded-md"
              aria-label="Open sidebar"
            >
              <span className="sr-only">Open sidebar</span>
              <MenuIcon />
            </button>
            <Link to="/" className="flex items-center">
                <h1 className="text-xl font-bold text-amber-400 tracking-wider">XO</h1>
            </Link>
            <div className="w-8"></div> {/* Spacer to balance the button */}
          </div>
  
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    );
};

export const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Routes>
                <Route element={<ProtectedLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="sales" element={<SalesPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Route>
              </Routes>
            </ProtectedRoute>
          } />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

// Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const CubeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 5.197M15 21a6 6 0 00-9-5.197" /></svg>;
