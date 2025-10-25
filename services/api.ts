import { supabase } from './supabase';
import { User, Product, Sale, DashboardStats } from '../types';

export const api = {
  signIn: async (email: string, password: string): Promise<User> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('No user data returned');

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

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });

    if (salesError) throw new Error(salesError.message);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) throw new Error(productsError.message);

    const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.total_price), 0) || 0;

    const productsMap = new Map(products?.map(p => [p.id, p]) || []);
    
    const totalProfit = sales?.reduce((sum, sale) => {
      const product = productsMap.get(sale.product_id);
      return product ? sum + (Number(sale.total_price) - (Number(product.cost) * sale.quantity)) : sum;
    }, 0) || 0;

    const today = new Date().toISOString().split('T')[0];
    const salesToday = sales?.filter(s => s.date.startsWith(today)).length || 0;

    const lowStockItems = products?.filter(p => p.stock < 10).length || 0;

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

  getSales: async (): Promise<Sale[]> => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false })
      .limit(50);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) throw new Error(productError.message);
    if (!product) throw new Error('Product not found');

    if (product.stock < quantity) {
      throw new Error(`Not enough stock. Available: ${product.stock}`);
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: product.stock - quantity })
      .eq('id', productId);

    if (updateError) throw new Error(updateError.message);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: oldSale, error: oldSaleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (oldSaleError) throw new Error(oldSaleError.message);
    if (!oldSale) throw new Error('Sale not found');

    const { data: oldProduct, error: oldProductError } = await supabase
      .from('products')
      .select('*')
      .eq('id', oldSale.product_id)
      .single();

    if (oldProductError) throw new Error(oldProductError.message);
    if (!oldProduct) throw new Error('Old product not found');

    await supabase
      .from('products')
      .update({ stock: oldProduct.stock + oldSale.quantity })
      .eq('id', oldSale.product_id);

    const { data: newProduct, error: newProductError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (newProductError) throw new Error(newProductError.message);
    if (!newProduct) throw new Error('Product not found');

    if (newProduct.stock < quantity) {
      await supabase
        .from('products')
        .update({ stock: oldProduct.stock })
        .eq('id', oldSale.product_id);
      throw new Error(`Not enough stock. Available: ${newProduct.stock}`);
    }

    await supabase
      .from('products')
      .update({ stock: newProduct.stock - quantity })
      .eq('id', productId);

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
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (saleError) throw new Error(saleError.message);
    if (!sale) throw new Error('Sale not found');

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', sale.product_id)
      .single();

    if (productError) throw new Error(productError.message);
    if (!product) throw new Error('Product not found');

    await supabase
      .from('products')
      .update({ stock: product.stock + sale.quantity })
      .eq('id', sale.product_id);

    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId);

    if (deleteError) throw new Error(deleteError.message);
  },

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

      if (user.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: user.password
        });
        if (passwordError) throw new Error(passwordError.message);
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
      };
    } else {
      if (!user.password) throw new Error('Password is required for new users');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            name: user.name,
            role: user.role
          }
        }
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create user');

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
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) throw new Error(deleteError.message);
  },
};
