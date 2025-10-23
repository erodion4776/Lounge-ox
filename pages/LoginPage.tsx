
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../services/api';

const LoginPage: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<null | 'admin' | 'staff'>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (role: 'admin' | 'staff') => {
    setError('');
    setLoading(role);
    const email = role === 'admin' ? 'manager@xo.com' : 'staff@xo.com';
    try {
      const user = await api.signIn(email);
      login(user);
      navigate('/');
    } catch (err) {
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-sm p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-amber-400 tracking-wider">XO</h1>
          <p className="mt-2 text-gray-400">Sales & Inventory Manager</p>
        </div>
        <div className="space-y-4">
            <p className="text-center text-gray-300">Select your role to sign in:</p>
            <button
              onClick={() => handleLogin('admin')}
              disabled={!!loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading === 'admin' ? 'Signing in...' : 'Login as Admin'}
            </button>
            <button
              onClick={() => handleLogin('staff')}
              disabled={!!loading}
              className="w-full flex justify-center py-3 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
               {loading === 'staff' ? 'Signing in...' : 'Login as Sales Staff'}
            </button>
            {error && <p className="text-sm text-red-400 text-center pt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;