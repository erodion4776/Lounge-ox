
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product } from '../types';

const ProductForm: React.FC<{ product?: Product | null; onSave: () => void; onCancel: () => void }> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Product>>({ name: '', price: 0, stock: 0, cost: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData(product);
        } else {
            setFormData({ name: '', price: 0, stock: 0, cost: 0 });
        }
    }, [product]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'name' ? value : Number(value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await api.saveProduct(formData as any);
        setLoading(false);
        onSave();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-full max-w-md">
                <h2 className="text-2xl font-bold text-amber-400 mb-6">{product ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Price</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} required className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Cost</label>
                            <input type="number" name="cost" value={formData.cost} onChange={handleChange} required className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300">Stock</label>
                            <input type="number" name="stock" value={formData.stock} onChange={handleChange} required className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="py-2 px-4 rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={loading} className="py-2 px-4 rounded-md text-gray-900 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-500">{loading ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const fetchProducts = async () => {
        setLoading(true);
        const data = await api.getProducts();
        setProducts(data);
        setLoading(false);
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

    const handleDelete = async (productId: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            await api.deleteProduct(productId);
            fetchProducts();
        }
    };

    const handleSave = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        fetchProducts();
    };
    
    const lowStockCount = products.filter(p => p.stock < 10).length;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Products</h1>
                    <p className="text-gray-400">Manage your inventory.</p>
                </div>
                <button onClick={handleAdd} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors">Add Product</button>
            </div>

            {lowStockCount > 0 && (
                <div className="bg-yellow-900 border-l-4 border-yellow-500 text-yellow-100 p-4" role="alert">
                    <p className="font-bold">Low Stock Alert</p>
                    <p>You have {lowStockCount} item(s) running low on stock (less than 10 units).</p>
                </div>
            )}
            
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-4">Loading products...</td></tr>
                            ) : products.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${product.cost.toFixed(2)}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${product.stock < 10 ? 'text-red-400 font-bold' : 'text-gray-300'}`}>{product.stock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleEdit(product)} className="text-amber-400 hover:text-amber-300">Edit</button>
                                        <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-400">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && <ProductForm product={editingProduct} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default ProductsPage;
