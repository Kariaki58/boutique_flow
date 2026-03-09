'use server';

import { createClient } from '@/lib/supabase/server';
import { Order, OrderStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

type PlaceOrderInput = Omit<Order, 'id' | 'createdAt' | 'storeId' | 'orderNumber'>;

export async function placeOrder(storeId: string, orderData: PlaceOrderInput): Promise<string> {
  const supabase = await createClient();
  const orderNumber = `ORD-${Math.random().toString(36).toUpperCase().substring(2, 8)}`;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      store_id: storeId,
      order_number: orderNumber,
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      total: orderData.total,
      status: orderData.status,
      payment_method: orderData.paymentMethod,
      payment_proof_url: orderData.paymentProofUrl ?? null,
      source: orderData.source,
      delivery_method: orderData.deliveryMethod,
      delivery_address: orderData.deliveryAddress ?? null,
    })
    .select()
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? 'Failed to place order');

  if (orderData.items.length > 0) {
    const itemRows = orderData.items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      variant_id: i.variantId,
      variant_color: i.variantColor,
      variant_size: i.variantSize,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(itemRows);
    if (itemsError) throw new Error(itemsError.message);

    // Decrement variant stock for each line item
    for (const item of orderData.items) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', item.variantId)
        .single();

      if (variant) {
        const newStock = Math.max(0, variant.stock - item.quantity);
        await supabase
          .from('product_variants')
          .update({ stock: newStock })
          .eq('id', item.variantId);
      }
    }
  }

  revalidatePath(`/admin/${storeId}/orders`);
  revalidatePath(`/admin/${storeId}`);
  return orderNumber;
}

export async function updateOrderStatus(
  storeId: string,
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('store_id', storeId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${storeId}/orders`);
}
