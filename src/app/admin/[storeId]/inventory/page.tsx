
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
import { useParams } from 'next/navigation';
import { ProductVariant } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatNaira } from '@/lib/utils';
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
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateProductDescription } from '@/ai/flows/ai-product-description-generator';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/ui/image-uploader';

type VariantDraft = {
  id: string;
  color: string;
  size: string;
  stock: string;
};

export default function InventoryPage() {
  const { storeId } = useParams() as { storeId: string };
  const { getStore, addProduct, updateProduct, deleteProduct } = useStore();
  const store = getStore(storeId);
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const newVariant = (): VariantDraft => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    color: "",
    size: "",
    stock: "",
  });

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    category: string;
    images: string[];
    variants: VariantDraft[];
  }>({
    name: '',
    description: '',
    price: '',
    category: '',
    images: [],
    variants: [newVariant()],
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

  const handleSave = async () => {
    const images = formData.images;

    const variants: ProductVariant[] = formData.variants.map((v, idx) => ({
      id: v.id || `v-${idx}`,
      color: (v.color || "").trim(),
      size: (v.size || "").trim(),
      stock: Number.isFinite(parseInt(v.stock)) ? Math.max(0, parseInt(v.stock)) : 0,
    }));

    const comboSet = new Set<string>();
    for (const v of variants) {
      const key = `${v.color}||${v.size}`.toLowerCase();
      if (comboSet.has(key)) {
        toast({ title: "Duplicate variant", description: "Each color/size combo must be unique.", variant: "destructive" });
        return;
      }
      comboSet.add(key);
    }

    const totalStock = variants.reduce((s, v) => s + v.stock, 0);

    const data = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      images: images.length ? images : ['https://picsum.photos/seed/new/600/800'],
      variants: variants.length ? variants : [{ id: "v-0", color: "", size: "", stock: 0 }],
      stock: totalStock,
    };

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateProduct(storeId, isEditing, data);
        setIsEditing(null);
        toast({ title: "Product updated" });
      } else {
        await addProduct(storeId, data);
        setIsAdding(false);
        toast({ title: "Product added" });
      }
      setFormData({ name: '', description: '', price: '', category: '', images: [], variants: [newVariant()] });
    } catch (error) {
      toast({ title: "Error saving product", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
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
            setFormData({ name: '', description: '', price: '', category: '', images: [], variants: [newVariant()] });
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Product Details</DialogTitle></DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto px-1 space-y-4 py-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold">Product Name</Label>
                  <Input placeholder="e.g. Vintage Silk Dress" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold">Category</Label>
                    <Input placeholder="Clothing" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold">Price (₦)</Label>
                    <Input type="number" placeholder="0.00" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Product Images</Label>
                  <ImageUploader 
                    value={formData.images} 
                    onUpload={(urls) => setFormData(p => ({ ...p, images: urls }))} 
                    maxImages={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold">Description</Label>
                    <Button variant="ghost" size="sm" onClick={handleAiDescription} disabled={loadingAi} className="h-6 text-[10px] bg-primary/5 hover:bg-primary/10 text-primary">
                      {loadingAi ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />} AI Generate
                    </Button>
                  </div>
                  <Textarea 
                    placeholder="Describe your product..."
                    value={formData.description} 
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} 
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-wider">Variants & Stock</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] border-primary/20 hover:bg-primary/5"
                      onClick={() => setFormData(p => ({ ...p, variants: [...p.variants, newVariant()] }))}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Variant
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.variants.map((v, idx) => (
                      <div key={v.id} className="p-3 rounded-lg border bg-muted/30 space-y-3">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-11 grid grid-cols-3 gap-2">
                            <Input
                              className="h-9 text-sm"
                              placeholder="Color"
                              value={v.color}
                              onChange={e => setFormData(p => ({
                                ...p,
                                variants: p.variants.map(x => x.id === v.id ? { ...x, color: e.target.value } : x)
                              }))}
                            />
                            <Input
                              className="h-9 text-sm"
                              placeholder="Size"
                              value={v.size}
                              onChange={e => setFormData(p => ({
                                ...p,
                                variants: p.variants.map(x => x.id === v.id ? { ...x, size: e.target.value } : x)
                              }))}
                            />
                            <Input
                              className="h-9 text-sm"
                              type="number"
                              placeholder="Stock"
                              value={v.stock}
                              onChange={e => setFormData(p => ({
                                ...p,
                                variants: p.variants.map(x => x.id === v.id ? { ...x, stock: e.target.value } : x)
                              }))}
                            />
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="col-span-1 h-8 w-8 text-destructive hover:bg-destructive/10"
                            disabled={formData.variants.length === 1}
                            onClick={() => setFormData(p => ({ ...p, variants: p.variants.filter(x => x.id !== v.id) }))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save</Button></DialogFooter>
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
                <img src={product.images?.[0] ?? "https://picsum.photos/seed/product/600/800"} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground uppercase">{product.category}</p>
                <p className="text-[10px] text-muted-foreground">{product.variants.length} variant{product.variants.length === 1 ? "" : "s"}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{formatNaira(product.price)}</p>
                <Badge variant={product.stock <= 3 ? "destructive" : "secondary"}>{product.stock} units</Badge>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => {
                   setFormData({
                     name: product.name,
                     description: product.description,
                     price: product.price.toString(),
                     category: product.category,
                     images: product.images ?? [],
                     variants: (product.variants ?? []).map(v => ({ id: v.id, color: v.color, size: v.size, stock: v.stock.toString() }))
                   });
                   setIsEditing(product.id);
                }}><Edit2 className="h-4 w-4" /></Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-destructive" 
                  disabled={isDeleting === product.id}
                  onClick={async () => {
                    if (confirm("Are you sure?")) {
                      setIsDeleting(product.id);
                      try {
                        await deleteProduct(storeId, product.id);
                        toast({ title: "Product deleted" });
                      } catch (error) {
                        toast({ title: "Delete failed", variant: "destructive" });
                      } finally {
                        setIsDeleting(null);
                      }
                    }
                  }}
                >
                  {isDeleting === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
