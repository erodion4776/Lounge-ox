
import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../App';
import { DashboardStats, Product, Sale } from '../types';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center space-x-4">
    <div className="bg-gray-700 p-3 rounded-full text-amber-400">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const SalesInsight: React.FC = () => {
    const [insights, setInsights] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchInsights = useCallback(async () => {
        setLoading(true);
        try {
            const products = await api.getProducts();
            const sales = await api.getSales();
            const result = await api.generateSalesInsights(products, sales);
            setInsights(result);
        } catch (error) {
            setInsights('Could not fetch AI insights.');
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-amber-400 mb-4">AI Sales Insights</h3>
            {insights ? (
                 <div className="text-gray-300 whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                    {insights.split('*').map((item, index) => item.trim() && <p key={index} className="my-1">{`• ${item.trim()}`}</p>)}
                </div>
            ) : (
                <div className="text-center text-gray-400">
                    <p>Click the button to generate sales insights using Gemini.</p>
                </div>
            )}
             <button
                onClick={fetchInsights}
                disabled={loading}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 disabled:bg-gray-600"
                >
                {loading ? 'Generating...' : 'Generate Insights'}
            </button>
        </div>
    );
};


const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  
  if (loading || !stats) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-gray-400">Here's a summary of your business performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={<CurrencyDollarIcon />} />
        <StatCard title="Total Profit" value={`$${stats.totalProfit.toLocaleString()}`} icon={<TrendingUpIcon />} />
        <StatCard title="Sales Today" value={stats.salesToday.toString()} icon={<ShoppingCartIcon />} />
        <StatCard title="Low Stock Items" value={stats.lowStockItems.toString()} icon={<ExclamationIcon />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-amber-400 mb-4">Weekly Profit</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.salesByDay} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <XAxis dataKey="day" stroke="#a0aec0" fontSize={12} />
                    <YAxis stroke="#a0aec0" fontSize={12} tickFormatter={(value) => `$${value}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }} cursor={{fill: 'rgba(245, 158, 11, 0.1)'}} />
                    <Legend wrapperStyle={{fontSize: "14px"}}/>
                    <Bar dataKey="profit" fill="#f59e0b" name="Profit" />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="lg:col-span-1">
            <SalesInsight />
        </div>
      </div>
    </div>
  );
};

// Icons
const CurrencyDollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01V8m0 0h.01M12 14h.01M12 16h.01M12 18h.01M12 20v-1m0-1v-1m0-1v-.01M12 14v.01M12 12v.01M12 10v.01M12 8V7.99M12 6V5.99M12 4V3m0 2c-4.418 0-8 2.015-8 4.5S7.582 16 12 16s8-2.015 8-4.5S16.418 5 12 5z" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ExclamationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

export default DashboardPage;
