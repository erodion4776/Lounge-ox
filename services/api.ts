import { User, Product, Sale, DashboardStats } from '../types';

// --- MOCK DATABASE ---

// USERS
let mockUsers: (User & { password?: string })[] = [
    { id: '1', email: 'eroeliza1234@gmail.com', name: 'Admin', role: 'admin', password: '1220iloveyou' },
    { id: '2', email: 'staff@xo.com', name: 'Sales Staff', role: 'sales_staff', password: 'password' },
];
let nextUserId = mockUsers.length + 1;

// PRODUCTS
let mockProducts: Product[] = [
    { id: '1', name: 'Premium Laptop', price: 750000, stock: 15, cost: 550000 },
    { id: '2', name: 'Wireless Mouse', price: 25000, stock: 40, cost: 15000 },
    { id: '3', name: 'Mechanical Keyboard', price: 80000, stock: 25, cost: 50000 },
    { id: '4', name: '4K Monitor', price: 350000, stock: 8, cost: 280000 },
    { id: '5', name: 'USB-C Hub', price: 45000, stock: 30, cost: 30000 },
    { id: '6', name: 'Webcam HD', price: 55000, stock: 0, cost: 40000 },
];

let mockSales: Sale[] = [
    { id: 's1', productId: '1', productName: 'Premium Laptop', quantity: 1, totalPrice: 750000, date: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 's2', productId: '3', productName: 'Mechanical Keyboard', quantity: 2, totalPrice: 160000, date: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: 's3', productId: '2', productName: 'Wireless Mouse', quantity: 5, totalPrice: 125000, date: new Date().toISOString() },
    { id: 's4', productId: '4', productName: '4K Monitor', quantity: 1, totalPrice: 350000, date: new Date(Date.now() - 86400000 * 3).toISOString() },
];

let nextProductId = mockProducts.length + 1;
let nextSaleId = mockSales.length + 1;

// --- API FUNCTIONS ---
export const api = {
  signIn: async (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => { // Simulate network delay
        const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          resolve(userWithoutPassword as User);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const totalRevenue = mockSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    
    const productsMap = new Map(mockProducts.map(p => [p.id, p]));
    const totalProfit = mockSales.reduce((sum, sale) => {
        const product = productsMap.get(sale.productId);
        return product ? sum + (sale.totalPrice - (product.cost * sale.quantity)) : sum;
    }, 0);

    const today = new Date().toISOString().split('T')[0];
    const salesToday = mockSales.filter(s => s.date.startsWith(today)).length;
    
    const lowStockItems = mockProducts.filter(p => p.stock < 10).length;
    
    const salesByDay: { [key: string]: number } = {};
    mockSales.forEach(sale => {
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

    const chartData = last7Days.map(day => ({ day, profit: salesByDay[day] || 0 }));

    return { totalRevenue, totalProfit, salesToday, lowStockItems, salesByDay: chartData };
  },

  getProducts: async (): Promise<Product[]> => {
    return [...mockProducts].sort((a, b) => a.name.localeCompare(b.name));
  },

  getSales: async (): Promise<Sale[]> => {
    return [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  logSale: async (productId: string, quantity: number): Promise<Sale> => {
    const product = mockProducts.find(p => p.id === productId);
        
    if (!product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error('Not enough stock');

    product.stock -= quantity;

    const newSale: Sale = {
      id: `s${nextSaleId++}`,
      productId: productId,
      productName: product.name,
      quantity,
      totalPrice: product.price * quantity,
      date: new Date().toISOString(),
    };
    mockSales.push(newSale);
    return newSale;
  },

  saveProduct: async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
    if (product.id) {
      const index = mockProducts.findIndex(p => p.id === product.id);
      if (index !== -1) {
        mockProducts[index] = { ...mockProducts[index], ...product };
        return mockProducts[index];
      }
      throw new Error('Failed to update product.');
    } else {
      const newProduct: Product = {
        id: `${nextProductId++}`,
        ...product,
      } as Product;
      mockProducts.push(newProduct);
      return newProduct;
    }
  },

  deleteProduct: async (productId: string): Promise<void> => {
    const index = mockProducts.findIndex(p => p.id === productId);
    if (index > -1) {
      mockProducts.splice(index, 1);
      return;
    }
    throw new Error('Failed to delete product.');
  },

  // USER MANAGEMENT API
  getUsers: async (): Promise<User[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockUsers.map(({ password, ...user }) => user));
        }, 300);
    });
  },

  saveUser: async (user: Omit<User, 'id'> & { id?: string, password?: string }): Promise<User> => {
     return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (user.id) { // Update
                const index = mockUsers.findIndex(u => u.id === user.id);
                if (index !== -1) {
                    const existingUser = mockUsers[index];
                    const updatedUser = { 
                        ...existingUser, 
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        // Only update password if a new one is provided and not empty
                        password: user.password ? user.password : existingUser.password
                    };
                    mockUsers[index] = updatedUser;
                    const { password, ...userToReturn } = updatedUser;
                    resolve(userToReturn as User);
                } else {
                    reject(new Error('User not found for update.'));
                }
            } else { // Create
                if (!user.password) {
                    reject(new Error('Password is required for new users.'));
                    return;
                }
                const newUser = {
                    ...user,
                    id: `${nextUserId++}`,
                } as (User & { password?: string });
                mockUsers.push(newUser);
                const { password, ...userToReturn } = newUser;
                resolve(userToReturn as User);
            }
        }, 500);
    });
  },

  deleteUser: async (userId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = mockUsers.findIndex(u => u.id === userId);
            if (index > -1) {
                if (mockUsers[index].email === 'eroeliza1234@gmail.com') {
                    reject(new Error('Cannot delete the main admin account.'));
                    return;
                }
                mockUsers.splice(index, 1);
                resolve();
            } else {
                reject(new Error('Failed to delete user.'));
            }
        }, 500);
    });
  },
};