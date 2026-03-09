
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
import { Product, OrderItem, PaymentMethod } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Cart {
  id: string;
  name: string;
  items: OrderItem[];
}

export default function PosPage() {
  const { products, placeOrder } = useStore();
  const { toast } = useToast();
  const [carts, setCarts] = useState<Cart[]>([{ id: '1', name: 'Customer 1', items: [] }]);
  const [activeCartId, setActiveCartId] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');

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

  const addCart = () => {
    const newId = (carts.length + 1).toString();
    setCarts([...carts, { id: newId, name: `Customer ${newId}`, items: [] }]);
    setActiveCartId(newId);
  };

  const deleteCart = (id: string) => {
    if (carts.length === 1) return;
    const newCarts = carts.filter(c => c.id !== id);
    setCarts(newCarts);
    setActiveCartId(newCarts[0].id);
  };

  const handleCheckout = (method: PaymentMethod) => {
    if (activeCart.items.length === 0) return;

    const total = activeCart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    placeOrder({
      customerName: activeCart.name,
      customerPhone: 'In-Store',
      items: activeCart.items,
      total,
      status: method === 'Cash' ? 'Completed' : 'Payment Submitted',
      paymentMethod: method,
      source: 'POS'
    });

    toast({
      title: "Order Placed",
      description: `Order for ${activeCart.name} completed via ${method}.`,
    });

    // Reset current cart
    setCarts(prev => prev.map(c => c.id === activeCartId ? { ...c, items: [] } : c));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = activeCart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">POS System</h1>
        <Button variant="outline" size="sm" onClick={addCart} className="gap-2">
          <Plus className="w-4 h-4" /> New Cart
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {carts.map(cart => (
          <Button
            key={cart.id}
            variant={activeCartId === cart.id ? "default" : "outline"}
            className="flex-shrink-0 gap-2 h-12"
            onClick={() => setActiveCartId(cart.id)}
          >
            <User className="w-4 h-4" />
            <span className="max-w-[100px] truncate">{cart.name}</span>
            {cart.items.length > 0 && (
              <Badge variant="secondary" className="ml-1">{cart.items.length}</Badge>
            )}
            {carts.length > 1 && (
              <Trash2 className="w-3 h-3 text-destructive ml-2 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteCart(cart.id); }} />
            )}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products or categories..."
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
                  "cursor-pointer hover:border-primary transition-all overflow-hidden h-full flex flex-col",
                  product.stock <= 0 && "opacity-60 grayscale"
                )}
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square bg-muted relative">
                  <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold uppercase">
                      Sold Out
                    </div>
                  )}
                </div>
                <CardContent className="p-3 flex-grow">
                  <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                  <p className="font-semibold text-sm line-clamp-2 leading-tight h-8 mb-1">{product.name}</p>
                  <p className="text-primary font-bold">${product.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Current Cart */}
        <div className="lg:col-span-5">
          <Card className="sticky top-6 flex flex-col h-[calc(100vh-280px)] md:h-[calc(100vh-140px)]">
            <CardHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  {activeCart.name}
                </CardTitle>
                <Badge variant="outline">{activeCart.items.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-grow">
              {activeCart.items.length > 0 ? (
                <div className="divide-y">
                  {activeCart.items.map(item => (
                    <div key={item.productId} className="p-4 flex gap-3">
                      <div className="flex-grow">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.price}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 bg-muted rounded-md p-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.productId, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-4 text-center">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.productId, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.productId)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Cart is empty</p>
                  <p className="text-xs text-muted-foreground">Select products from the left to begin.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 border-t flex flex-col gap-4 bg-muted/20">
              <div className="w-full flex justify-between items-center">
                <span className="text-sm font-medium">Total Payable</span>
                <span className="text-2xl font-bold text-primary">${cartTotal}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button 
                  className="h-14 bg-green-600 hover:bg-green-700" 
                  disabled={activeCart.items.length === 0}
                  onClick={() => handleCheckout('Cash')}
                >
                  Pay Cash
                </Button>
                <Button 
                  className="h-14 h-14 bg-primary" 
                  disabled={activeCart.items.length === 0}
                  onClick={() => handleCheckout('Bank Transfer')}
                >
                  Bank Transfer
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
