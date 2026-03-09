
"use client";

import React, { useEffect, useMemo, useState } from 'react';
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
  ChevronLeft,
  Loader2,
  Copy,
  Truck,
  Store
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn, formatNaira } from '@/lib/utils';
import { ProductImageCarousel } from '@/components/products/product-image-carousel';

export default function ProductDetailPage() {
  const { storeId, id } = useParams() as { storeId: string, id: string };
  const { getStore, placeOrder, loadPublicStore } = useStore();
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
  
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<'details' | 'checkout' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash'>('Bank Transfer');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'Pickup' | 'Delivery'>('Pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const product = store?.products.find(p => p.id === id);
  const settings = store?.settings;

  useEffect(() => {
    if (product) {
      setSelectedVariantId(product.variants[0]?.id ?? null);
      setQuantity(1);
    }
  }, [product?.id]);

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    return product.variants.find(v => v.id === selectedVariantId) ?? product.variants[0];
  }, [product?.variants, selectedVariantId]);

  const selectedColor = selectedVariant?.color ?? "";
  const selectedSize = selectedVariant?.size ?? "";

  const allColors = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set(product.variants.map(v => v.color).filter(c => !!c)));
  }, [product?.variants]);

  const sizesForSelectedColor = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set(product.variants.filter(v => v.color === selectedColor).map(v => v.size).filter(s => !!s)));
  }, [product?.variants, selectedColor]);

  const variantsForSelectedColor = useMemo(() => {
    if (!product) return [];
    return product.variants.filter(v => v.color === selectedColor);
  }, [product?.variants, selectedColor]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Loading product details…</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Store not found</p>
        <Link href="/">
          <Button>Visit Boutique Flow</Button>
        </Link>
      </div>
    );
  }

  if (!product || !settings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Link href={`/s/${storeId}`}>
          <Button>Return to Store</Button>
        </Link>
      </div>
    );
  }

  const maxQty = selectedVariant?.stock ?? 0;
  
  const handlePlaceOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast({ title: "Details required", description: "Please enter your name and phone number.", variant: "destructive" });
      return;
    }
    if (!selectedVariant || selectedVariant.stock <= 0) {
      toast({ title: "Out of stock", description: "This variant is out of stock.", variant: "destructive" });
      return;
    }
    if (quantity > selectedVariant.stock) {
      toast({ title: "Not enough stock", description: "Please reduce quantity.", variant: "destructive" });
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderNum = await placeOrder(storeId, {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        items: [{
          productId: product.id,
          variantId: selectedVariant.id,
          variantColor: selectedVariant.color,
          variantSize: selectedVariant.size,
          name: product.name,
          price: product.price,
          quantity
        }],
        total: product.price * quantity,
        status: paymentMethod === 'Bank Transfer' ? 'Pending Payment' : 'Confirmed',
        paymentMethod: paymentMethod,
        source: 'Storefront',
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'Delivery' ? deliveryAddress : undefined
      });

      setOrderNumber(orderNum);
      setStep('success');
    } catch (error) {
      toast({ title: "Order failed", description: "Something went wrong while placing your order.", variant: "destructive" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const variantDesc = selectedVariant ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join('/') : "";
    const variantText = variantDesc ? ` (${variantDesc})` : "";
    const text = `Hello ${settings.name}, I'm interested in the ${product.name}${variantText} (Qty: ${quantity}). Total: ${formatNaira(product.price * quantity)}. Product link: ${window.location.href}`;
    const url = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied", description: "Share this product with your friends!" });
  };

  // Dynamic branding
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
      const text = `Hello ${settings.name}, I've just made the payment for my order ${orderNumber}. Total: ${formatNaira(product.price * quantity)}. Attached is my proof of payment.`;
      const url = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    };

    const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: `${label} copied` });
    };

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-6">
        <style dangerouslySetInnerHTML={{ __html: brandingStyles }} />
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-[#7C2D12]">Order Received!</h2>
          <p className="text-muted-foreground mt-2">Thank you for shopping with {settings.name}.</p>
        </div>
        {paymentMethod === 'Bank Transfer' ? (
          <Card className="w-full max-w-sm border-none shadow-xl overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-[#7C2D12] text-white py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5 text-left">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-dashed pb-2">
                  <span className="text-muted-foreground">Bank:</span>
                  <span className="font-bold text-[#7C2D12]">{settings.bankName}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-dashed pb-2">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-bold text-[#7C2D12]">{settings.accountName}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-dashed pb-2">
                  <span className="text-muted-foreground">Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#7C2D12] text-lg">{settings.accountNumber}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#7C2D12] hover:bg-[#7C2D12]/10" onClick={() => copyToClipboard(settings.accountNumber, "Account Number")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="font-black text-2xl text-[#7C2D12]">{formatNaira(product.price * quantity)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed text-center italic">
                Please upload payment proof to our WhatsApp to confirm your order.
              </p>
              
              <Button 
                onClick={handleConfirmPayment}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-200"
              >
                <MessageCircle className="w-5 h-5" />
                Proceed to Payment Verification
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-sm border-none shadow-lg rounded-[2rem] p-6">
             <p className="text-muted-foreground">Please prepare <b>{formatNaira(product.price * quantity)}</b> for cash on pickup/delivery.</p>
          </Card>
        )}
        <Button 
          variant="outline"
          onClick={() => router.push(`/s/${storeId}`)} 
          className="w-full max-w-xs h-14 border-2 border-[#7C2D12] text-[#7C2D12] font-black rounded-2xl hover:bg-[#7C2D12]/5"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-[#F9F4F7] p-4 max-w-md mx-auto">
        <style dangerouslySetInnerHTML={{ __html: brandingStyles }} />
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
                <span>
                  {quantity}x {product.name}
                  {selectedVariant && (selectedVariant.color || selectedVariant.size) ? (
                    <span className="text-muted-foreground"> • {[selectedVariant.color, selectedVariant.size].filter(Boolean).join('/')}</span>
                  ) : null}
                </span>
                <span className="font-bold">{formatNaira(product.price * quantity)}</span>
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
              <CardTitle className="text-sm">Delivery Method</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  type="button"
                  variant={deliveryMethod === 'Pickup' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('Pickup')}
                  className="h-16 flex flex-col items-center justify-center gap-1"
                >
                  <Store className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pickup</span>
                </Button>
                <Button 
                  type="button"
                  variant={deliveryMethod === 'Delivery' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('Delivery')}
                  className="h-16 flex flex-col items-center justify-center gap-1"
                >
                  <Truck className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Delivery</span>
                </Button>
              </div>

              {deliveryMethod === 'Delivery' && (
                <div className="grid gap-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="deliveryAddr">Store Address</Label>
                  <Input 
                    id="deliveryAddr" 
                    value={deliveryAddress} 
                    onChange={e => setDeliveryAddress(e.target.value)} 
                    placeholder="Enter your full home address"
                  />
                </div>
              )}
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

          <Button className="w-full h-14 text-lg font-bold" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
            {isPlacingOrder ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null} Place Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: brandingStyles }} />
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
        <ProductImageCarousel images={product.images} />

        <div className="p-6 space-y-6 -mt-6 bg-white rounded-t-3xl relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
          <div>
            <div className="flex justify-between items-start mb-2">
              <Badge variant="secondary" className="uppercase tracking-widest text-[10px]">{product.category}</Badge>
              <span className="text-2xl font-bold text-primary">{formatNaira(product.price)}</span>
            </div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Variant Selection */}
          <div className="space-y-6">
            {allColors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Select Color</span>
                  {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock < 10 && (
                    <Badge variant="outline" className="text-[10px] border-orange-200 bg-orange-50 text-orange-700 animate-pulse">
                      Only {selectedVariant.stock} left!
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {allColors.map(color => {
                    const isSelected = selectedColor === color;
                    const isAnyAvailable = product.variants.some(v => v.color === color && v.stock > 0);
                    
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          const firstAvailable = product.variants.find(v => v.color === color && v.stock > 0) ?? product.variants.find(v => v.color === color);
                          setSelectedVariantId(firstAvailable?.id ?? null);
                          setQuantity(1);
                        }}
                        className={cn(
                          "px-6 py-2.5 rounded-full text-sm font-semibold transition-all border-2",
                          isSelected 
                            ? "border-primary bg-primary text-white shadow-md scale-105" 
                            : "border-muted bg-white text-muted-foreground hover:border-primary/30 hover:bg-primary/5",
                          !isAnyAvailable && !isSelected && "opacity-40 grayscale"
                        )}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {allColors.length > 0 && (
              <div className="space-y-3">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Select Size</span>
                <div className="flex flex-wrap gap-3">
                  {sizesForSelectedColor.map(size => {
                    const variant = product.variants.find(v => v.color === selectedColor && v.size === size);
                    const isSelected = selectedSize === size;
                    const isOutOfStock = !variant || (variant.stock ?? 0) <= 0;
                    
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isOutOfStock && !isSelected}
                        onClick={() => {
                          setSelectedVariantId(variant?.id ?? null);
                          setQuantity(1);
                        }}
                        className={cn(
                          "min-w-[60px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 relative overflow-hidden",
                          isSelected 
                            ? "border-primary bg-primary text-white shadow-md" 
                            : "border-muted bg-white text-muted-foreground hover:border-primary/30 hover:bg-primary/5",
                          isOutOfStock && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {size}
                        {isOutOfStock && (
                          <div className="absolute inset-x-0 top-1/2 h-[2px] bg-muted-foreground/30 -rotate-12" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {allColors.length === 0 && (
              <div className="p-4 bg-muted/30 rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center text-center">
                <p className="text-sm text-muted-foreground font-medium">This product has no specific variants.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1 italic">Contact us for custom requests.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-4 border-y">
            <span className="font-semibold">Quantity</span>
            <div className="flex items-center gap-4 bg-muted p-1 rounded-full px-2">
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-bold w-4 text-center">{quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                disabled={maxQty > 0 ? quantity >= maxQty : true}
                onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              className="w-full h-14 text-lg font-bold rounded-2xl" 
              onClick={() => setStep('checkout')}
              disabled={!selectedVariant || selectedVariant.stock <= 0}
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
