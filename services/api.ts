import { supabase } from './supabase';
import { User, Product, Sale, DashboardStats } from '../types';

export const api = {
  // ============ AUTHENTICATION ============
  
  signIn: async (email: string, password: string): Promise<User> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('No user data returned');

    // Get user profile from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) throw new Error(userError.message);
    if (!userData) throw new Error('User profile not found');

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    };
  },

  // Sign up removed - only admins can create users via saveUser()

  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !userData) return null;

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    };
  },

  // ============ DASHBOARD ============

  getDashboardStats: async (): Promise<DashboardStats> => {
    // Get all sales
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });

    if (salesError) throw new Error(salesError.message);

    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) throw new Error(productsError.message);

    // Calculate stats
    const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.total_price), 0) || 0;

    // Create a map for quick product lookup
    const productsMap = new Map(products?.map(p => [p.id, p]) || []);
    
    // Calculate total profit
    const totalProfit = sales?.reduce((sum, sale) => {
      const product = productsMap.get(sale.product_id);
      return product ? sum + (Number(sale.total_price) - (Number(product.cost) * sale.quantity)) : sum;
    }, 0) || 0;

    // Sales today
    const today = new Date().toISOString().split('T')[0];
    const salesToday = sales?.filter(s => s.date.startsWith(today)).length || 0;

    // Low stock items (less than 10)
    const lowStockItems = products?.filter(p => p.stock < 10).length || 0;

    // Sales by day for last 7 days
    const salesByDay: { [key: string]: number } = {};
    sales?.forEach(sale => {
      const day = new Date(sale.date).toLocaleDateString('en-US', { weekday: 'short' });
      const product = productsMap.get(sale.product_id);
      if (product) {
        const profit = Number(sale.total_price) - (Number(product.cost) * sale.quantity);
        salesByDay[day] = (salesByDay[day] || 0) + profit;
      }
    });

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();

    const chartData = last7Days.map(day => ({ day, profit: salesByDay[day] || 0 }));

    return {
      totalRevenue,
      totalProfit,
      salesToday,
      lowStockItems,
      salesByDay: chartData,
    };
  },

  // ============ PRODUCTS ============

  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      cost: Number(p.cost),
      stock: p.stock,
    }));
  },

  saveProduct: async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
    if (product.id) {
      // Update existing product
      const { data, error } = await supabase
        .from('products')
        .update({
          name: product.name,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
        })
        .eq('id', product.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Failed to update product');

      return {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        cost: Number(data.cost),
        stock: data.stock,
      };
    } else {
      // Create new product
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Failed to create product');

      return {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        cost: Number(data.cost),
        stock: data.stock,
      };
    }
  },

  deleteProduct: async (productId: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw new Error(error.message);
  },

  // ============ SALES ============

  getSales: async (): Promise<Sale[]> => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false })
      .limit(50); // Get last 50 sales

    if (error) throw new Error(error.message);

    return (data || []).map(s => ({
      id: s.id,
      productId: s.product_id,
      productName: s.product_name,
      quantity: s.quantity,
      totalPrice: Number(s.total_price),
      date: s.date,
    }));
  },

  logSale: async (productId: string, quantity: number): Promise<Sale> => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) throw new Error(productError.message);
    if (!product) throw new Error('Product not found');

    // Check stock
    if (product.stock < quantity) {
      throw new Error(`Not enough stock. Available: ${product.stock}`);
    }

    // Update stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: product.stock - quantity })
      .eq('id', productId);

    if (updateError) throw new Error(updateError.message);

    // Log sale
    const totalPrice = Number(product.price) * quantity;
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        product_id: productId,
        product_name: product.name,
        quantity,
        total_price: totalPrice,
        user_id: user.id,
      })
      .select()
      .single();

    if (saleError) throw new Error(saleError.message);
    if (!sale) throw new Error('Failed to log sale');

    return {
      id: sale.id,
      productId: sale.product_id,
      productName: sale.product_name,
      quantity: sale.quantity,
      totalPrice: Number(sale.total_price),
      date: sale.date,
    };
  },

  updateSale: async (saleId: string, productId: string, quantity: number): Promise<Sale> => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the old sale to restore stock
    const { data: oldSale, error: oldSaleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (oldSaleError) throw new Error(oldSaleError.message);
    if (!oldSale) throw new Error('Sale not found');

    // Get old product to restore stock
    const { data: oldProduct, error: oldProductError } = await supabase
      .from('products')
      .select('*')
      .eq('id', oldSale.product_id)
      .single();

    if (oldProductError) throw new Error(oldProductError.message);
    if (!oldProduct) throw new Error('Old product not found');

    // Restore stock from old sale
    await supabase
      .from('products')
      .update({ stock: oldProduct.stock + oldSale.quantity })
      .eq('id', oldSale.product_id);

    // Get new product details
    const { data: newProduct, error: newProductError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (newProductError) throw new Error(newProductError.message);
    if (!newProduct) throw new Error('Product not found');

    // Check new stock
    if (newProduct.stock < quantity) {
      // Rollback: restore old sale stock
      await supabase
        .from('products')
        .update({ stock: oldProduct.stock })
        .eq('id', oldSale.product_id);
      throw new Error(`Not enough stock. Available: ${newProduct.stock}`);
    }

    // Update new product stock
    await supabase
      .from('products')
      .update({ stock: newProduct.stock - quantity })
      .eq('id', productId);

    // Update sale
    const totalPrice = Number(newProduct.price) * quantity;
    const { data: updatedSale, error: updateError } = await supabase
      .from('sales')
      .update({
        product_id: productId,
        product_name: newProduct.name,
        quantity,
        total_price: totalPrice,
      })
      .eq('id', saleId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);
    if (!updatedSale) throw new Error('Failed to update sale');

    return {
      id: updatedSale.id,
      productId: updatedSale.product_id,
      productName: updatedSale.product_name,
      quantity: updatedSale.quantity,
      totalPrice: Number(updatedSale.total_price),
      date: updatedSale.date,
    };
  },

  deleteSale: async (saleId: string): Promise<void> => {
    // Get the sale to restore stock
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (saleError) throw new Error(saleError.message);
    if (!sale) throw new Error('Sale not found');

    // Get product to restore stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', sale.product_id)
      .single();

    if (productError) throw new Error(productError.message);
    if (!product) throw new Error('Product not found');

    // Restore stock
    await supabase
      .from('products')
      .update({ stock: product.stock + sale.quantity })
      .eq('id', sale.product_id);

    // Delete sale
    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId);

    if (deleteError) throw new Error(deleteError.message);
  },

  // ============ USERS ============

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
    }));
  },

  saveUser: async (user: Omit<User, 'id'> & { id?: string; password?: string }): Promise<User> => {
    if (user.id) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          name: user.name,
          email: user.email,
          role: user.role,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Failed to update user');

      // Update password if provided
      if (user.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          user.id,
          { password: user.password }
        );
        if (passwordError) throw new Error(passwordError.message);
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
      };
    } else {
      // Create new user
      if (!user.password) throw new Error('Password is required for new users');

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create user');

      // Create user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        })
        .select()
        .single();

      if (userError) {
        // Cleanup
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(userError.message);
      }

      if (!userData) throw new Error('Failed to create user profile');

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      };
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    // Delete from public.users first (will cascade)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) throw new Error(deleteError.message);

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw new Error(authError.message);
  },
};
