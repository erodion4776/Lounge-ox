import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../services/api';

const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (email.toLowerCase() === 'eroeliza1234@gmail.com' && code === '47748') {
            setShowPassword(true);
        } else {
            setError('Invalid email or confirmation code.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-full max-w-sm">
                <h2 className="text-2xl font-bold text-amber-400 mb-6">Password Recovery</h2>
                {showPassword ? (
                    <div className="text-center">
                        <p className="text-gray-300">Your password is:</p>
                        <p className="text-lg font-mono bg-gray-700 p-3 rounded-md my-4 text-amber-400">1220iloveyou</p>
                        <button onClick={onClose} className="w-full py-2 px-4 rounded-md text-gray-900 bg-amber-400 hover:bg-amber-500">Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Admin Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Confirmation Code</label>
                            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        <div className="flex justify-end gap-4 pt-4">
                            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500">Cancel</button>
                            <button type="submit" className="py-2 px-4 rounded-md text-gray-900 bg-amber-400 hover:bg-amber-500">Submit</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await api.signIn(email, password);
      login(user);
      navigate('/');
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-full max-w-sm p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-amber-400 tracking-wider">XO</h1>
            <p className="mt-2 text-gray-400">Sales & Inventory Manager</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-300">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="text-right text-sm">
                <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="font-medium text-amber-400 hover:text-amber-300"
                >
                    Forgot Password?
                </button>
            </div>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
      {showForgotModal && <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />}
    </>
  );
};

export default LoginPage;
