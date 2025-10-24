import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Sale } from '../types';
import { useAuth } from '../App'; // Import useAuth to get user role

// --- Edit Sale Modal Component ---
interface EditSaleModalProps {
  sale: Sale;
  products: Product[];
  onClose: () => void;
  onSave: (saleId: string, newProductId: string, newQuantity: number) => void;
  loading: boolean;
  error: string;
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({ sale, products, onClose, onSave, loading, error }) => {
  const [newProductId, setNewProductId] = useState(sale.productId);
  const [newQuantity, setNewQuantity] = useState(sale.quantity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(sale.id, newProductId, newQuantity);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 w-full max-w-md mx-4">
        <h3 className="text-xl font-semibold text-amber-400 mb-4">Edit Sale: {sale.productName}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-product" className="block text-sm font-medium text-gray-300">Product</label>
            <select
              id="edit-product"
              value={newProductId}
              onChange={(e) => setNewProductId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border-gray-600 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} in stock)</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="edit-quantity" className="block text-sm font-medium text-gray-300">Quantity</label>
            <input
              type="number"
              id="edit-quantity"
              value={newQuantity}
              onChange={(e) => setNewQuantity(Number(e.target.value))}
              min="1"
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-600 rounded-md text-sm font-medium text-white hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-600"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Delete Confirmation Modal Component ---
interface DeleteConfirmationModalProps {
  sale: Sale;
  onClose: () => void;
  onConfirm: (saleId: string) => void;
  loading: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ sale, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center">
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 w-full max-w-sm mx-4">
      <h3 className="text-xl font-semibold text-red-400 mb-4">Confirm Deletion</h3>
      <p className="text-white mb-4">Are you sure you want to delete the sale of **{sale.productName}** (Qty: {sale.quantity})?</p>
      <p className="text-sm text-red-300 mb-6">This action will restore stock and cannot be undone.</p>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="py-2 px-4 border border-gray-600 rounded-md text-sm font-medium text-white hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(sale.id)}
          disabled={loading}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
        >
          {loading ? 'Deleting...' : 'Delete Sale'}
        </button>
      </div>
    </div>
  </div>
);


// --- Sales Page Component ---
const SalesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);


  const fetchSalesData = async () => {
    try {
        setLoading(true);
        const [productsData, salesData] = await Promise.all([
            api.getProducts(),
            api.getSales()
        ]);
        setProducts(productsData);
        setSales(salesData);
        // Ensure selectedProduct is still a valid ID if it was set
        if (productsData.length > 0 && (!selectedProduct || !productsData.some(p => p.id === selectedProduct))) {
            setSelectedProduct(productsData[0].id);
        } else if (productsData.length > 0 && !selectedProduct) {
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
  
  const handleEditSale = async (saleId: string, newProductId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setEditError('Quantity must be greater than 0.');
      return;
    }
    setEditLoading(true);
    setEditError('');
    try {
      // The updateSale function handles the stock restoration of the old product
      // and the stock deduction/validation for the new product
      await api.updateSale(saleId, newProductId, newQuantity);
      setSuccess(`Sale ${saleId} updated successfully! Stock adjusted.`);
      setSaleToEdit(null); // Close modal
      await fetchSalesData(); // Refresh sales and products
    } catch (err: any) {
      setEditError(err.message || 'Failed to update sale. Check stock and try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    setDeleteLoading(true);
    setSuccess('');
    try {
      // The deleteSale function handles stock restoration
      await api.deleteSale(saleId);
      setSuccess(`Sale ${saleId} deleted successfully! Stock restored.`);
      setSaleToDelete(null); // Close modal
      await fetchSalesData(); // Refresh sales and products
    } catch (err: any) {
      setError(err.message || 'Failed to delete sale.');
    } finally {
      setDeleteLoading(false);
    }
  };


  return (
    <div className="space-y-8">
      {/* Modals */}
      {saleToEdit && (
        <EditSaleModal
          sale={saleToEdit}
          products={products}
          onClose={() => { setSaleToEdit(null); setEditError(''); }}
          onSave={handleEditSale}
          loading={editLoading}
          error={editError}
        />
      )}
      {saleToDelete && (
        <DeleteConfirmationModal
          sale={saleToDelete}
          onClose={() => setSaleToDelete(null)}
          onConfirm={handleDeleteSale}
          loading={deleteLoading}
        />
      )}
      {/* End Modals */}

      <div>
        <h1 className="text-3xl font-bold">Log a Sale</h1>
        <p className="text-gray-400">Record a new transaction.</p>
      </div>
      
      {/* Success/Error messages for main page actions */}
      {error && <p className="text-lg text-red-400 mt-2">{error}</p>}
      {success && <p className="text-lg text-green-400 mt-2">{success}</p>}
      

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
                  onChange={(e) => { setSelectedProduct(e.target.value); setError(''); setSuccess(''); }}
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
            </form>
          </div>
        </div>
        <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-amber-400">Recent Sales</h3>
                {isAdmin && (
                    <p className="text-sm text-gray-400">Admin: You can edit/delete sales.</p>
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            )}
                        </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {sales.map((sale) => (
                            <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{sale.productName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{sale.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{sale.totalPrice.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(sale.date).toLocaleString()}</td>
                            {isAdmin && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button 
                                        onClick={() => { setSaleToEdit(sale); setEditError(''); }}
                                        className="text-amber-400 hover:text-amber-500"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => setSaleToDelete(sale)}
                                        className="text-red-400 hover:text-red-500 ml-2"
                                    >
                                        Delete
                                    </button>
                                </td>
                            )}
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
