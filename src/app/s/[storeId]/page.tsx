
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ShoppingBag, 
  ArrowRight,
  Heart
} from 'lucide-react';
import Link from 'next/link';

export default function PublicStorefront() {
  const { storeId } = useParams() as { storeId: string };
  const { getStore } = useStore();
  const store = getStore(storeId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Store not found</p>
        <Link href="/">
          <Button>Back to Boutique Flow</Button>
        </Link>
      </div>
    );
  }

  const { products, settings } = store;
  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F9F4F7]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {settings.name[0]}
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">{settings.name}</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Fashion Boutique</p>
            </div>
          </div>
          <Link href={`/admin/${storeId}`}>
            <Button variant="ghost" size="icon" className="text-primary">
              <ShoppingBag className="w-6 h-6" />
            </Button>
          </Link>
        </div>
      </header>

      <section className="bg-primary text-white p-8 mb-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl font-bold mb-2">Summer Collection 2024</h2>
          <p className="text-white/80 mb-6 text-sm max-w-xs">{settings.description}</p>
          <Button variant="secondary" className="font-semibold">Explore New Arrivals</Button>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <img src="https://picsum.photos/seed/fashion-hero/600/400" alt="Fashion" className="object-cover w-full h-full" />
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-24">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="What are you looking for?" 
              className="pl-9 h-12 bg-white border-none shadow-sm rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <Badge
                key={cat}
                variant={activeCategory === cat ? "default" : "secondary"}
                className="cursor-pointer px-4 py-1.5 whitespace-nowrap"
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <Link href={`/s/${storeId}/p/${product.id}`} key={product.id}>
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden flex flex-col rounded-2xl group">
                <div className="aspect-[3/4] overflow-hidden relative">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  />
                  <div className="absolute top-2 right-2">
                    <Button size="icon" variant="secondary" className="rounded-full w-8 h-8 opacity-90">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                  {product.status === 'Out of Stock' && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <Badge variant="destructive" className="uppercase font-bold tracking-widest">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3 flex-grow bg-white">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">{product.category}</p>
                  <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary font-bold">${product.price}</span>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-muted-foreground">
        <p className="text-xs">© 2024 {settings.name} • Powered by Boutique Flow</p>
      </footer>
    </div>
  );
}
