
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  cost: number;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  date: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  salesToday: number;
  lowStockItems: number;
  salesByDay: { day: string; profit: number }[];
}
