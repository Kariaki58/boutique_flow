
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Order, StoreSettings, OrderStatus } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface StoreContextType {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  addProduct: (product: Omit<Product, 'id' | 'status'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  placeOrder: (order: Omit<Order, 'id' | 'createdAt'>) => string;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateSettings: (settings: StoreSettings) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const INITIAL_PRODUCTS: Product[] = PlaceHolderImages.map((img, idx) => ({
  id: `p-${idx}`,
  name: img.description,
  description: `High-quality ${img.description.toLowerCase()} perfect for your collection.`,
  price: Math.floor(Math.random() * 10000) + 500,
  image: img.imageUrl,
  category: idx % 2 === 0 ? 'Clothing' : 'Accessories',
  stock: 10,
  status: 'In Stock',
}));

const INITIAL_SETTINGS: StoreSettings = {
  name: 'Boutique Flow',
  description: 'Elevate your style with our curated collection.',
  logo: 'https://picsum.photos/seed/logo/200/200',
  bankName: 'Global Bank',
  accountName: 'BOUTIQUE FLOW ENT',
  accountNumber: '1234567890',
  whatsappNumber: '+1234567890',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);

  const addProduct = (product: Omit<Product, 'id' | 'status'>) => {
    const newProduct: Product = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
      status: product.stock > 0 ? 'In Stock' : 'Out of Stock',
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        updated.status = updated.stock > 0 ? 'In Stock' : 'Out of Stock';
        return updated;
      }
      return p;
    }));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const placeOrder = (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    const id = `ORD-${Math.random().toString(36).toUpperCase().substr(2, 6)}`;
    const newOrder: Order = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update stock levels
    orderData.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        updateProduct(product.id, { stock: Math.max(0, product.stock - item.quantity) });
      }
    });

    return id;
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
  };

  return (
    <StoreContext.Provider value={{ 
      products, 
      orders, 
      settings, 
      addProduct, 
      updateProduct, 
      deleteProduct, 
      placeOrder, 
      updateOrderStatus, 
      updateSettings 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
