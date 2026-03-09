
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
import { useParams } from 'next/navigation';
import { Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  Sparkles, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateProductDescription } from '@/ai/flows/ai-product-description-generator';
import { Badge } from '@/components/ui/badge';

export default function InventoryPage() {
  const { storeId } = useParams() as { storeId: string };
  const { getStore, addProduct, updateProduct, deleteProduct } = useStore();
  const store = getStore(storeId);
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: 'https://picsum.photos/seed/new/600/800'
  });

  if (!store) return <p>Loading...</p>;

  const handleAiDescription = async () => {
    if (!formData.name || !formData.category) {
      toast({ title: "Details needed", description: "Enter name and category first.", variant: "destructive" });
      return;
    }
    setLoadingAi(true);
    try {
      const result = await generateProductDescription({
        productName: formData.name,
        category: formData.category,
        attributes: formData.description || "fashionable, elegant",
        tone: "elegant"
      });
      setFormData(prev => ({ ...prev, description: result.description }));
    } catch (error) {
      toast({ title: "AI Error", variant: "destructive" });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSave = () => {
    const data = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category: formData.category,
      image: formData.image
    };

    if (isEditing) {
      updateProduct(storeId, isEditing, data);
      setIsEditing(null);
    } else {
      addProduct(storeId, data);
      setIsAdding(false);
    }
    setFormData({ name: '', description: '', price: '', stock: '', category: '', image: 'https://picsum.photos/seed/new/600/800' });
  };

  const filteredProducts = store.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your products</p>
        </div>
        <Dialog open={isAdding || !!isEditing} onOpenChange={(open) => {
          if (!open) {
            setIsAdding(false);
            setIsEditing(null);
            setFormData({ name: '', description: '', price: '', stock: '', category: '', image: 'https://picsum.photos/seed/new/600/800' });
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Product Details</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Category" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} />
                <Input type="number" placeholder="Price" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                   <Label className="text-xs">Description</Label>
                   <Button variant="ghost" size="sm" onClick={handleAiDescription} disabled={loadingAi} className="h-6 text-[10px]"><Sparkles className="w-3 h-3 mr-1" /> AI</Button>
                </div>
                <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
              </div>
              <Input type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))} />
            </div>
            <DialogFooter><Button onClick={handleSave}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder="Search inventory..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filteredProducts.map(product => (
          <Card key={product.id}>
            <CardContent className="p-3 flex items-center gap-4">
              <div className="w-16 h-16 rounded overflow-hidden">
                <img src={product.image} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground uppercase">{product.category}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">${product.price}</p>
                <Badge variant={product.stock <= 3 ? "destructive" : "secondary"}>{product.stock} units</Badge>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => {
                   setFormData({
                     name: product.name,
                     description: product.description,
                     price: product.price.toString(),
                     stock: product.stock.toString(),
                     category: product.category,
                     image: product.image
                   });
                   setIsEditing(product.id);
                }}><Edit2 className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteProduct(storeId, product.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
