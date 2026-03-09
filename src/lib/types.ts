
export type ProductStatus = 'In Stock' | 'Out of Stock';

export interface ProductVariant {
  id: string;
  color: string;
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  /**
   * Total stock across all variants. Kept as a denormalized convenience value for UI/filters.
   * Always recomputed from `variants`.
   */
  stock: number;
  variants: ProductVariant[];
  status: ProductStatus;
}

export type OrderStatus = 'Pending Payment' | 'Payment Submitted' | 'Confirmed' | 'Completed' | 'Cancelled';
export type PaymentMethod = 'Bank Transfer' | 'Cash';

export interface OrderItem {
  productId: string;
  variantId: string;
  variantColor: string;
  variantSize: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  createdAt: string;
  source: 'POS' | 'Storefront';
  deliveryMethod: 'Pickup' | 'Delivery';
  deliveryAddress?: string;
}

export interface StoreSettings {
  id: string;
  name: string;
  description: string;
  logo: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  whatsappNumber: string;
  primaryColor?: string;
  banner?: string;
}

export interface BoutiqueStore {
  settings: StoreSettings;
  products: Product[];
  orders: Order[];
}
