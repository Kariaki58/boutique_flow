
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ArrowRight, Store, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMyStores, createStore as createStoreAction } from '@/lib/actions/stores';
import { getUser } from '@/lib/actions/auth';
import { BoutiqueStore } from '@/lib/types';

export default function SaaSLandingPage() {
  const [stores, setStores] = useState<BoutiqueStore[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessingAutoCreate, setIsProcessingAutoCreate] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCreateProgrammatically = async (name: string, currentUser: any) => {
    if (!name.trim() || !currentUser || isProcessingAutoCreate) return;
    
    setIsProcessingAutoCreate(true);
    setCreating(true);
    setError(null);
    try {
      const { storeId, checkoutUrl } = await createStoreAction(name);
      sessionStorage.removeItem('pendingBoutiqueName');
      // Redirect to Paystack checkout
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Failed to create store:", error);
      setError(error?.message || 'Failed to create boutique. Please try again.');
      setCreating(false);
      setIsProcessingAutoCreate(false);
      // Clear the name from sessionStorage on error so user can retry
      sessionStorage.removeItem('pendingBoutiqueName');
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [currentUser, myStores] = await Promise.all([
          getUser(),
          getMyStores()
        ]);
        setUser(currentUser);
        setStores(myStores);
        
        // Check if there's a boutique name to create from URL or sessionStorage
        const createParam = searchParams.get('create');
        const storedName = sessionStorage.getItem('pendingBoutiqueName');
        const nameToUse = createParam || storedName;
        
        if (nameToUse && currentUser && !isProcessingAutoCreate) {
          // User is logged in and has a boutique name to create
          setNewStoreName(nameToUse);
          // Check if this boutique name already exists before auto-creating
          const nameExists = myStores.some(store => 
            store.settings.name.toLowerCase().trim() === nameToUse.toLowerCase().trim()
          );
          
          if (nameExists) {
            setError(`You already have a boutique named "${nameToUse}". Please choose a different name.`);
            sessionStorage.removeItem('pendingBoutiqueName');
            setNewStoreName('');
          } else {
            // Auto-submit after a brief delay to show the form
            setTimeout(() => {
              handleCreateProgrammatically(nameToUse, currentUser);
            }, 500);
          }
        } else if (nameToUse) {
          // User not logged in but has boutique name
          setNewStoreName(nameToUse);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || creating || isProcessingAutoCreate) return;
    
    setError(null);
    
    if (!user) {
      // Save boutique name to sessionStorage so we can restore it after login/signup
      sessionStorage.setItem('pendingBoutiqueName', newStoreName.trim());
      router.push('/auth/login?mode=signup');
      return;
    }

    // Check if user already has a boutique with this name (client-side check)
    const nameExists = stores.some(store => 
      store.settings.name.toLowerCase().trim() === newStoreName.toLowerCase().trim()
    );
    
    if (nameExists) {
      setError(`You already have a boutique named "${newStoreName.trim()}". Please choose a different name.`);
      return;
    }

    setCreating(true);
    try {
      const { storeId, checkoutUrl } = await createStoreAction(newStoreName.trim());
      sessionStorage.removeItem('pendingBoutiqueName');
      // Redirect to Paystack checkout
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Failed to create store:", error);
      setError(error?.message || 'Failed to create boutique. Please try again.');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F4F7]">
      <header className="px-6 py-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <ShoppingBag className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-primary">Boutique Flow</h1>
        </div>
        <div className="flex gap-4">
          {user ? (
            <Link href="#my-boutiques">
              <Button variant="ghost">My Boutiques</Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
          The all-in-one POS & Storefront for Fashion
        </Badge>
        <h2 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
          Launch your boutique <br /> 
          <span className="text-primary italic">in minutes.</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Manage inventory, process sales in-store, and take orders online with a beautiful storefront tailored for fashion.
        </p>

        {/* Step indicator */}
        {!user && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</div>
              <span className="text-sm font-medium text-muted-foreground">Create Account</span>
            </div>
            <div className="w-8 h-0.5 bg-muted" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">2</div>
              <span className="text-sm font-medium text-muted-foreground">Confirm Email</span>
            </div>
            <div className="w-8 h-0.5 bg-muted" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">3</div>
              <span className="text-sm font-medium text-muted-foreground">Activate Store</span>
            </div>
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-3 max-w-lg mx-auto mb-20">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input 
              placeholder="Your boutique name..." 
              className="h-14 text-lg px-6 rounded-2xl border-2"
              value={newStoreName}
              onChange={(e) => {
                setNewStoreName(e.target.value);
                setError(null); // Clear error when user types
              }}
              disabled={creating}
            />
            <Button type="submit" className="h-14 px-8 text-lg font-bold rounded-2xl gap-2" disabled={creating}>
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Get Started"} <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg text-left">
              <p className="font-medium">{error}</p>
            </div>
          )}
        </form>

        {!user && (
          <p className="text-sm text-muted-foreground mb-20 max-w-lg mx-auto">
            <strong>Step 1:</strong> Enter your boutique name above. You'll create your account next, then confirm your email, and finally activate your store with a one-time payment of ₦2,500.
          </p>
        )}

        {user && (
          <section id="my-boutiques" className="space-y-8">
            <div className="flex items-center gap-2 justify-center text-muted-foreground uppercase tracking-widest text-sm font-semibold">
              <Store className="w-4 h-4" /> Your active boutiques
            </div>
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {stores.map(store => (
                  <Card key={store.settings.id} className="text-left group hover:border-primary transition-colors cursor-pointer" onClick={() => router.push(`/admin/${store.settings.id}`)}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {store.settings.logo ? (
                          <img src={store.settings.logo} alt={store.settings.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle>{store.settings.name}</CardTitle>
                        <CardDescription>{store.products.length} Products</CardDescription>
                      </div>
                      <ArrowRight className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                  </Card>
                ))}
                <Card className="border-dashed border-2 flex flex-col items-center justify-center p-8 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => {
                  setNewStoreName('New Boutique');
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}>
                   <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                   <p className="text-sm font-medium text-muted-foreground">Create another boutique</p>
                </Card>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="py-20 text-center border-t border-muted bg-white mt-20">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Boutique Flow. Built for independent creators.</p>
      </footer>
    </div>
  );
}
