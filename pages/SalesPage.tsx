import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Sale } from '../types';
import { useAuth } from '../App';

// Edit Sale Modal Component
const EditSaleModal: React.FC<{ sale: Sale; products: Product[]; onSave: () => void; onCancel: () => void }> = ({ sale, products, onSave, onCancel }) => {
  const [selectedProduct, setSelectedProduct] = useState(sale.productId);
  const [quantity, setQuantity] = useState(sale.quantity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) {
      setError('Please select a product and enter a valid quantity.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.updateSale(sale.id, selectedProduct, quantity);
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to update sale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-full max-w-md">
        <h2 className="text-2xl font-bold text-amber-400 mb-6">Edit Sale</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 text-white"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stock} in stock)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 text-white"
            />
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
              {loading ? 'Updating...' : 'Update Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SalesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const [productsData, salesData] = await Promise.all([
        api.getProducts(),
        api.getSales()
      ]);
      setProducts(productsData);
      setSales(salesData);
      if (productsData.length > 0 && !selectedProduct) {
        setSelectedProduct(productsData[0].id);
      }
    } catch (err) {
      setError('Failed to load sales data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) {
      setError('Please select a product and enter a valid quantity.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.logSale(selectedProduct, quantity);
      setSuccess('Sale logged successfully!');
      setQuantity(1);
      await fetchSalesData();
    } catch (err: any) {
      setError(err.message || 'Failed to log sale.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
  };

  const handleDelete = async (saleId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete this sale?\n\nProduct: ${productName}\n\nThis will restore the stock and cannot be undone.`)) {
      try {
        await api.deleteSale(saleId);
        setSuccess('Sale deleted successfully!');
        await fetchSalesData();
      } catch (err: any) {
        setError(err.message || 'Failed to delete sale.');
      }
    }
  };

  const handleSaveEdit = () => {
    setEditingSale(null);
    setSuccess('Sale updated successfully!');
    fetchSalesData();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Log a Sale</h1>
        <p className="text-gray-400">Record a new transaction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-amber-400 mb-4">New Sale</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="product" className="block text-sm font-medium text-gray-300">Product</label>
                <select
                  id="product"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border-gray-600 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md text-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-300">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 disabled:bg-gray-600 transition-colors"
              >
                {loading ? 'Logging...' : 'Log Sale'}
              </button>
              {error && (
                <div className="p-3 bg-red-900 border border-red-700 rounded-md">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-900 border border-green-700 rounded-md">
                  <p className="text-sm text-green-200">{success}</p>
                </div>
              )}
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-amber-400">Recent Sales</h3>
            {isAdmin && (
              <span className="text-xs text-gray-400">Admin: You can edit/delete sales</span>
            )}
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    {isAdmin && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-gray-400">
                        No sales recorded yet. Log your first sale!
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{sale.productName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{sale.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{sale.totalPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(sale.date).toLocaleString()}</td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEdit(sale)}
                              className="text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(sale.id, sale.productName)}
                              className="text-red-500 hover:text-red-400 transition-colors"
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
        </div>
      </div>

      {/* Edit Sale Modal */}
      {editingSale && isAdmin && (
        <EditSaleModal
          sale={editingSale}
          products={products}
          onSave={handleSaveEdit}
          onCancel={() => setEditingSale(null)}
        />
      )}
    </div>
  );
};

export default SalesPage;
