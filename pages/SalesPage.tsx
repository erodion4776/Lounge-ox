

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../services/api';
import { Sale, Product, SalesSummary } from '../types';
import { useAuth } from '../App';

const RecordSaleForm: React.FC<{ products: Product[]; onSave: () => void; onCancel: () => void }> = ({ products, onSave, onCancel }) => {
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!productId) {
            setError('Please select a product.');
            return;
        }
        setLoading(true);
        try {
            await api.recordSale({ productId, quantity: Number(quantity) });
            onSave();
        } catch (err: any) {
            setError(err.message || 'Failed to record sale.');
        } finally {
            setLoading(false);
        }
    };

    const selectedProduct = products.find(p => p.id === productId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-full max-w-md">
                <h2 className="text-2xl font-bold text-amber-400 mb-6">Record New Sale</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Product</label>
                        <select
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            required
                            className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="">Select a product</option>
                            {products.filter(p => p.stock > 0).map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (Stock: {p.stock})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            min="1"
                            max={selectedProduct?.stock || 1}
                            required
                            className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                    </div>
                    {selectedProduct && (
                        <div className="text-right text-lg font-semibold text-gray-200">
                           Total: ₦{(selectedProduct.price * quantity).toLocaleString()}
                        </div>
                    )}
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="py-2 px-4 rounded-md text-gray-300 bg-gray-600 hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={loading || !productId} className="py-2 px-4 rounded-md text-gray-900 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-500">
                            {loading ? 'Recording...' : 'Record Sale'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const StatCard: React.FC<{ title: string; value: string; profit: string }> = ({ title, value, profit }) => {
    const { user } = useAuth();
    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {user?.role === 'admin' && <p className="text-sm text-green-400">Profit: {profit}</p>}
        </div>
    );
};

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

const SalesPage: React.FC = () => {
    const { user } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [summary, setSummary] = useState<SalesSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [salesData, productsData, summaryData] = await Promise.all([
                api.getSales(),
                api.getProducts(),
                api.getSalesSummary(),
            ]);
            setSales(salesData);
            setProducts(productsData);
            setSummary(summaryData);
        } catch (error) {
            console.error("Failed to fetch sales data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = () => {
        setIsModalOpen(false);
        fetchData();
    };

    const handleDelete = async (saleId: string) => {
        if (window.confirm('Are you sure you want to delete this sale? This will restore the stock count.')) {
            try {
                await api.deleteSale(saleId);
                fetchData(); // Refresh data
            } catch (error) {
                console.error("Failed to delete sale", error);
                alert("Could not delete the sale. Please try again.");
            }
        }
    };
    
    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Sales Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        
        const head = [['Date', 'Product', 'Qty', 'Total Price']];
        const body = sales.map(sale => [
            new Date(sale.date).toLocaleString(),
            sale.productName,
            sale.quantity.toString(),
            `₦${sale.totalPrice.toLocaleString()}`,
        ]);

        autoTable(doc, {
            startY: 40,
            head: head,
            body: body,
            headStyles: { fillColor: [245, 158, 11] }, // amber-500
            theme: 'striped'
        });

        doc.save('sales_report.pdf');
    };

    if (loading || !summary) {
        return <div className="text-center p-10">Loading sales data...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-3xl font-bold">Sales</h1>
                    <p className="text-gray-400">Track and manage your sales.</p>
                </div>
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsModalOpen(true)} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors">Record Sale</button>
                    <button onClick={handleDownloadPdf} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                        <DownloadIcon />
                        Download Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Today's Sales" value={`₦${summary.daily.sales.toLocaleString()}`} profit={`₦${summary.daily.profit.toLocaleString()}`} />
                <StatCard title="This Week" value={`₦${summary.weekly.sales.toLocaleString()}`} profit={`₦${summary.weekly.profit.toLocaleString()}`} />
                <StatCard title="This Month" value={`₦${summary.monthly.sales.toLocaleString()}`} profit={`₦${summary.monthly.profit.toLocaleString()}`} />
                <StatCard title="This Year" value={`₦${summary.yearly.sales.toLocaleString()}`} profit={`₦${summary.yearly.profit.toLocaleString()}`} />
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Price</th>
                                {user?.role === 'admin' && (
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider no-print">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                           {sales.length === 0 ? (
                                <tr><td colSpan={user?.role === 'admin' ? 5 : 4} className="text-center py-4 text-gray-400">No sales recorded yet.</td></tr>
                            ) : sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(sale.date).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{sale.productName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{sale.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">₦{sale.totalPrice.toLocaleString()}</td>
                                    {user?.role === 'admin' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium no-print">
                                            <button onClick={() => handleDelete(sale.id)} className="text-red-500 hover:text-red-400">Delete</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && <RecordSaleForm products={products} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default SalesPage;