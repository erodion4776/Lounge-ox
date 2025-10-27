import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const ResetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase sends a `PASSWORD_RECOVERY` event when the user arrives from the reset link.
        // We set a state to show the form only when this event is detected.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsUpdating(true);
            }
        });
    
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.updateUser({ password });

        setLoading(false);
        if (error) {
            setError(`Failed to update password: ${error.message}`);
        } else {
            setMessage('Your password has been updated successfully. Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-sm p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-amber-400 tracking-wider">XO</h1>
                    <p className="mt-2 text-gray-400">Set a New Password</p>
                </div>
                {isUpdating ? (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-gray-300">New Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-300">Confirm New Password</label>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>

                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        {message && <p className="text-sm text-green-400 text-center">{message}</p>}
                        
                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center text-gray-400">
                        <p>Validating recovery session...</p>
                        <p className="text-sm mt-2">If you've arrived here from a password recovery email, the form will appear shortly.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
