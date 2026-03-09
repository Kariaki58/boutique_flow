
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
import { useParams } from 'next/navigation';
import { Product, OrderItem, PaymentMethod } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Minus, Trash2, ShoppingCart, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Cart {
  id: string;
  name: string;
  items: OrderItem[];
}

export default function PosPage() {
  const { storeId } = useParams() as { storeId: string };
  const { getStore, placeOrder } = useStore();
  const store = getStore(storeId);
  const { toast } = useToast();
  
  const [carts, setCarts] = useState<Cart[]>([{ id: '1', name: 'Customer 1', items: [] }]);
  const [activeCartId, setActiveCartId] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');

  if (!store) return <p>Loading...</p>;

  const activeCart = carts.find(c => c.id === activeCartId) || carts[0];

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({ title: "Out of stock", variant: "destructive" });
      return;
    }

    setCarts(prev => prev.map(cart => {
      if (cart.id === activeCartId) {
        const existingItem = cart.items.find(i => i.productId === product.id);
        if (existingItem) {
          return {
            ...cart,
            items: cart.items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
          };
        }
        return {
          ...cart,
          items: [...cart.items, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]
        };
      }
      return cart;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCarts(prev => prev.map(cart => {
      if (cart.id === activeCartId) {
        return {
          ...cart,
          items: cart.items.filter(i => i.productId !== productId)
        };
      }
      return cart;
    }));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCarts(prev => prev.map(cart => {
      if (cart.id === activeCartId) {
        return {
          ...cart,
          items: cart.items.map(i => {
            if (i.productId === productId) {
              const newQty = Math.max(1, i.quantity + delta);
              return { ...i, quantity: newQty };
            }
            return i;
          })
        };
      }
      return cart;
    }));
  };

  const handleCheckout = (method: PaymentMethod) => {
    if (activeCart.items.length === 0) return;

    const total = activeCart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    placeOrder(storeId, {
      customerName: activeCart.name,
      customerPhone: 'In-Store',
      items: activeCart.items,
      total,
      status: method === 'Cash' ? 'Completed' : 'Payment Submitted',
      paymentMethod: method,
      source: 'POS'
    });

    toast({ title: "Order Placed", description: `Order for ${activeCart.name} completed.` });
    setCarts(prev => prev.map(c => c.id === activeCartId ? { ...c, items: [] } : c));
  };

  const filteredProducts = store.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = activeCart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">POS System</h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products..."
              className="pl-9 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className={cn(
                  "cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col",
                  product.stock <= 0 && "opacity-60 grayscale"
                )}
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square bg-muted relative">
                  <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                </div>
                <CardContent className="p-3">
                  <p className="font-semibold text-sm truncate">{product.name}</p>
                  <p className="text-primary font-bold">${product.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <Card className="sticky top-6 flex flex-col h-[calc(100vh-200px)]">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Current Order
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-grow">
              {activeCart.items.map(item => (
                <div key={item.productId} className="p-4 flex justify-between border-b">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">${item.price} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQuantity(item.productId, -1)}><Minus className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQuantity(item.productId, 1)}><Plus className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.productId)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="p-4 border-t flex flex-col gap-4 bg-muted/20">
              <div className="w-full flex justify-between items-center font-bold">
                <span>Total</span>
                <span className="text-2xl text-primary">${cartTotal}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button className="h-12 bg-green-600 hover:bg-green-700" disabled={activeCart.items.length === 0} onClick={() => handleCheckout('Cash')}>Cash</Button>
                <Button className="h-12" disabled={activeCart.items.length === 0} onClick={() => handleCheckout('Bank Transfer')}>Transfer</Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
