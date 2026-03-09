
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Order, StoreSettings, OrderStatus, BoutiqueStore, ProductVariant } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface StoreContextType {
  stores: BoutiqueStore[];
  createStore: (name: string) => string;
  getStore: (storeId: string) => BoutiqueStore | undefined;
  addProduct: (storeId: string, product: Omit<Product, 'id' | 'status' | 'storeId'>) => void;
  updateProduct: (storeId: string, id: string, updates: Partial<Product>) => void;
  deleteProduct: (storeId: string, id: string) => void;
  placeOrder: (storeId: string, order: Omit<Order, 'id' | 'createdAt' | 'storeId'>) => string;
  updateOrderStatus: (storeId: string, id: string, status: OrderStatus) => void;
  updateSettings: (storeId: string, settings: StoreSettings) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'boutique_flow_stores';

function safeString(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function safeNumber(v: unknown, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function computeProductStockFromVariants(variants: ProductVariant[]) {
  return variants.reduce((sum, v) => sum + (Number.isFinite(v.stock) ? v.stock : 0), 0);
}

function computeProductStatus(stock: number): Product["status"] {
  return stock > 0 ? "In Stock" : "Out of Stock";
}

function normalizeProduct(raw: any): Product {
  const images: string[] =
    Array.isArray(raw?.images) && raw.images.every((x: any) => typeof x === "string")
      ? raw.images.filter(Boolean)
      : typeof raw?.image === "string" && raw.image
        ? [raw.image]
        : [];

  const variants: ProductVariant[] =
    Array.isArray(raw?.variants) && raw.variants.length > 0
      ? raw.variants.map((v: any, idx: number) => ({
          id: safeString(v?.id, `v-${idx}`),
          color: safeString(v?.color, "Default"),
          size: safeString(v?.size, "One Size"),
          stock: safeNumber(v?.stock, 0),
        }))
      : [
          {
            id: "v-0",
            color: "Default",
            size: "One Size",
            stock: safeNumber(raw?.stock, 0),
          },
        ];

  const stock = computeProductStockFromVariants(variants);

  return {
    id: safeString(raw?.id),
    storeId: safeString(raw?.storeId),
    name: safeString(raw?.name),
    description: safeString(raw?.description),
    price: safeNumber(raw?.price, 0),
    images: images.length > 0 ? images : ["https://picsum.photos/seed/product/600/800"],
    category: safeString(raw?.category, "Clothing"),
    variants,
    stock,
    status: computeProductStatus(stock),
  };
}

function normalizeStore(raw: any): BoutiqueStore {
  return {
    settings: raw.settings,
    products: Array.isArray(raw?.products) ? raw.products.map(normalizeProduct) : [],
    orders: Array.isArray(raw?.orders) ? raw.orders : [],
  };
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<BoutiqueStore[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setStores(Array.isArray(parsed) ? parsed.map(normalizeStore) : []);
    } else {
      // Seed initial store
      const initialId = 'demo-boutique';
      const initialStore: BoutiqueStore = {
        settings: {
          id: initialId,
          name: 'Boutique Flow',
          description: 'Elevate your style with our curated collection.',
          logo: 'https://picsum.photos/seed/logo/200/200',
          bankName: 'Global Bank',
          accountName: 'BOUTIQUE FLOW ENT',
          accountNumber: '1234567890',
          whatsappNumber: '+1234567890',
        },
        products: PlaceHolderImages.map((img, idx) =>
          normalizeProduct({
            id: `p-${idx}`,
            storeId: initialId,
            name: img.description,
            description: `High-quality ${img.description.toLowerCase()} perfect for your collection.`,
            price: Math.floor(Math.random() * 10000) + 500,
            images: [img.imageUrl],
            category: idx % 2 === 0 ? 'Clothing' : 'Accessories',
            variants: [{ id: 'v-0', color: 'Default', size: 'One Size', stock: 10 }],
          })
        ),
        orders: [],
      };
      setStores([initialStore]);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
    }
  }, [stores, initialized]);

  const createStore = (name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).substr(2, 4);
    const newStore: BoutiqueStore = {
      settings: {
        id,
        name,
        description: `Welcome to ${name}`,
        logo: 'https://picsum.photos/seed/' + id + '/200/200',
        bankName: '',
        accountName: '',
        accountNumber: '',
        whatsappNumber: '',
      },
      products: [],
      orders: [],
    };
    setStores(prev => [...prev, newStore]);
    return id;
  };

  const getStore = (storeId: string) => stores.find(s => s.settings.id === storeId);

  const addProduct = (storeId: string, productData: Omit<Product, 'id' | 'status' | 'storeId'>) => {
    setStores(prev => prev.map(store => {
      if (store.settings.id === storeId) {
        const normalized = normalizeProduct({
          ...productData,
          id: Math.random().toString(36).substr(2, 9),
          storeId,
        });
        const newProduct: Product = normalized;
        return { ...store, products: [newProduct, ...store.products] };
      }
      return store;
    }));
  };

  const updateProduct = (storeId: string, id: string, updates: Partial<Product>) => {
    setStores(prev => prev.map(store => {
      if (store.settings.id === storeId) {
        return {
          ...store,
          products: store.products.map(p => {
            if (p.id === id) {
              const merged = { ...p, ...updates };
              return normalizeProduct(merged);
            }
            return p;
          })
        };
      }
      return store;
    }));
  };

  const deleteProduct = (storeId: string, id: string) => {
    setStores(prev => prev.map(store => {
      if (store.settings.id === storeId) {
        return { ...store, products: store.products.filter(p => p.id !== id) };
      }
      return store;
    }));
  };

  const placeOrder = (storeId: string, orderData: Omit<Order, 'id' | 'createdAt' | 'storeId'>) => {
    const id = `ORD-${Math.random().toString(36).toUpperCase().substr(2, 6)}`;
    const newOrder: Order = {
      ...orderData,
      id,
      storeId,
      createdAt: new Date().toISOString(),
    };

    setStores(prev => prev.map(store => {
      if (store.settings.id === storeId) {
        // Update stock levels
        const updatedProducts = store.products.map(p => {
          const items = orderData.items.filter(i => i.productId === p.id);
          if (items.length === 0) return p;

          const nextVariants = p.variants.map(v => {
            const consumed = items
              .filter(i => i.variantId === v.id)
              .reduce((sum, i) => sum + i.quantity, 0);
            if (consumed <= 0) return v;
            return { ...v, stock: Math.max(0, v.stock - consumed) };
          });

          const nextStock = computeProductStockFromVariants(nextVariants);
          return {
            ...p,
            variants: nextVariants,
            stock: nextStock,
            status: computeProductStatus(nextStock),
          };
        });
        return { 
          ...store, 
          orders: [newOrder, ...store.orders],
          products: updatedProducts
        };
      }
      return store;
    }));

    return id;
  };

  const updateOrderStatus = (storeId: string, id: string, status: OrderStatus) => {
    setStores(prev => prev.map(store => {
      if (store.settings.id === storeId) {
        return { ...store, orders: store.orders.map(o => o.id === id ? { ...o, status } : o) };
      }
      return store;
    }));
  };

  const updateSettings = (storeId: string, newSettings: StoreSettings) => {
    setStores(prev => prev.map(store => {
      if (store.settings.id === storeId) {
        return { ...store, settings: newSettings };
      }
      return store;
    }));
  };

  return (
    <StoreContext.Provider value={{ 
      stores, 
      createStore,
      getStore,
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
