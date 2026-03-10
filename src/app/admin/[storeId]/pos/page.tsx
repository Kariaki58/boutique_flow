
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
import { useParams } from 'next/navigation';
import { Product, OrderItem, PaymentMethod, ProductVariant } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn, formatNaira } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [variantPicker, setVariantPicker] = useState<{
    open: boolean;
    product: Product | null;
    selectedVariantId: string | null;
  }>({ open: false, product: null, selectedVariantId: null });

  if (!store) return <p>Loading...</p>;

  const activeCart = carts.find(c => c.id === activeCartId) || carts[0];

  const addCart = () => {
    const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const nextNumber = carts.length + 1;
    setCarts(prev => [...prev, { id: newId, name: `Customer ${nextNumber}`, items: [] }]);
    setActiveCartId(newId);
  };

  const deleteCart = (id: string) => {
    if (carts.length === 1) return;
    setCarts(prev => {
      const next = prev.filter(c => c.id !== id);
      if (activeCartId === id) {
        setActiveCartId(next[0]?.id ?? '1');
      }
      return next;
    });
  };

  const updateCartName = (id: string, name: string) => {
    setCarts(prev => prev.map(c => (c.id === id ? { ...c, name } : c)));
  };

  const addToCart = (product: Product, variant: ProductVariant) => {
    if (variant.stock <= 0) {
      toast({ title: "Out of stock", variant: "destructive" });
      return;
    }

    setCarts(prev => prev.map(cart => {
      if (cart.id === activeCartId) {
        const existingItem = cart.items.find(i => i.productId === product.id && i.variantId === variant.id);
        if (existingItem) {
          return {
            ...cart,
            items: cart.items.map(i => (i.productId === product.id && i.variantId === variant.id)
              ? { ...i, quantity: Math.min(variant.stock, i.quantity + 1) }
              : i
            )
          };
        }
        return {
          ...cart,
          items: [...cart.items, {
            productId: product.id,
            variantId: variant.id,
            variantColor: variant.color,
            variantSize: variant.size,
            name: product.name,
            price: product.price,
            quantity: 1
          }]
        };
      }
      return cart;
    }));
  };

  const removeFromCart = (productId: string, variantId: string) => {
    setCarts(prev => prev.map(cart => {
      if (cart.id === activeCartId) {
        return {
          ...cart,
          items: cart.items.filter(i => !(i.productId === productId && i.variantId === variantId))
        };
      }
      return cart;
    }));
  };

  const updateQuantity = (productId: string, variantId: string, delta: number) => {
    setCarts(prev => prev.map(cart => {
      if (cart.id === activeCartId) {
        return {
          ...cart,
          items: cart.items.map(i => {
            if (i.productId === productId && i.variantId === variantId) {
              const product = store.products.find(p => p.id === productId);
              const variant = product?.variants.find(v => v.id === variantId);
              const maxQty = variant?.stock ?? 0;
              const newQty = Math.max(1, Math.min(maxQty, i.quantity + delta));
              return { ...i, quantity: newQty };
            }
            return i;
          })
        };
      }
      return cart;
    }));
  };

  const handleProductPress = (product: Product) => {
    const available = product.variants.filter(v => v.stock > 0);
    if (available.length <= 1) {
      const v = available[0] ?? product.variants[0];
      if (v) addToCart(product, v);
      return;
    }
    setVariantPicker({
      open: true,
      product,
      selectedVariantId: available[0]?.id ?? product.variants[0]?.id ?? null,
    });
  };

  const handleCheckout = async (method: PaymentMethod) => {
    if (activeCart.items.length === 0) return;

    // Validate stock at checkout time (multiple carts can compete for the same inventory)
    const insufficient = activeCart.items.find(item => {
      const product = store.products.find(p => p.id === item.productId);
      if (!product) return true;
      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) return true;
      return item.quantity > variant.stock;
    });
    if (insufficient) {
      const productName =
        store.products.find(p => p.id === insufficient.productId)?.name ?? "Some item";
      toast({
        title: "Not enough stock",
        description: `${productName} doesn't have enough stock for this cart. Please adjust quantities.`,
        variant: "destructive",
      });
      return;
    }

    const total = activeCart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    setIsCheckingOut(true);
    try {
      await placeOrder(storeId, {
        customerName: activeCart.name,
        customerPhone: 'In-Store',
        items: activeCart.items,
        total,
        status: method === 'Cash' ? 'Completed' : 'Payment Submitted',
        paymentMethod: method,
        source: 'POS',
        deliveryMethod: 'Pickup'
      });

      toast({ title: "Order Placed", description: `Order for ${activeCart.name} completed.` });

      // Close the customer cart automatically after checkout
      const remaining = carts.filter(c => c.id !== activeCartId);
      if (remaining.length === 0) {
        const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setCarts([{ id: newId, name: 'Customer 1', items: [] }]);
        setActiveCartId(newId);
      } else {
        setCarts(remaining);
        setActiveCartId(remaining[0].id);
      }
    } catch (error) {
      toast({ title: "Checkout failed", variant: "destructive" });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const filteredProducts = store.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = activeCart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div className="flex flex-col gap-6">
      <Dialog
        open={variantPicker.open}
        onOpenChange={(open) => setVariantPicker(p => ({ ...p, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Variant</DialogTitle>
          </DialogHeader>
          {variantPicker.product ? (
            <div className="max-h-[60vh] overflow-y-auto px-1 space-y-4">
              <div className="text-sm">
                <div className="font-semibold">{variantPicker.product.name}</div>
                <div className="text-muted-foreground">{formatNaira(variantPicker.product.price)}</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Options</div>
                <div className="grid grid-cols-2 gap-2">
                  {variantPicker.product.variants.map(v => {
                    const selected = variantPicker.selectedVariantId === v.id;
                    const disabled = v.stock <= 0;
                    return (
                      <Button
                        key={v.id}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        className={cn("justify-between h-auto py-2", disabled && "opacity-50")}
                        disabled={disabled}
                        onClick={() => setVariantPicker(p => ({ ...p, selectedVariantId: v.id }))}
                      >
                        <span className="truncate text-left">{v.color} / {v.size}</span>
                        <span className="text-[10px] opacity-70 ml-2">{v.stock}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              onClick={() => {
                const p = variantPicker.product;
                if (!p) return;
                const v = p.variants.find(x => x.id === variantPicker.selectedVariantId);
                if (v) addToCart(p, v);
                setVariantPicker({ open: false, product: null, selectedVariantId: null });
              }}
              disabled={!variantPicker.product || !variantPicker.selectedVariantId}
            >
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">POS System</h1>
          <p className="text-sm text-muted-foreground">Attend to multiple customers by switching carts.</p>
        </div>
        <Button variant="outline" size="sm" onClick={addCart} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> New Customer
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {carts.map(cart => {
          const isActive = cart.id === activeCartId;
          return (
            <Button
              key={cart.id}
              variant={isActive ? "default" : "outline"}
              className={cn("flex-shrink-0 gap-2 h-12", isActive && "shadow-sm")}
              onClick={() => setActiveCartId(cart.id)}
            >
              <User className="w-4 h-4" />
              <span className="max-w-[120px] truncate">{cart.name}</span>
              {cart.items.length > 0 && <Badge variant="secondary">{cart.items.length}</Badge>}
              {carts.length > 1 && (
                <Trash2
                  className="w-3.5 h-3.5 text-destructive ml-1 opacity-60 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); deleteCart(cart.id); }}
                />
              )}
            </Button>
          );
        })}
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
                  "cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col h-full",
                  product.stock <= 0 && "opacity-60 grayscale"
                )}
                onClick={() => handleProductPress(product)}
              >
                {/* Fixed aspect ratio container with object-cover to maintain proportions */}
                <div className="relative w-full pt-[100%] bg-muted">
                  <img 
                    src={product.images?.[0] ?? "https://picsum.photos/seed/product/600/800"} 
                    alt={product.name} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold uppercase">
                      Sold Out
                    </div>
                  )}
                </div>
                
                {/* Card content with fixed height */}
                <CardContent className="p-3 flex-1 flex flex-col justify-between gap-1 min-h-[100px]">
                  <div>
                    <p className="text-[10px] text-muted-foreground truncate">{product.category}</p>
                    <p className="font-semibold text-sm line-clamp-2 leading-tight">{product.name}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-primary font-bold">{formatNaira(product.price)}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{product.stock} left</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <Card className="sticky top-6 flex flex-col h-[calc(100vh-240px)] md:h-[calc(100vh-180px)]">
            <CardHeader className="p-4 border-b">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Current Order
                  </CardTitle>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Customer</span>
                    <Input
                      value={activeCart.name}
                      onChange={(e) => updateCartName(activeCart.id, e.target.value)}
                      className="h-8 max-w-[220px]"
                    />
                  </div>
                </div>
                <Badge variant="outline" className="mt-1">{activeCart.items.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-grow">
              {activeCart.items.length > 0 ? (
                <div className="divide-y">
                  {activeCart.items.map(item => {
                    const product = store.products.find(p => p.id === item.productId);
                    const variant = product?.variants.find(v => v.id === item.variantId);
                    const outOfStock = !product || !variant || variant.stock <= 0;
                    const maxQty = variant?.stock ?? 0;
                    const qtyTooHigh = variant ? item.quantity > variant.stock : true;
                    return (
                      <div key={`${item.productId}:${item.variantId}`} className="p-4 flex gap-3">
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">{item.variantColor}/{item.variantSize}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNaira(item.price)} × {item.quantity}
                            {qtyTooHigh && (
                              <span className="ml-2 inline-flex items-center gap-1 text-destructive">
                                <AlertCircle className="w-3 h-3" /> stock low
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.productId, item.variantId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            disabled={outOfStock || item.quantity >= maxQty}
                            onClick={() => updateQuantity(item.productId, item.variantId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeFromCart(item.productId, item.variantId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Cart is empty</p>
                  <p className="text-xs text-muted-foreground">Select products to start this customer’s order.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 border-t flex flex-col gap-4 bg-muted/20">
              <div className="w-full flex justify-between items-center font-bold">
                <span>Total</span>
                <span className="text-2xl text-primary">{formatNaira(cartTotal)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button className="h-12 bg-green-600 hover:bg-green-700" disabled={activeCart.items.length === 0 || isCheckingOut} onClick={() => handleCheckout('Cash')}>
                  {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Cash
                </Button>
                <Button className="h-12" disabled={activeCart.items.length === 0 || isCheckingOut} onClick={() => handleCheckout('Bank Transfer')}>
                  {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Transfer
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
