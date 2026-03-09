"use client";

import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useStore } from '@/components/store-context';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';

export function CartSlider({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { cart, removeFromCart, updateCartQuantity, clearCart } = useStore();
  const { storeId } = useParams() as { storeId: string };
  const router = useRouter();

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    onOpenChange(false);
    router.push(`/s/${storeId}/checkout`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Your Cart ({cart.length})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Your cart is empty</h3>
                <p className="text-sm text-muted-foreground">Add items to your cart to see them here.</p>
              </div>
              <Button onClick={() => onOpenChange(false)} variant="outline" className="rounded-xl font-bold">
                Start Shopping
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-full p-6">
              <div className="space-y-6">
                {cart.map((item) => (
                  <div key={item.variantId} className="flex gap-4 group">
                    <div className="w-20 h-24 bg-muted rounded-2xl overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-red-500"
                            onClick={() => removeFromCart(item.variantId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                          {[item.color, item.size].filter(Boolean).join(' / ')}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2 bg-muted p-0.5 rounded-lg">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-md"
                            onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-md"
                            onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="font-black text-sm text-primary">{formatNaira(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {cart.length > 0 && (
          <SheetFooter className="p-6 border-t flex-col sm:flex-col gap-4">
            <div className="flex justify-between items-center w-full">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="text-2xl font-black text-primary">{formatNaira(subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button 
                variant="outline" 
                className="h-14 font-bold rounded-2xl border-2"
                onClick={() => clearCart()}
              >
                Clear All
              </Button>
              <Button 
                className="h-14 font-bold rounded-2xl gap-2 shadow-lg shadow-primary/20"
                onClick={handleCheckout}
              >
                Checkout <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
