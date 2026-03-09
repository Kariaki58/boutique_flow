
export type ProductStatus = 'In Stock' | 'Out of Stock';

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  status: ProductStatus;
}

export type OrderStatus = 'Pending Payment' | 'Payment Submitted' | 'Confirmed' | 'Completed' | 'Cancelled';
export type PaymentMethod = 'Bank Transfer' | 'Cash';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
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
}

export interface BoutiqueStore {
  settings: StoreSettings;
  products: Product[];
  orders: Order[];
}
