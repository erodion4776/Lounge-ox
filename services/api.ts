
import { User, Product, Sale, DashboardStats } from '../types';
import { GoogleGenAI } from "@google/genai";

// MOCK DATA
let mockProducts: Product[] = [
  { id: '1', name: 'Espresso Machine', price: 350, stock: 15, cost: 200 },
  { id: '2', name: 'Premium Coffee Beans (1kg)', price: 45, stock: 48, cost: 25 },
  { id: '3', name: 'Milk Frother', price: 80, stock: 8, cost: 50 },
  { id: '4', name: 'Barista Tamper', price: 25, stock: 30, cost: 12 },
  { id: '5', name: 'Digital Scale', price: 35, stock: 4, cost: 20 },
];

let mockSales: Sale[] = [
  { id: 's1', productId: '1', productName: 'Espresso Machine', quantity: 2, totalPrice: 700, date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 's2', productId: '2', productName: 'Premium Coffee Beans (1kg)', quantity: 5, totalPrice: 225, date: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 's3', productId: '3', productName: 'Milk Frother', quantity: 3, totalPrice: 240, date: new Date().toISOString() },
  { id: 's4', productId: '2', productName: 'Premium Coffee Beans (1kg)', quantity: 3, totalPrice: 135, date: new Date().toISOString() },
];

const mockAdminUser: User = { id: 'user1', email: 'manager@xo.com', name: 'Alex Doe', role: 'admin' };
const mockStaffUser: User = { id: 'user2', email: 'staff@xo.com', name: 'Jane Smith', role: 'sales_staff' };

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// MOCK API FUNCTIONS
export const api = {
  signIn: async (email: string): Promise<User> => {
    await delay(500);
    if (email.toLowerCase() === mockAdminUser.email) {
      return Promise.resolve(mockAdminUser);
    }
    if (email.toLowerCase() === mockStaffUser.email) {
      return Promise.resolve(mockStaffUser);
    }
    return Promise.reject(new Error('Invalid credentials'));
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    await delay(500);
    const totalRevenue = mockSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalProfit = mockSales.reduce((sum, sale) => {
        const product = mockProducts.find(p => p.id === sale.productId);
        if (product) {
            return sum + (sale.totalPrice - (product.cost * sale.quantity));
        }
        return sum;
    }, 0);
    const today = new Date().toISOString().split('T')[0];
    const salesToday = mockSales.filter(s => s.date.startsWith(today)).length;
    const lowStockItems = mockProducts.filter(p => p.stock < 10).length;
    
    // Create sales by day for the chart
    const salesByDay: { [key: string]: number } = {};
    mockSales.forEach(sale => {
        const day = new Date(sale.date).toLocaleDateString('en-US', { weekday: 'short' });
        const product = mockProducts.find(p => p.id === sale.productId);
        if (product) {
            const profit = sale.totalPrice - (product.cost * sale.quantity);
            salesByDay[day] = (salesByDay[day] || 0) + profit;
        }
    });
    
    // Ensure we have data for the last 7 days for a consistent chart
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
    await delay(300);
    return [...mockProducts];
  },

  getSales: async (): Promise<Sale[]> => {
    await delay(300);
    return [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  logSale: async (productId: string, quantity: number): Promise<Sale> => {
    await delay(500);
    const product = mockProducts.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error('Not enough stock');

    product.stock -= quantity;
    const newSale: Sale = {
      id: `s${mockSales.length + 1}`,
      productId,
      productName: product.name,
      quantity,
      totalPrice: product.price * quantity,
      date: new Date().toISOString(),
    };
    mockSales.unshift(newSale);
    return newSale;
  },

  saveProduct: async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
    await delay(500);
    if (product.id) {
      // Update
      const index = mockProducts.findIndex(p => p.id === product.id);
      if (index === -1) throw new Error('Product not found');
      mockProducts[index] = { ...mockProducts[index], ...product };
      return mockProducts[index];
    } else {
      // Create
      const newProduct: Product = {
        ...product,
        id: `${Date.now()}`,
      };
      mockProducts.push(newProduct);
      return newProduct;
    }
  },

  deleteProduct: async (productId: string): Promise<void> => {
    await delay(500);
    mockProducts = mockProducts.filter(p => p.id !== productId);
    return;
  },

  // GEMINI API FUNCTION
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