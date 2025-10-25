   import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product } from '../types';
import { useAuth } from '../App';

const ProductForm: React.FC<{ product?: Product | null; onSave: () => void; onCancel: () => void }> = ({ product, onSave, onCancel }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [formData, setFormData] = useState<Partial<Product>>({ 
        name: '', 
        price: 0, 
        stock: 0, 
        cost: 0 
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (product) {
            setFormData(product);
        } else {
            setFormData({ name: '', price: 0, stock: 0, cost: 0 });
        }
    }, [product]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'name' ? value : Number(value) 
        }));
    };

    const validateForm = (): boolean => {
        if (!formData.name?.trim()) {
            setError('Product name is required');
            return false;
        }
        if (formData.price === undefined || formData.price < 0) {
            setError('Price must be a positive number');
            return false;
        }
        if (formData.cost === undefined || formData.cost < 0) {
            setError('Cost must be a positive number');
            return false;
        }
        if (formData.stock === undefined || formData.stock < 0) {
            setError('Stock must be a positive number');
            return false;
        }
        if (formData.price && formData.cost && formData.price < formData.cost) {
            setError('Warning: Price is lower than cost. You will not make a profit.');
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
            await api.saveProduct(formData as any);
            onSave();
        } catch (err: any) {
            setError(err.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const profit = (formData.price || 0) - (formData.cost || 0);
    const profitMargin = formData.price ? ((profit / formData.price) * 100).toFixed(1) : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-amber-400 mb-6">
                    {product ? 'Edit Product' : 'Add New Product'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Product Name <span className="text-red-400">*</span>
                        </label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            required 
                            placeholder="e.g., Premium Laptop"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400" 
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Cost (₦) <span className="text-red-400">*</span>
                            </label>
                            <input 
                                type="number" 
                                name="cost" 
                                value={formData.cost} 
                                onChange={handleChange} 
                                required 
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400" 
                            />
                            <p className="mt-1 text-xs text-gray-400">Your purchase cost</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Price (₦) <span className="text-red-400">*</span>
                            </label>
                            <input 
                                type="number" 
                                name="price" 
                                value={formData.price} 
                                onChange={handleChange} 
                                required 
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400" 
                            />
                            <p className="mt-1 text-xs text-gray-400">Selling price</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Stock Quantity <span className="text-red-400">*</span>
                        </label>
                        <input 
                            type="number" 
                            name="stock" 
                            value={formData.stock} 
                            onChange={handleChange} 
                            required 
                            min="0"
                            placeholder="0"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400" 
                        />
                        <p className="mt-1 text-xs text-gray-400">Current inventory count</p>
                    </div>

                    {/* Profit Calculator - Admin Only */}
                    {isAdmin && formData.price !== undefined && formData.cost !== undefined && (
                        <div className="bg-gray-900 border border-gray-600 rounded-md p-4">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Profit Calculation</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Profit per unit:</span>
                                    <span className={profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        ₦{profit.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Profit margin:</span>
                                    <span className={Number(profitMargin) >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {profitMargin}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className={`p-3 border rounded-md ${
                            error.includes('Warning') 
                                ? 'bg-yellow-900 border-yellow-700' 
                                : 'bg-red-900 border-red-700'
                        }`}>
                            <p className={`text-sm ${
                                error.includes('Warning') 
                                    ? 'text-yellow-200' 
                                    : 'text-red-200'
                            }`}>{error}</p>
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
                            {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProductsPage: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const fetchProducts = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api.getProducts();
            setProducts(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAdd = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (productId: string, productName: string) => {
        if (window.confirm(`Are you sure you want to delete "${productName}"?\n\nThis action cannot be undone.`)) {
            setError('');
            try {
                await api.deleteProduct(productId);
                fetchProducts();
            } catch (err: any) {
                setError(err.message || 'Failed to delete product');
            }
        }
    };

    const handleSave = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        fetchProducts();
    };
    
    const lowStockCount = products.filter(p => p.stock < 10).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Products</h1>
                    <p className="text-gray-400">Manage your inventory.</p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={handleAdd} 
                        className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Product
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Total Products</p>
                    <p className="text-2xl font-bold text-white">{products.length}</p>
                </div>
                {isAdmin && (
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Inventory Value</p>
                        <p className="text-2xl font-bold text-green-400">₦{totalValue.toLocaleString()}</p>
                    </div>
                )}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Low Stock Items</p>
                    <p className="text-2xl font-bold text-yellow-400">{lowStockCount}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-400">{outOfStockCount}</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <input
                    type="search"
                    placeholder="Search products by name..."
                    aria-label="Search products"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 pl-10 focus:ring-amber-500 focus:border-amber-500 placeholder-gray-400 text-white"
                />
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-md" role="alert">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {lowStockCount > 0 && (
                <div className="bg-yellow-900 border-l-4 border-yellow-500 text-yellow-100 p-4 rounded-md" role="alert">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="font-bold">Low Stock Alert</p>
                            <p>You have {lowStockCount} item(s) running low on stock (less than 10 units).</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Products Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                {isAdmin && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cost</th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                                {isAdmin && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Profit</th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stock</th>
                                {isAdmin && (
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 3} className="text-center py-8">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400 mb-2"></div>
                                            <p className="text-gray-400">Loading products...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 3} className="text-center py-8">
                                        <p className="text-gray-400">
                                            {searchTerm ? `No products found matching "${searchTerm}"` : 'No products available. Add your first product!'}
                                        </p>
                                    </td>
                                </tr>
                            ) : filteredProducts.map((product) => {
                                const profit = product.price - product.cost;
                                return (
                                    <tr key={product.id} className={product.stock === 0 ? 'bg-red-900 bg-opacity-20' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {product.name}
                                            {product.stock === 0 && (
                                                <span className="ml-2 px-2 py-1 text-xs bg-red-600 rounded-full">Out of Stock</span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{product.cost.toFixed(2)}</td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{product.price.toFixed(2)}</td>
                                        {isAdmin && (
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                ₦{profit.toFixed(2)}
                                            </td>
                                        )}
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                            product.stock === 0 ? 'text-red-400' : product.stock < 10 ? 'text-yellow-400' : 'text-gray-300'
                                        }`}>
                                            {product.stock}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button 
                                                    onClick={() => handleEdit(product)} 
                                                    className="text-amber-400 hover:text-amber-300 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(product.id, product.name)} 
                                                    className="text-red-500 hover:text-red-400 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && isAdmin && (
                <ProductForm 
                    product={editingProduct} 
                    onSave={handleSave} 
                    onCancel={() => setIsModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default ProductsPage;                                         {product.stock === 0 && (
                                                <span className="ml-2 px-2 py-1 text-xs bg-red-600 rounded-full">Out of Stock</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{product.cost.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{product.price.toFixed(2)}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ₦{profit.toFixed(2)}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                            product.stock === 0 ? 'text-red-400' : product.stock < 10 ? 'text-yellow-400' : 'text-gray-300'
                                        }`}>
                                            {product.stock}
                                        </td>
                                        {user?.role === 'admin' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button 
                                                    onClick={() => handleEdit(product)} 
                                                    className="text-amber-400 hover:text-amber-300 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(product.id, product.name)} 
                                                    className="text-red-500 hover:text-red-400 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && user?.role === 'admin' && (
                <ProductForm 
                    product={editingProduct} 
                    onSave={handleSave} 
                    onCancel={() => setIsModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default ProductsPage;
