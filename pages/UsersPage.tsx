import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { useAuth } from '../App';

// UserForm Modal Component
const UserForm: React.FC<{ user?: User | null; onSave: () => void; onCancel: () => void }> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<User> & { password?: string }>({ name: '', email: '', role: 'sales_staff', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({ ...user, password: '' }); // Don't show existing password
        } else {
            setFormData({ name: '', email: '', role: 'sales_staff', password: '' });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        if (!user && !formData.password) {
            setError('Password is required for new users.');
            return;
        }
        setLoading(true);
        try {
            await api.saveUser(formData as any);
            if (!user) {
                setSuccessMessage('User created! They will receive a confirmation email to verify their account.');
                setTimeout(() => {
                     onSave();
                }, 3000)
            } else {
                 onSave();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save user.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-full max-w-md">
                <h2 className="text-2xl font-bold text-amber-400 mb-6">{user ? 'Edit User' : 'Add New User'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={user ? 'Leave blank to keep current' : ''} required={!user} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} required className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500">
                            <option value="sales_staff">Sales Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    {successMessage && <p className="text-sm text-green-400">{successMessage}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="py-2 px-4 rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={loading} className="py-2 px-4 rounded-md text-gray-900 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-500">{loading ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main UsersPage Component
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
        } catch (err) {
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchUsers();
        }
    }, [currentUser]);
    
    // Redirect if not admin
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

    const handleDelete = async (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user? This will only remove their app profile, not their login.')) {
            setError('');
            try {
                await api.deleteUser(userId);
                fetchUsers();
            } catch (err: any) {
                alert(err.message || 'Failed to delete user.');
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-gray-400">Add, edit, or remove user accounts.</p>
                </div>
                <button onClick={handleAdd} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Add User
                </button>
            </div>
            
            {error && <p className="text-sm text-center p-2 bg-red-900 border border-red-700 rounded-md text-red-300">{error}</p>}

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
                                <tr><td colSpan={4} className="text-center py-4">Loading users...</td></tr>
                            ) : users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${user.role === 'admin' ? 'bg-amber-900 text-amber-300' : 'bg-gray-600 text-gray-200'}`}>
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleEdit(user)} className="text-amber-400 hover:text-amber-300">Edit</button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-400">Delete</button>
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
