"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/components/store-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageCircle, 
  CreditCard, 
  Check, 
  ChevronLeft,
  Loader2,
  Copy,
  Truck,
  Store,
  ShoppingBag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn, formatNaira } from '@/lib/utils';

export default function CheckoutPage() {
  const { storeId } = useParams() as { storeId: string };
  const { getStore, placeOrder, loadPublicStore, cart, clearCart } = useStore();
  const store = getStore(storeId);
  const [loading, setLoading] = useState(!store);

  useEffect(() => {
    if (!store) {
      setLoading(true);
      loadPublicStore(storeId).finally(() => setLoading(false));
    }
  }, [storeId, !!store]);

  const { toast } = useToast();
  const router = useRouter();
  
  const [step, setStep] = useState<'checkout' | 'success'>('checkout');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash'>('Bank Transfer');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'Pickup' | 'Delivery'>('Pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [finalTotal, setFinalTotal] = useState<number>(0);

  const settings = store?.settings;
  const currentCartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Loading checkout…</p>
      </div>
    );
  }

  if (!store || cart.length === 0) {
    if (step !== 'success') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground mb-6 text-center">Your cart is empty or store not found</p>
          <Link href={`/s/${storeId}`}>
            <Button className="rounded-xl px-8 h-12 font-bold">Return to Store</Button>
          </Link>
        </div>
      );
    }
  }

  const handlePlaceOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast({ title: "Details required", description: "Please enter your name and phone number.", variant: "destructive" });
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderNum = await placeOrder(storeId, {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          variantColor: item.color || "",
          variantSize: item.size || "",
          name: item.name,
          price: item.price,
          buyingPrice: item.buyingPrice,
          quantity: item.quantity
        })),
        total: currentCartTotal,
        status: paymentMethod === 'Bank Transfer' ? 'Pending Payment' : 'Confirmed',
        paymentMethod: paymentMethod,
        source: 'Storefront',
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'Delivery' ? deliveryAddress : undefined
      });

      setFinalTotal(currentCartTotal);
      setOrderNumber(orderNum);
      setStep('success');
      clearCart();
    } catch (error) {
      toast({ title: "Order failed", description: "Something went wrong while placing your order.", variant: "destructive" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const primaryColor = settings?.primaryColor || '#7C2D12';
  const brandingStyles = `
    :root {
      --primary: ${primaryColor};
      --primary-foreground: 0 0% 100%;
    }
    .text-primary { color: ${primaryColor} !important; }
    .bg-primary { background-color: ${primaryColor} !important; }
    .border-primary { border-color: ${primaryColor} !important; }
  `;

  if (step === 'success') {
    const handleConfirmPayment = () => {
      const text = `Hello ${settings!.name}, I've just made the payment for my order ${orderNumber}. Total: ${formatNaira(finalTotal)}. Attached is my proof of payment.`;
      const url = `https://wa.me/${settings!.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    };

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-6">
        <style dangerouslySetInnerHTML={{ __html: brandingStyles }} />
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
          <Check className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-primary">Order Received!</h2>
          <p className="text-muted-foreground mt-2 font-medium">Thank you for shopping with {settings!.name}.</p>
        </div>
        {paymentMethod === 'Bank Transfer' ? (
          <Card className="w-full max-w-sm border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
            <CardHeader className="bg-primary text-white py-5">
              <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-center">Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6 text-left bg-[#FDFCFD]">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-muted pb-3">
                  <span className="text-muted-foreground font-medium">Bank:</span>
                  <span className="font-bold text-primary">{settings!.bankName}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-muted pb-3">
                  <span className="text-muted-foreground font-medium">Name:</span>
                  <span className="font-bold text-primary">{settings!.accountName}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-muted pb-3">
                  <span className="text-muted-foreground font-medium">Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-primary text-xl tracking-tight">{settings!.accountNumber}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-full" onClick={() => {
                        navigator.clipboard.writeText(settings!.accountNumber);
                        toast({ title: "Copied" });
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Total:</span>
                <span className="font-black text-3xl text-primary">{formatNaira(finalTotal)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed text-center italic opacity-80">
                Please upload payment proof to our WhatsApp to confirm your order.
              </p>
              
              <Button 
                onClick={handleConfirmPayment}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-100 transition-all active:scale-95"
              >
                <MessageCircle className="w-6 h-6" />
                Confirm Payment on WhatsApp
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-sm border-none shadow-xl rounded-[2rem] p-8 bg-[#F9F4F7]">
             <p className="text-muted-foreground font-medium">Please prepare <b className="text-primary">{formatNaira(finalTotal)}</b> for cash on pickup/delivery.</p>
          </Card>
        )}
        <Button 
          variant="outline"
          onClick={() => router.push(`/s/${storeId}`)} 
          className="w-full max-w-xs h-14 border-2 border-primary text-primary font-black rounded-2xl hover:bg-primary/5 transition-all"
        >
          Back to Store
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFD] p-4 max-w-lg mx-auto pb-20">
      <style dangerouslySetInnerHTML={{ __html: brandingStyles }} />
      <header className="flex items-center gap-4 mb-8 pt-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-primary/5">
          <ChevronLeft className="w-6 h-6 text-primary" />
        </Button>
        <h1 className="text-2xl font-black tracking-tight text-primary">Checkout</h1>
      </header>

      <div className="space-y-6">
        <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden">
          <CardHeader className="p-6 bg-primary/5">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.variantId} className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold line-clamp-1">{item.quantity}x {item.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {[item.color, item.size].filter(Boolean).join(' / ')}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-primary">{formatNaira(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t flex justify-between items-center">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total</span>
              <span className="text-2xl font-black text-primary">{formatNaira(currentCartTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden">
          <CardHeader className="p-6 bg-primary/5 text-primary">
            <CardTitle className="text-xs font-black uppercase tracking-widest">Your Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="custName" className="font-bold text-[10px] uppercase tracking-widest px-1 text-muted-foreground">Full Name</Label>
              <Input 
                id="custName" 
                value={customerInfo.name} 
                onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))} 
                placeholder="Enter your name"
                className="h-12 rounded-xl border-none bg-muted/30 px-4 focus-visible:ring-primary shadow-inner"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="custPhone" className="font-bold text-[10px] uppercase tracking-widest px-1 text-muted-foreground">Phone Number</Label>
              <Input 
                id="custPhone" 
                value={customerInfo.phone} 
                onChange={e => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} 
                placeholder="+234 123 456 7890"
                className="h-12 rounded-xl border-none bg-muted/30 px-4 focus-visible:ring-primary shadow-inner"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden">
          <CardHeader className="p-6 bg-primary/5 text-primary">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Delivery Method</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button"
                variant={deliveryMethod === 'Pickup' ? 'default' : 'outline'}
                onClick={() => setDeliveryMethod('Pickup')}
                className={cn(
                  "h-20 flex flex-col items-center justify-center gap-2 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest",
                  deliveryMethod === 'Pickup' ? "bg-primary text-white shadow-lg scale-[1.02]" : "hover:border-primary/50"
                )}
              >
                <Store className="w-6 h-6 mb-0.5" />
                Pickup
              </Button>
              <Button 
                type="button"
                variant={deliveryMethod === 'Delivery' ? 'default' : 'outline'}
                onClick={() => setDeliveryMethod('Delivery')}
                className={cn(
                  "h-20 flex flex-col items-center justify-center gap-2 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest",
                  deliveryMethod === 'Delivery' ? "bg-primary text-white shadow-lg scale-[1.02]" : "hover:border-primary/50"
                )}
              >
                <Truck className="w-6 h-6 mb-0.5" />
                Delivery
              </Button>
            </div>

            {deliveryMethod === 'Delivery' && (
              <div className="grid gap-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="deliveryAddr" className="font-bold text-[10px] uppercase tracking-widest px-1 text-muted-foreground">Store Address</Label>
                <Input 
                  id="deliveryAddr" 
                  value={deliveryAddress} 
                  onChange={e => setDeliveryAddress(e.target.value)} 
                  placeholder="Enter your full home address"
                  className="h-12 rounded-xl border-none bg-muted/30 px-4 focus-visible:ring-primary shadow-inner"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden">
          <CardHeader className="p-6 bg-primary/5 text-primary">
            <CardTitle className="text-xs font-black uppercase tracking-widest">Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-2 gap-3">
            <Button 
                variant={paymentMethod === 'Bank Transfer' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('Bank Transfer')}
                className={cn(
                  "h-16 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest",
                  paymentMethod === 'Bank Transfer' ? "bg-primary text-white shadow-lg" : "hover:border-primary/50"
                )}
              >
                <CreditCard className="w-5 h-5" />
                Bank Transfer
              </Button>
              <Button 
                variant={paymentMethod === 'Cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('Cash')}
                className={cn(
                  "h-16 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest",
                  paymentMethod === 'Cash' ? "bg-primary text-white shadow-lg" : "hover:border-primary/50"
                )}
              >
                <CreditCard className="w-5 h-5" />
                {deliveryMethod === 'Pickup' ? 'Cash on Pickup' : 'Cash on Delivery'}
              </Button>
          </CardContent>
        </Card>

        <Button 
          className="w-full h-16 text-xl font-black rounded-[2rem] shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50" 
          onClick={handlePlaceOrder} 
          disabled={isPlacingOrder}
        >
          {isPlacingOrder ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null} 
          <span className="uppercase tracking-widest">Place Order</span>
        </Button>
      </div>
    </div>
  );
}
