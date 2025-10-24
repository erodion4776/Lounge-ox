    import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product } from '../types';
import { useAuth } from '../App';

const ProductsPage: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(data);
        } catch (err) {
            setError('Failed to load products.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddProduct = () => {
        if (!isAdmin) return;
        setProductToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        if (!isAdmin) return;
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!isAdmin || !window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.deleteProduct(productId);
            setSuccess('Product deleted successfully!');
            fetchProducts();
        } catch (err: any) {
            setError(err.message || 'Failed to delete product.');
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Products</h1>
                <p className="text-gray-400">{isAdmin ? 'Manage all products, stock, pricing, and profit margins.' : 'View current stock and pricing.'}</p>
            </div>
            
            {error && <p className="text-lg text-red-400 mt-2">{error}</p>}
            {success && <p className="text-lg text-green-400 mt-2">{success}</p>}

            <div className="flex justify-end">
                {isAdmin && (
                    <button
                        onClick={handleAddProduct}
                        className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500"
                    >
                        Add New Product
                    </button>
                )}
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stock</th>
                                {/* Conditional Columns (Admin Only) */}
                                {isAdmin && (
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cost</th>
                                )}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Selling Price</th>
                                {/* Conditional Columns (Admin Only) */}
                                {isAdmin && (
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Profit/Unit</th>
                                )}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Value</th>
                                {/* Conditional Actions Column (Admin Only) */}
                                {isAdmin && (
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {loading ? (
                                <tr className="hover:bg-gray-700">
                                    <td colSpan={isAdmin ? 7 : 4} className="px-6 py-4 text-center text-gray-400">Loading products...</td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{product.name}</td>
                                        
                                        {/* Stock Cell (with Out of Stock indicator - FIXED for build errors) */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex items-center">
                                            <span className="mr-2">{product.stock}</span>
                                            {product.stock === 0 && (
                                                <span className="ml-2 px-2 py-1 text-xs bg-red-600 rounded-full">Out of Stock</span>
                                            )}
                                        </td>
                                        
                                        {/* Conditional Data Cell: Cost (Admin Only) */}
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{product.cost.toFixed(2)}</td>
                                        )}
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{product.price.toFixed(2)}</td>
                                        
                                        {/* Conditional Data Cell: Profit/Unit (Admin Only) */}
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{(product.price - product.cost).toFixed(2)}</td>
                                        )}

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{(product.price * product.stock).toFixed(2)}</td>
                                        
                                        {/* Conditional Actions Cell: Edit/Delete (Admin Only) - FIXED for build errors */}
                                        {isAdmin ? (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleEditProduct(product)}
                                                    className="text-amber-400 hover:text-amber-500"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="text-red-400 hover:text-red-500 ml-2"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        ) : null}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Placeholder for Modal component call */}
            {/* {isModalOpen && (
                <ProductModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={() => { setIsModalOpen(false); fetchProducts(); }} 
                    product={productToEdit} 
                    isEdit={!!productToEdit} 
                />
            )} */}
        </div>
    );
};

export default ProductsPage;                                    {/* END FIX */}

                                        {/* Conditional Data Cell: Cost (Admin Only) */}
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{product.cost.toFixed(2)}</td>
                                        )}
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{product.price.toFixed(2)}</td>
                                        
                                        {/* Conditional Data Cell: Profit/Unit (Admin Only) */}
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{(product.price - product.cost).toFixed(2)}</td>
                                        )}

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{(product.price * product.stock).toFixed(2)}</td>
                                        
                                        {/* Conditional Actions Cell: Edit/Delete (Admin Only) */}
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleEditProduct(product)}
                                                    className="text-amber-400 hover:text-amber-500"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="text-red-400 hover:text-red-500 ml-2"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Placeholder for Modal component call */}
            {/* {isModalOpen && (
                <ProductModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={() => { setIsModalOpen(false); fetchProducts(); }} 
                    product={productToEdit} 
                    isEdit={!!productToEdit} 
                />
            )} */}
        </div>
    );
};

export default ProductsPage;                                     {/* --- Conditional Data Cell: Profit/Unit --- */}
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{(product.price - product.cost).toFixed(2)}</td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{(product.price * product.stock).toFixed(2)}</td>
                                        {/* --- Conditional Actions Cell: Edit/Delete --- */}
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleEditProduct(product)}
                                                    className="text-amber-400 hover:text-amber-500"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="text-red-400 hover:text-red-500 ml-2"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Placeholder for Modal component call */}
            {/* {isModalOpen && (
                <ProductModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={() => { setIsModalOpen(false); fetchProducts(); }} 
                    product={productToEdit} 
                    isEdit={!!productToEdit} 
                />
            )} */}
        </div>
    );
};

export default ProductsPage;                                      {product.stock === 0 && (
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
