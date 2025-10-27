import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../services/api';
import { Product } from '../types';
import { useAuth } from '../App';

const ProductForm: React.FC<{ product?: Product | null; onSave: () => void; onCancel: () => void }> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Product>>({ name: '', price: 0, stock: 0, cost: 0 });
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
        setFormData(prev => ({ ...prev, [name]: name === 'name' ? value : Number(value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.saveProduct(formData as any);
            onSave();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please check permissions.');
        } finally {
            setLoading(false);
        }
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
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="py-2 px-4 rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={loading} className="py-2 px-4 rounded-md text-gray-900 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-500">{loading ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
);

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

const ProductsPage: React.FC = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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
    const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const totalInventoryCost = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Inventory Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        
        const summaryBody = [
            ['Total Products (SKUs)', products.length.toString()],
            ['Total Stock Value (Price)', `₦${totalStockValue.toLocaleString()}`],
        ];
        if (user?.role === 'admin') {
            summaryBody.push(['Total Inventory Cost', `₦${totalInventoryCost.toLocaleString()}`]);
        }

        autoTable(doc, {
            startY: 40,
            body: summaryBody,
            theme: 'plain',
            styles: { cellPadding: 2, fontSize: 12 },
        });

        const head = user?.role === 'admin'
            ? [['Name', 'Price', 'Cost', 'Stock']]
            : [['Name', 'Price', 'Stock']];

        const body = filteredProducts.map(product => {
            const row = [
                product.name,
                `₦${product.price.toLocaleString()}`,
            ];
            if (user?.role === 'admin') {
                row.push(`₦${product.cost.toLocaleString()}`);
            }
            row.push(product.stock.toString());
            return row;
        });

        autoTable(doc, {
            // @ts-ignore
            startY: doc.lastAutoTable.finalY + 10,
            head: head,
            body: body,
            headStyles: { fillColor: [245, 158, 11] },
            theme: 'striped'
        });

        doc.save('inventory_report.pdf');
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-3xl font-bold">Products</h1>
                    <p className="text-gray-400">Manage your inventory.</p>
                </div>
                {user?.role === 'admin' && (
                    <div className="flex items-center gap-4">
                        <button onClick={handleAdd} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors">Add Product</button>
                        <button onClick={handleDownloadPdf} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                            <DownloadIcon />
                            Download Inventory
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Products (SKUs)" value={products.length.toString()} />
                <StatCard title="Total Stock Value (Price)" value={`₦${totalStockValue.toLocaleString()}`} />
                {user?.role === 'admin' && (
                    <StatCard title="Total Inventory Cost" value={`₦${totalInventoryCost.toLocaleString()}`} />
                )}
            </div>

            <input
              type="search"
              placeholder="Search products by name..."
              aria-label="Search products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-lg bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 placeholder-gray-400 no-print"
            />

            {lowStockCount > 0 && (
                <div className="bg-yellow-900 border-l-4 border-yellow-500 text-yellow-100 p-4 no-print" role="alert">
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
                                {user?.role === 'admin' && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cost</th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stock</th>
                                {user?.role === 'admin' && (
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider no-print">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={user?.role === 'admin' ? 5 : 3} className="text-center py-4">Loading products...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={user?.role === 'admin' ? 5 : 3} className="text-center py-4 text-gray-400">
                                        {searchTerm ? `No products found matching "${searchTerm}"` : 'No products available.'}
                                    </td>
                                </tr>
                            ) : filteredProducts.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{product.price.toLocaleString()}</td>
                                    {user?.role === 'admin' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{product.cost.toLocaleString()}</td>
                                    )}
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${product.stock < 10 ? 'text-red-400 font-bold' : 'text-gray-300'}`}>{product.stock}</td>
                                    {user?.role === 'admin' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2 no-print">
                                            <button onClick={() => handleEdit(product)} className="text-amber-400 hover:text-amber-300">Edit</button>
                                            <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-400">Delete</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && user?.role === 'admin' && <ProductForm product={editingProduct} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default ProductsPage;
