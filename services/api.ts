import { User, Product, Sale, DashboardStats } from '../types';
import { GoogleGenAI } from "@google/genai";
import { supabase } from './supabase';

// API FUNCTIONS
export const api = {
  signIn: async (email: string): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      console.error('Sign-in error:', error);
      throw new Error('Invalid credentials');
    }

    return data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const [
        { data: sales, error: salesError },
        { data: products, error: productsError }
    ] = await Promise.all([
        supabase.from('sales').select('*'),
        supabase.from('products').select('*')
    ]);

    if (salesError || productsError) {
        console.error('Dashboard stats error:', salesError || productsError);
        throw new Error('Failed to fetch data for dashboard stats.');
    }

    if (!sales || !products) {
        return { totalRevenue: 0, totalProfit: 0, salesToday: 0, lowStockItems: 0, salesByDay: [] };
    }

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    
    const productsMap = new Map(products.map(p => [p.id, p]));

    const totalProfit = sales.reduce((sum, sale) => {
        const product = productsMap.get(sale.productId);
        if (product) {
            return sum + (sale.totalPrice - (product.cost * sale.quantity));
        }
        return sum;
    }, 0);

    const today = new Date().toISOString().split('T')[0];
    const salesToday = sales.filter(s => s.date.startsWith(today)).length;
    
    const lowStockItems = products.filter(p => p.stock < 10).length;
    
    const salesByDay: { [key: string]: number } = {};
    sales.forEach(sale => {
        const day = new Date(sale.date).toLocaleDateString('en-US', { weekday: 'short' });
        const product = productsMap.get(sale.productId);
        if (product) {
            const profit = sale.totalPrice - (product.cost * sale.quantity);
            salesByDay[day] = (salesByDay[day] || 0) + profit;
        }
    });
    
    const last7Days = Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();

    const chartData = last7Days.map(day => ({
        day,
        profit: salesByDay[day] || 0,
    }));

    return { totalRevenue, totalProfit, salesToday, lowStockItems, salesByDay: chartData };
  },

  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  getSales: async (): Promise<Sale[]> => {
    const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  logSale: async (productId: string, quantity: number): Promise<Sale> => {
    const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, stock, cost')
        .eq('id', productId)
        .single();
        
    if (productError || !product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error('Not enough stock');

    const newStock = product.stock - quantity;
    const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);
        
    if (updateError) throw new Error('Failed to update product stock.');

    const newSaleData = {
      product_id: productId,
      product_name: product.name,
      quantity,
      total_price: product.price * quantity,
      date: new Date().toISOString(),
    };
    const { data: insertedSale, error: insertError } = await supabase
        .from('sales')
        .insert(newSaleData)
        .select()
        .single();

    if (insertError || !insertedSale) throw new Error('Failed to log sale.');
    
    // Supabase client maps snake_case to camelCase
    return insertedSale as unknown as Sale;
  },

  saveProduct: async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
    const productData = {
        name: product.name,
        price: product.price,
        stock: product.stock,
        cost: product.cost,
    };

    if (product.id) {
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', product.id)
            .select()
            .single();
        if (error || !data) throw new Error('Failed to update product.');
        return data;
    } else {
        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();
        if (error || !data) throw new Error('Failed to create product.');
        return data;
    }
  },

  deleteProduct: async (productId: string): Promise<void> => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
    if (error) throw new Error('Failed to delete product.');
  },

  // GEMINI API FUNCTION (unchanged)
  generateSalesInsights: async (products: Product[], sales: Sale[]): Promise<string> => {
    if (!process.env.API_KEY) {
        return "API Key not configured. Please set up your environment variables.";
    }
    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const prompt = `
            Analyze the following sales and product data for an e-commerce store.
            Provide actionable insights for the business owner.

            - Identify the top-selling products by revenue.
            - Identify products with low stock that are selling well.
            - Suggest a sales trend based on the recent sales data.
            - Propose a simple marketing or promotion idea based on the data.
            
            Keep the analysis concise and easy to read, using bullet points.

            **Product Data (Inventory):**
            ${JSON.stringify(products, null, 2)}

            **Recent Sales Data:**
            ${JSON.stringify(sales.slice(0, 10), null, 2)}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating sales insights:", error);
        return "Failed to generate AI insights. Please check the console for more details.";
    }
  }
};