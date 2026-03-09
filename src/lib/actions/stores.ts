'use server';

import { createClient } from '@/lib/supabase/server';
import { BoutiqueStore, StoreSettings } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getMyStores(): Promise<BoutiqueStore[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: storesData, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error || !storesData) return [];

  const stores: BoutiqueStore[] = await Promise.all(
    storesData.map(async (s) => {
      const { data: productsData } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('store_id', s.id)
        .order('created_at', { ascending: false });

      const products = (productsData ?? []).map((p: any) => ({
        id: p.id,
        storeId: p.store_id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        buyingPrice: Number(p.buying_price),
        images: p.images ?? [],
        category: p.category,
        stock: p.stock,
        status: p.status as 'In Stock' | 'Out of Stock',
        variants: (p.product_variants ?? []).map((v: any) => ({
          id: v.id,
          color: v.color,
          size: v.size,
          stock: v.stock,
        })),
      }));

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('store_id', s.id)
        .order('created_at', { ascending: false });

      const orders = (ordersData ?? []).map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number || o.id,
        storeId: o.store_id,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        total: Number(o.total),
        status: o.status,
        paymentMethod: o.payment_method,
        paymentProofUrl: o.payment_proof_url,
        source: o.source,
        deliveryMethod: o.delivery_method || 'Pickup',
        deliveryAddress: o.delivery_address,
        createdAt: o.created_at,
        items: (o.order_items ?? []).map((i: any) => ({
          productId: i.product_id,
          variantId: i.variant_id,
          variantColor: i.variant_color,
          variantSize: i.variant_size,
          name: i.name,
          price: Number(i.price),
          quantity: i.quantity,
        })),
      }));

      return {
        settings: {
          id: s.id,
          name: s.name,
          description: s.description,
          logo: s.logo,
          bankName: s.bank_name,
          accountName: s.account_name,
          accountNumber: s.account_number,
          whatsappNumber: s.whatsapp_number,
          primaryColor: s.primary_color,
          banner: s.banner_url,
          isActivated: s.is_activated,
          activationReference: s.activation_reference,
        },
        products,
        orders,
      };
    })
  );

  return stores;
}

export async function getStoreById(storeId: string): Promise<BoutiqueStore | null> {
  const supabase = await createClient();

  const { data: s, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (error || !s) return null;

  const { data: productsData } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('store_id', s.id)
    .order('created_at', { ascending: false });

  const products = (productsData ?? []).map((p: any) => ({
    id: p.id,
    storeId: p.store_id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    buyingPrice: Number(p.buying_price),
    images: p.images ?? [],
    category: p.category,
    stock: p.stock,
    status: p.status as 'In Stock' | 'Out of Stock',
    variants: (p.product_variants ?? []).map((v: any) => ({
      id: v.id,
      color: v.color,
      size: v.size,
      stock: v.stock,
    })),
  }));

  const { data: ordersData } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('store_id', s.id)
    .order('created_at', { ascending: false });

  const orders = (ordersData ?? []).map((o: any) => ({
    id: o.id,
    orderNumber: o.order_number || o.id,
    storeId: o.store_id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    total: Number(o.total),
    status: o.status,
    paymentMethod: o.payment_method,
    paymentProofUrl: o.payment_proof_url,
    source: o.source,
    deliveryMethod: o.delivery_method || 'Pickup',
    deliveryAddress: o.delivery_address,
    createdAt: o.created_at,
    items: (o.order_items ?? []).map((i: any) => ({
      productId: i.product_id,
      variantId: i.variant_id,
      variantColor: i.variant_color,
      variantSize: i.variant_size,
      name: i.name,
      price: Number(i.price),
      quantity: i.quantity,
    })),
  }));

  return {
    settings: {
      id: s.id,
      name: s.name,
      description: s.description,
      logo: s.logo,
      bankName: s.bank_name,
      accountName: s.account_name,
      accountNumber: s.account_number,
      whatsappNumber: s.whatsapp_number,
      primaryColor: s.primary_color,
      banner: s.banner_url,
      isActivated: s.is_activated,
      activationReference: s.activation_reference,
    },
    products,
    orders,
  };
}

export async function createStore(name: string): Promise<{ storeId: string; checkoutUrl: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error('Not authenticated');

  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).substr(2, 4);

  const { error } = await supabase.from('stores').insert({
    id,
    user_id: user.id,
    name,
    description: `Welcome to ${name}`,
    logo: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    whatsapp_number: '',
    is_activated: false,
  });

  if (error) throw new Error(error.message);

  const { initializePaystackPayment } = await import('@/lib/paystack');
  const { authorization_url, reference } = await initializePaystackPayment(user.email, 2500, {
    storeId: id,
    userId: user.id,
    type: 'store_activation',
  });

  await supabase
    .from('stores')
    .update({ activation_reference: reference })
    .eq('id', id);

  revalidatePath('/');
  return { storeId: id, checkoutUrl: authorization_url };
}

export async function verifyStoreActivation(storeId: string, reference: string): Promise<boolean> {
  const supabase = await createClient();
  const { verifyPaystackPayment } = await import('@/lib/paystack');
  
  try {
    const paymentData = await verifyPaystackPayment(reference);
    
    if (paymentData.status === 'success' && paymentData.metadata.storeId === storeId) {
      const { error } = await supabase
        .from('stores')
        .update({ is_activated: true })
        .eq('id', storeId);
        
      if (error) throw new Error(error.message);
      
      revalidatePath(`/admin/${storeId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying store activation:', error);
    return false;
  }
}

export async function reinitializeActivationPayment(storeId: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error('Not authenticated');

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('name, is_activated')
    .eq('id', storeId)
    .single();

  if (storeError || !store) throw new Error('Store not found');
  if (store.is_activated) throw new Error('Store is already activated');

  const { initializePaystackPayment } = await import('@/lib/paystack');
  const { authorization_url, reference } = await initializePaystackPayment(user.email, 2500, {
    storeId,
    userId: user.id,
    type: 'store_activation',
  });

  await supabase
    .from('stores')
    .update({ activation_reference: reference })
    .eq('id', storeId);

  return authorization_url;
}

export async function updateSettings(storeId: string, settings: StoreSettings): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('stores')
    .update({
      name: settings.name,
      description: settings.description,
      logo: settings.logo,
      bank_name: settings.bankName,
      account_name: settings.accountName,
      account_number: settings.accountNumber,
      whatsapp_number: settings.whatsappNumber,
      primary_color: settings.primaryColor,
      banner_url: settings.banner,
    })
    .eq('id', storeId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${storeId}`);
}
