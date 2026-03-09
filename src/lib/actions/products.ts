'use server';

import { createClient } from '@/lib/supabase/server';
import { Product, ProductVariant } from '@/lib/types';
import { revalidatePath } from 'next/cache';

type ProductInput = {
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  variants: Omit<ProductVariant, 'id'>[];
};

export async function addProduct(storeId: string, data: ProductInput): Promise<Product> {
  const supabase = await createClient();
  const totalStock = data.variants.reduce((s, v) => s + v.stock, 0);

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      store_id: storeId,
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      images: data.images,
      stock: totalStock,
      status: totalStock > 0 ? 'In Stock' : 'Out of Stock',
    })
    .select()
    .single();

  if (productError || !product) throw new Error(productError?.message ?? 'Failed to add product');

  if (data.variants.length > 0) {
    const variantRows = data.variants.map((v) => ({
      product_id: product.id,
      color: v.color,
      size: v.size,
      stock: v.stock,
    }));
    const { error: variantError } = await supabase.from('product_variants').insert(variantRows);
    if (variantError) throw new Error(variantError.message);
  }

  // Refresh variants
  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id);

  revalidatePath(`/admin/${storeId}/inventory`);

  return {
    id: product.id,
    storeId: product.store_id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    images: product.images,
    category: product.category,
    stock: product.stock,
    status: product.status as 'In Stock' | 'Out of Stock',
    variants: (variants ?? []).map((v) => ({
      id: v.id,
      color: v.color,
      size: v.size,
      stock: v.stock,
    })),
  };
}

export async function updateProduct(
  storeId: string,
  productId: string,
  data: ProductInput
): Promise<void> {
  const supabase = await createClient();
  const totalStock = data.variants.reduce((s, v) => s + v.stock, 0);

  const { error: productError } = await supabase
    .from('products')
    .update({
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      images: data.images,
      stock: totalStock,
      status: totalStock > 0 ? 'In Stock' : 'Out of Stock',
    })
    .eq('id', productId)
    .eq('store_id', storeId);

  if (productError) throw new Error(productError.message);

  // Replace variants: delete old, insert new
  await supabase.from('product_variants').delete().eq('product_id', productId);

  if (data.variants.length > 0) {
    const variantRows = data.variants.map((v) => ({
      product_id: productId,
      color: v.color,
      size: v.size,
      stock: v.stock,
    }));
    const { error: variantError } = await supabase.from('product_variants').insert(variantRows);
    if (variantError) throw new Error(variantError.message);
  }

  revalidatePath(`/admin/${storeId}/inventory`);
}

export async function deleteProduct(storeId: string, productId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('store_id', storeId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${storeId}/inventory`);
}
