
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
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
  Package,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateProductDescription } from '@/ai/flows/ai-product-description-generator';
import { Badge } from '@/components/ui/badge';

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
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
      toast({ title: "AI Error", description: "Failed to generate description", variant: "destructive" });
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
      updateProduct(isEditing, data);
      toast({ title: "Product updated" });
      setIsEditing(null);
    } else {
      addProduct(data);
      toast({ title: "Product added" });
      setIsAdding(false);
    }

    setFormData({ name: '', description: '', price: '', stock: '', category: '', image: 'https://picsum.photos/seed/new/600/800' });
  };

  const handleEdit = (p: Product) => {
    setFormData({
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      stock: p.stock.toString(),
      category: p.category,
      image: p.image
    });
    setIsEditing(p.id);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your products and stock levels</p>
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Silk Summer Dress" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Dresses" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" type="number" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="desc">Description</Label>
                  <Button variant="ghost" size="sm" onClick={handleAiDescription} disabled={loadingAi} className="h-7 text-[10px] gap-1 text-primary">
                    <Sparkles className="w-3 h-3" /> AI Generate
                  </Button>
                </div>
                <Textarea id="desc" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Describe your product..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          placeholder="Search inventory..." 
          className="pl-9 h-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredProducts.map(product => (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-0 flex h-24">
              <div className="w-24 bg-muted">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase">{product.category}</p>
                  </div>
                  <p className="font-bold text-sm text-primary">${product.price}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={product.stock <= 3 ? "destructive" : "secondary"} className="text-[10px]">
                      {product.stock} in stock
                    </Badge>
                    {product.stock <= 3 && <AlertCircle className="w-3 h-3 text-destructive" />}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(product)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(product.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed border-muted">
            <Package className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-2" />
            <p className="text-muted-foreground font-medium">No products found</p>
            <Button variant="link" onClick={() => setIsAdding(true)}>Add your first product</Button>
          </div>
        )}
      </div>
    </div>
  );
}
