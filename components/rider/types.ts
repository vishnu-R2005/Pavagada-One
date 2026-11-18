export type RiderProfile = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  rider_available: number;
  created_at?: string;
};

export type RiderItemPreview = {
  product_name: string;
  quantity: number;
  image_url: string | null;
};

export type RiderOrderItem = {
  id: string;
  product_name: string;
  unit_price_paise: number;
  quantity: number;
  total_paise: number;
  image_url?: string | null;
  unit?: string | null;
};

export type RiderDelivery = {
  id: string;
  assignment_id?: string;
  assignment_status?: string | null;
  assigned_at?: string | null;
  delivered_at?: string | null;
  order_no: string;
  status: string;
  subtotal_paise?: number;
  total_paise: number;
  delivery_fee_paise: number;
  payment_method?: string;
  payment_status?: string;
  delivery_instructions?: string | null;
  created_at: string;
  shop_name: string;
  shop_address: string;
  shop_phone?: string | null;
  shop_image?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  address_label?: string | null;
  address_line: string;
  landmark?: string | null;
  item_count: number;
  preview_image?: string | null;
  preview_name?: string | null;
  items_preview?: RiderItemPreview[];
};

export type RiderNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at?: string | null;
  created_at: string;
};

export type RiderDashboardData = {
  profile: RiderProfile;
  active: RiderDelivery[];
  available: RiderDelivery[];
  history: RiderDelivery[];
  earnings: {
    today: { deliveries: number; earnings: number; cod_collected?: number };
    week: { deliveries: number; earnings: number };
    allTime?: { deliveries: number; earnings: number };
  };
  stats?: {
    cancelled: number;
  };
};

export type RiderPage =
  | "home"
  | "orders"
  | "order-detail"
  | "pickup"
  | "map"
  | "deliver"
  | "earnings"
  | "history"
  | "profile"
  | "more"
  | "notifications"
  | "support";
