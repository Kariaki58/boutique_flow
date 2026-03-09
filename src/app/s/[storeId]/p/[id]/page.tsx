
"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/components/store-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageCircle, 
  Plus, 
  Minus, 
  CreditCard, 
  Check, 
  Share2, 
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { storeId, id } = useParams() as { storeId: string, id: string };
  const { getStore, placeOrder } = useStore();
  const store = getStore(storeId);
  const { toast } = useToast();
  const router = useRouter();
  
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<'details' | 'checkout' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash'>('Bank Transfer');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });

  if (!store) return <p>Store not found</p>;

  const product = store.products.find(p => p.id === id);
  const { settings } = store;

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Link href={`/s/${storeId}`}>
          <Button>Return to Store</Button>
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast({ title: "Details required", description: "Please enter your name and phone number.", variant: "destructive" });
      return;
    }

    placeOrder(storeId, {
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      items: [{ productId: product.id, name: product.name, price: product.price, quantity }],
      total: product.price * quantity,
      status: paymentMethod === 'Bank Transfer' ? 'Pending Payment' : 'Confirmed',
      paymentMethod: paymentMethod,
      source: 'Storefront'
    });

    setStep('success');
  };

  const handleWhatsAppOrder = () => {
    const text = `Hello ${settings.name}, I'm interested in the ${product.name} (Qty: ${quantity}). Total: $${product.price * quantity}. Product link: ${window.location.href}`;
    const url = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied", description: "Share this product with your friends!" });
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Order Received!</h2>
          <p className="text-muted-foreground mt-2">Thank you for shopping with {settings.name}.</p>
        </div>
        {paymentMethod === 'Bank Transfer' && (
          <Card className="w-full max-w-sm">
            <CardHeader className="bg-primary text-white py-4 rounded-t-lg">
              <CardTitle className="text-sm">Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-left">
              <div className="grid grid-cols-2 text-sm">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-semibold">{settings.bankName}</span>
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold">{settings.accountName}</span>
                <span className="text-muted-foreground">Number:</span>
                <span className="font-semibold">{settings.accountNumber}</span>
                <span className="text-muted-foreground mt-2 border-t pt-2">Total:</span>
                <span className="font-bold text-primary mt-2 border-t pt-2">${product.price * quantity}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-4">Please upload payment proof to our WhatsApp to confirm your order.</p>
            </CardContent>
          </Card>
        )}
        <Button onClick={() => router.push(`/s/${storeId}`)} className="w-full max-w-xs">Back to Home</Button>
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-[#F9F4F7] p-4 max-w-md mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setStep('details')}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Checkout</h1>
        </header>

        <div className="space-y-6">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{quantity}x {product.name}</span>
                <span className="font-bold">${product.price * quantity}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm">Your Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="custName">Full Name</Label>
                <Input 
                  id="custName" 
                  value={customerInfo.name} 
                  onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))} 
                  placeholder="Enter your name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="custPhone">Phone Number</Label>
                <Input 
                  id="custPhone" 
                  value={customerInfo.phone} 
                  onChange={e => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} 
                  placeholder="+1 (234) 567-890"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-2 gap-3">
              <Button 
                variant={paymentMethod === 'Bank Transfer' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('Bank Transfer')}
                className="h-12 flex flex-col items-center gap-0.5"
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-[10px]">Bank Transfer</span>
              </Button>
              <Button 
                variant={paymentMethod === 'Cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('Cash')}
                className="h-12 flex flex-col items-center gap-0.5"
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-[10px]">Cash on Pickup</span>
              </Button>
            </CardContent>
          </Card>

          <Button className="w-full h-14 text-lg font-bold" onClick={handlePlaceOrder}>
            Place Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 flex items-center justify-between">
        <Link href={`/s/${storeId}`}>
          <Button variant="secondary" size="icon" className="rounded-full shadow-md bg-white/90">
            <ChevronLeft className="w-6 h-6 text-primary" />
          </Button>
        </Link>
        <Button variant="secondary" size="icon" onClick={copyLink} className="rounded-full shadow-md bg-white/90">
          <Share2 className="w-5 h-5 text-primary" />
        </Button>
      </header>

      <div className="max-w-md mx-auto pb-24">
        <div className="aspect-[3/4] bg-muted w-full">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="p-6 space-y-6 -mt-6 bg-white rounded-t-3xl relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
          <div>
            <div className="flex justify-between items-start mb-2">
              <Badge variant="secondary" className="uppercase tracking-widest text-[10px]">{product.category}</Badge>
              <span className="text-2xl font-bold text-primary">${product.price}</span>
            </div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between py-4 border-y">
            <span className="font-semibold">Quantity</span>
            <div className="flex items-center gap-4 bg-muted p-1 rounded-full px-2">
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-bold w-4 text-center">{quantity}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              className="w-full h-14 text-lg font-bold rounded-2xl" 
              onClick={() => setStep('checkout')}
              disabled={product.status === 'Out of Stock'}
            >
              Order Now
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-14 border-primary text-primary text-lg font-bold rounded-2xl gap-2"
              onClick={handleWhatsAppOrder}
            >
              <MessageCircle className="w-6 h-6" /> Order on WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
