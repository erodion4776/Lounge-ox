import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-amber-400">XO Sales Manager</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">{user?.email}</span>
              <span className="px-2 py-1 text-xs bg-amber-500 text-gray-900 rounded-full font-medium">
                {user?.role === 'admin' ? 'Admin' : 'Sales Rep'}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 py-3">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-gray-700 text-amber-400' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/sales"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/sales') ? 'bg-gray-700 text-amber-400' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Sales
            </Link>
            <Link
              to="/products"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/products') ? 'bg-gray-700 text-amber-400' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Products
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/users"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/users') ? 'bg-gray-700 text-amber-400' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Users
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
