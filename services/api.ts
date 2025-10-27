import { User, Product, Sale, DashboardStats, SalesSummary } from '../types';
import { supabase } from './supabase';

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message || 'Invalid credentials');
    // The onAuthStateChange listener in AuthProvider will handle fetching the user profile 
    // and updating the user state.
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const { data: sales, error: salesError } = await supabase.from('sales').select('*');
    const { data: products, error: productsError } = await supabase.from('products').select('*');
    if (salesError || productsError) throw new Error(salesError?.message || productsError?.message);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesTodayCount = sales.filter(s => new Date(s.date) >= today).length;
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);

    const totalProfit = sales.reduce((sum, sale) => {
      const product = products.find(p => p.id === sale.productId);
      const cost = product ? product.cost : 0;
      return sum + (sale.totalPrice - (sale.quantity * cost));
    }, 0);

    const lowStockItems = products.filter(p => p.stock < 10).length;

    const salesByDay: { day: string; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= date && saleDate < nextDate;
      });

      const dayProfit = daySales.reduce((sum, sale) => {
        const product = products.find(p => p.id === sale.productId);
        const cost = product ? product.cost : 0;
        return sum + (sale.totalPrice - (sale.quantity * cost));
      }, 0);

      salesByDay.push({
        day: date.toLocaleString('en-US', { weekday: 'short' }),
        profit: dayProfit,
      });
    }

    return { totalRevenue, totalProfit, salesToday: salesTodayCount, lowStockItems, salesByDay };
  },

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },

  async saveUser(user: Partial<User> & { password?: string }): Promise<User> {
    if (user.id) { // Update
      const { data, error } = await supabase
        .from('users')
        .update({ name: user.name, role: user.role, email: user.email })
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      
      // Update auth email if changed
      if (user.email) {
          const { data: authUser, error: authError } = await supabase.auth.updateUser({ email: user.email });
          if(authError) console.error("Could not update auth user's email", authError);
      }
      return data as User;
    } else { // Create
      if (!user.email || !user.password) {
        throw new Error("Email and password are required for new users.");
      }
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            role: user.role,
          },
        },
      });
      if (error || !data.user) throw new Error(error?.message || "Could not create user.");
      
      // The user profile is created by a trigger in Supabase, so we just return it.
      const { data: newUserProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !newUserProfile) throw new Error(profileError?.message || "Could not fetch new user profile.");

      return newUserProfile as User;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    // Note: This only deletes the user profile. The auth user remains.
    // Deleting auth users requires admin privileges and is unsafe from the client.
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw new Error(error.message);
  },

  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .upsert({ ...product })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Product;
  },

  async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw new Error(error.message);
  },

  async getSales(): Promise<Sale[]> {
    const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async recordSale(saleData: { productId: string; quantity: number }): Promise<Sale> {
    const { data, error } = await supabase.rpc('record_sale', {
        product_id_in: saleData.productId,
        quantity_in: saleData.quantity
    }).single();

    if (error) {
        console.error("RPC Error:", error);
        throw new Error(error.message);
    }
    if (!data) throw new Error("Failed to record sale, no data returned.");
    
    // The RPC function returns a single record of the new sale.
    return data as Sale;
  },
  
  async deleteSale(saleId: string): Promise<void> {
    // This should be a transaction in a real app, but for now, we'll perform the operations sequentially.

    // 1. Fetch the sale to get product ID and quantity
    const { data: saleToDelete, error: fetchError } = await supabase
        .from('sales')
        .select('productId, quantity')
        .eq('id', saleId)
        .single();
    
    if (fetchError || !saleToDelete) {
        throw new Error(fetchError?.message || "Sale not found");
    }

    const { productId, quantity } = saleToDelete;

    // 2. Fetch the current product to get its stock
    const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

    if (productError || !product) {
        throw new Error(productError?.message || "Product associated with sale not found");
    }

    // 3. Calculate and update the product's stock
    const newStock = product.stock + quantity;
    const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

    if (updateError) {
        throw new Error(`Failed to restore stock: ${updateError.message}`);
    }

    // 4. Finally, delete the sale record
    const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

    if (deleteError) {
        // This is a problematic state: stock was restored but the sale wasn't deleted.
        // A database transaction (via another RPC function) would be the proper fix.
        // For now, we will throw an error and log a warning.
        console.warn(`CRITICAL: Product stock for ID ${productId} was restored, but failed to delete sale ID ${saleId}. Manual database correction may be required.`);
        throw new Error(`Failed to delete sale after restoring stock: ${deleteError.message}`);
    }
  },

  async getSalesSummary(): Promise<SalesSummary> {
    // This logic remains client-side for now but could be moved to a db function.
    const { data: sales, error: salesError } = await supabase.from('sales').select('*');
    const { data: allProducts, error: productsError } = await supabase.from('products').select('*');
    if (salesError || productsError) throw new Error(salesError?.message || productsError?.message);

    const now = new Date();
    
    const getProfit = (sale: Sale) => {
        const product = allProducts.find(p => p.id === sale.productId);
        const cost = product ? product.cost : 0;
        return sale.totalPrice - (sale.quantity * cost);
    };

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const currentDay = now.getDay();
    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() - currentDay);
    weekStartDate.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const dailySales = sales.filter(s => new Date(s.date) >= todayStart);
    const weeklySales = sales.filter(s => new Date(s.date) >= weekStartDate);
    const monthlySales = sales.filter(s => new Date(s.date) >= monthStart);
    const yearlySales = sales.filter(s => new Date(s.date) >= yearStart);

    return {
      daily: {
        sales: dailySales.reduce((sum, s) => sum + s.totalPrice, 0),
        profit: dailySales.reduce((sum, s) => sum + getProfit(s), 0),
      },
      weekly: {
        sales: weeklySales.reduce((sum, s) => sum + s.totalPrice, 0),
        profit: weeklySales.reduce((sum, s) => sum + getProfit(s), 0),
      },
      monthly: {
        sales: monthlySales.reduce((sum, s) => sum + s.totalPrice, 0),
        profit: monthlySales.reduce((sum, s) => sum + getProfit(s), 0),
      },
      yearly: {
        sales: yearlySales.reduce((sum, s) => sum + s.totalPrice, 0),
        profit: yearlySales.reduce((sum, s) => sum + getProfit(s), 0),
      },
    };
  },
};