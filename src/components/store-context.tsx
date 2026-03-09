
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Order, StoreSettings, OrderStatus, BoutiqueStore, ProductVariant } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ShoppingBag } from 'lucide-react';

interface StoreContextType {
  stores: BoutiqueStore[];
  createStore: (name: string) => Promise<string>;
  getStore: (storeId: string) => BoutiqueStore | undefined;
  addProduct: (storeId: string, product: Omit<Product, 'id' | 'status' | 'storeId'>) => Promise<void>;
  updateProduct: (storeId: string, id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (storeId: string, id: string) => Promise<void>;
  placeOrder: (storeId: string, order: Omit<Order, 'id' | 'createdAt' | 'storeId' | 'orderNumber'>) => Promise<string>;
  updateOrderStatus: (storeId: string, id: string, status: OrderStatus) => Promise<void>;
  updateSettings: (storeId: string, settings: StoreSettings) => Promise<void>;
  loadPublicStore: (storeId: string) => Promise<void>;
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

import { getMyStores, getStoreById, createStore as createStoreAction, updateSettings as updateSettingsAction } from '@/lib/actions/stores';
import { addProduct as addProductAction, updateProduct as updateProductAction, deleteProduct as deleteProductAction } from '@/lib/actions/products';
import { placeOrder as placeOrderAction, updateOrderStatus as updateOrderStatusAction } from '@/lib/actions/orders';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<BoutiqueStore[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshStores = async () => {
    try {
      const data = await getMyStores();
      setStores(data);
    } catch (error) {
      console.error("Failed to refresh stores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStores();
  }, []);

  const createStore = async (name: string) => {
    const id = await createStoreAction(name);
    await refreshStores();
    return id;
  };

  const getStore = (storeId: string) => stores.find(s => s.settings.id === storeId);

  const addProduct = async (storeId: string, productData: any) => {
    await addProductAction(storeId, productData);
    await refreshStores();
  };

  const updateProduct = async (storeId: string, id: string, updates: any) => {
    await updateProductAction(storeId, id, updates);
    await refreshStores();
  };

  const deleteProduct = async (storeId: string, id: string) => {
    await deleteProductAction(storeId, id);
    await refreshStores();
  };

  const placeOrder = async (storeId: string, orderData: any) => {
    const id = await placeOrderAction(storeId, orderData);
    await refreshStores();
    return id;
  };

  const updateOrderStatus = async (storeId: string, id: string, status: OrderStatus) => {
    await updateOrderStatusAction(storeId, id, status);
    await refreshStores();
  };

  const updateSettings = async (storeId: string, newSettings: StoreSettings) => {
    await updateSettingsAction(storeId, newSettings);
    await refreshStores();
  };

  const loadPublicStore = async (storeId: string) => {
    // If already loaded, don't fetch again
    if (stores.find(s => s.settings.id === storeId)) return;

    try {
      const store = await getStoreById(storeId);
      if (store) {
        setStores(prev => {
          if (prev.find(s => s.settings.id === storeId)) return prev;
          return [...prev, store];
        });
      }
    } catch (error) {
      console.error("Failed to load public store:", error);
    }
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
      updateSettings,
      loadPublicStore
    }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F4F7]">
          <div className="flex flex-col items-center gap-4">
            <ShoppingBag className="w-10 h-10 text-primary animate-pulse" />
            <p className="text-sm font-medium text-muted-foreground">Initializing Boutique Flow…</p>
          </div>
        </div>
      ) : children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
