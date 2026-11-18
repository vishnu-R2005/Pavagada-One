export type Product = {
  id: string;
  name: string;
  description?: string | null;
  price_paise: number;
  quantity: number;
  unit?: string | null;
  image_url?: string | null;
  is_active: number;
  category_id?: string | null;
  category_name?: string | null;
  low_stock_threshold?: number;
};

export type OrderPreviewItem = {
  product_name: string;
  quantity: number;
  total_paise: number;
  unit?: string | null;
  image_url?: string | null;
};

export type MerchantOrder = {
  id: string;
  order_no: string;
  status: string;
  total_paise: number;
  created_at: string;
  address_line?: string;
  landmark?: string | null;
  customer_name?: string;
  customer_phone?: string | null;
  items?: OrderPreviewItem[];
};

export type Shop = {
  id: string;
  name: string;
  phone: string;
  address: string;
  is_open: number;
  is_approved: number;
  opening_hours?: string | null;
  delivery_available?: number;
  image_url?: string | null;
};

export type OrderDetail = {
  order: MerchantOrder & {
    payment_method: string;
    payment_status: string;
    delivery_instructions?: string | null;
  };
  items: {
    product_name: string;
    quantity: number;
    total_paise: number;
    image_url?: string | null;
  }[];
};

export type Dashboard = {
  sales: {
    today: { orders: number; revenue: number };
    week: { orders: number; revenue: number };
    month: { orders: number; revenue: number };
  };
  lowStock: Product[];
  recentOrders: MerchantOrder[];
  topProducts: { product_name: string; units: number; revenue: number }[];
  statusCounts: { status: string; count: number }[];
};

export type Category = { id: string; name: string };

export type MerchantNotification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at?: string | null;
  type: string;
};

export type MerchantPage =
  | "home"
  | "orders"
  | "products"
  | "analytics"
  | "more"
  | "profile"
  | "edit-profile"
  | "settings"
  | "notifications"
  | "support"
  | "product-form"
  | "order-detail"
  | "order-status";
