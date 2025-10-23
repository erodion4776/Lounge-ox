
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Sale } from '../types';

const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSalesData = async () => {
    try {
        setLoading(true);
        const [productsData, salesData] = await Promise.all([
            api.getProducts(),
            api.getSales()
        ]);
        setProducts(productsData);
        setSales(salesData);
        if (productsData.length > 0) {
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
      // Refresh data
      await fetchSalesData();
    } catch (err: any) {
      setError(err.message || 'Failed to log sale.');
    } finally {
      setLoading(false);
    }
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
                  className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border-gray-600 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} in stock)</option>)}
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
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 disabled:bg-gray-600"
              >
                {loading ? 'Logging...' : 'Log Sale'}
              </button>
              {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
              {success && <p className="text-sm text-green-400 mt-2">{success}</p>}
            </form>
          </div>
        </div>
        <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-amber-400 mb-4">Recent Sales</h3>
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {sales.map((sale) => (
                            <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{sale.productName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{sale.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${sale.totalPrice.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(sale.date).toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
