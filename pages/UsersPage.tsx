import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';

const UserForm: React.FC<{ user?: User | null; onSave: () => void; onCancel: () => void }> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<User> & { password?: string }>({ 
        name: '', 
        email: '', 
        role: 'sales_staff', 
        password: '' 
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({ ...user, password: '' });
        } else {
            setFormData({ name: '', email: '', role: 'sales_staff', password: '' });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = (): boolean => {
        if (!formData.name?.trim()) {
            setError('Name is required');
            return false;
        }
        if (!formData.email?.trim()) {
            setError('Email is required');
            return false;
        }
        if (!user && !formData.password) {
            setError('Password is required for new users');
            return false;
        }
        if (formData.password && formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await api.saveUser(formData as any);
            onSave();
        } catch (err: any) {
            setError(err.message || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-amber-400 mb-6">
                    {user ? 'Edit User' : 'Create New Staff Account'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Full Name <span className="text-red-400">*</span>
                        </label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            required 
                            placeholder="John Doe"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Email Address <span className="text-red-400">*</span>
                        </label>
                        <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            placeholder="user@example.com"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Password {!user && <span className="text-red-400">*</span>}
                        </label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                name="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                placeholder={user ? 'Leave blank to keep current password' : 'Minimum 6 characters'} 
                                required={!user}
                                minLength={6}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 pr-10 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400" 
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {!user && (
                            <p className="mt-1 text-xs text-gray-400">The user will use this password to log in</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Role <span className="text-red-400">*</span>
                        </label>
                        <select 
                            name="role" 
                            value={formData.role} 
                            onChange={handleChange} 
                            required 
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 text-white"
                        >
                            <option value="sales_staff">Sales Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-400">
                            {formData.role === 'admin' 
                                ? 'Can manage products, view all data, and manage users' 
                                : 'Can log sales and view products'}
                        </p>
                    </div>
                    {error && (
                        <div className="p-3 bg-red-900 border border-red-700 rounded-md">
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            disabled={loading}
                            className="py-2 px-4 rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="py-2 px-6 rounded-md text-gray-900 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UsersPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchUsers();
        }
    }, [currentUser]);
    
    if (currentUser?.role !== 'admin') {
      return <Navigate to="/" replace />;
    }

    const handleAdd = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async (userId: string, userEmail: string) => {
        if (userId === currentUser.id) {
            alert('You cannot delete your own account!');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${userEmail}?\n\nThis action cannot be undone and will permanently remove the user's access.`)) {
            setError('');
            try {
                await api.deleteUser(userId);
                fetchUsers();
            } catch (err: any) {
                alert(err.message || 'Failed to delete user');
            }
        }
    };

    const handleSave = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        fetchUsers();
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-gray-400">Create and manage staff login credentials</p>
                </div>
                <button 
                    onClick={handleAdd} 
                    className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                   </svg>
                    Create Staff Account
                </button>
            </div>
            
            {error && (
                <div className="p-3 bg-red-900 border border-red-700 rounded-md">
                    <p className="text-sm text-red-200">{error}</p>
                </div>
            )}

            {users.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2 text-amber-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium">Total Staff Members: {users.length}</p>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400 mb-2"></div>
                                            <p className="text-gray-400">Loading users...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8">
                                        <p className="text-gray-400">No users found. Create your first staff account!</p>
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className={user.id === currentUser.id ? 'bg-gray-750' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                        {user.name}
                                        {user.id === currentUser.id && (
                                            <span className="ml-2 text-xs text-amber-400">(You)</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${user.role === 'admin' ? 'bg-amber-900 text-amber-300' : 'bg-gray-600 text-gray-200'}`}>
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button 
                                            onClick={() => handleEdit(user)} 
                                            className="text-amber-400 hover:text-amber-300 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        {user.id !== currentUser.id && (
                                            <button 
                                                onClick={() => handleDelete(user.id, user.email)} 
                                                className="text-red-500 hover:text-red-400 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && <UserForm user={editingUser} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default UsersPage;
