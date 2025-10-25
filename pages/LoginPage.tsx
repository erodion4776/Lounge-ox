import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../services/api';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Add debug info that's visible on screen
  const addDebug = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `${timestamp}: ${msg}`]);
  };

  useEffect(() => {
    // Check if already logged in
    if (user) {
      addDebug(`User already logged in: ${user.email}`);
      navigate('/');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo([]); // Clear previous debug info

    try {
      addDebug('Step 1: Starting login...');
      addDebug(`Step 2: Email: ${email}`);
      
      addDebug('Step 3: Calling API...');
      const userData = await api.signIn(email, password);
      
      addDebug(`Step 4: API Success! Role: ${userData.role}`);
      
      addDebug('Step 5: Updating auth...');
      login(userData);
      
      addDebug('Step 6: Navigating...');
      navigate('/');
      
      addDebug('Step 7: Navigation called');
      
      // Fallback navigation
      setTimeout(() => {
        addDebug('Step 8: Checking navigation...');
        if (window.location.hash !== '#/') {
          addDebug('Step 9: Forcing navigation');
          window.location.replace('/#/');
        }
      }, 1000);
      
    } catch (err: any) {
      addDebug(`ERROR: ${err.message}`);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Debug Panel - Visible on screen */}
        <div className="bg-black/50 rounded-lg p-4 border border-green-500/30">
          <h3 className="text-green-400 text-xs font-bold mb-2">Debug Info:</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <p className="text-gray-500 text-xs">No debug info yet...</p>
            ) : (
              debugInfo.map((info, i) => (
                <p key={i} className="text-green-300 text-xs font-mono">{info}</p>
              ))
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-green-500/30">
            <p className="text-xs text-gray-400">User: {user?.email || 'Not logged in'}</p>
            <p className="text-xs text-gray-400">URL: {window.location.hash}</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-amber-400">XO</h1>
            <p className="mt-2 text-gray-400 text-sm">Sales & Inventory</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                placeholder="Email: eroeliza1234@gmail.com"
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                placeholder="Password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-md">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-500 text-gray-900 font-medium rounded-md disabled:bg-gray-600"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Emergency Actions */}
          <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
            <button
              onClick={() => {
                window.location.replace('/#/');
                window.location.reload();
              }}
              className="w-full py-2 bg-gray-700 text-gray-300 text-sm rounded"
            >
              Force Reload App
            </button>
            
            <button
              onClick={() => {
                setDebugInfo([]);
                addDebug('Env URL: ' + (import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'));
                addDebug('Env Key: ' + (import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'));
                addDebug('Current User: ' + (user ? user.email : 'None'));
              }}
              className="w-full py-2 bg-gray-700 text-gray-300 text-sm rounded"
            >
              Check Environment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
