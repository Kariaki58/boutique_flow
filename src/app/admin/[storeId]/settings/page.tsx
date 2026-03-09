
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Store, CreditCard, MessageCircle, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';

export default function SettingsPage() {
  const { storeId } = useParams() as { storeId: string };
  const { getStore, updateSettings } = useStore();
  const store = getStore(storeId);
  const { toast } = useToast();
  const [logo, setLogo] = useState<string[]>([]);
  const [banner, setBanner] = useState<string[]>([]);
  const [primaryColor, setPrimaryColor] = useState('#7C2D12');
  const [isSaving, setIsSaving] = useState(false);
  
  React.useEffect(() => {
    if (store?.settings) {
      if (store.settings.logo) setLogo([store.settings.logo]);
      if (store.settings.banner) setBanner([store.settings.banner]);
      if (store.settings.primaryColor) setPrimaryColor(store.settings.primaryColor);
    }
  }, [store?.settings]);

  if (!store) return <p>Loading...</p>;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setIsSaving(true);
    try {
      await updateSettings(storeId, {
        id: storeId,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        logo: logo[0] || '',
        banner: banner[0] || '',
        primaryColor: primaryColor,
        bankName: formData.get('bankName') as string,
        accountName: formData.get('accountName') as string,
        accountNumber: formData.get('accountNumber') as string,
        whatsappNumber: formData.get('whatsappNumber') as string,
      });
      toast({ title: "Settings Saved" });
    } catch (error) {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage boutique configuration</p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5 text-primary" /> Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Store Name</Label>
              <Input name="name" defaultValue={store.settings.name} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea name="description" defaultValue={store.settings.description} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Store Logo</Label>
              <ImageUploader 
                value={logo} 
                onUpload={setLogo} 
                maxImages={1}
                folder="boutique_logos"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Store Banner</Label>
              <ImageUploader 
                value={banner} 
                onUpload={setBanner} 
                maxImages={1}
                folder="boutique_banners"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Primary Color</Label>
              <div className="flex gap-3 items-center">
                <Input 
                  type="color" 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)} 
                  className="w-12 h-12 p-1 rounded-lg cursor-pointer"
                />
                <Input 
                  type="text" 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)} 
                  className="flex-1 font-mono uppercase"
                  placeholder="#000000"
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic">Try colors like #7C2D12 (Primary), #1E293B (Dark), or #6366F1 (Indigo).</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Payment Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input name="bankName" placeholder="Bank Name" defaultValue={store.settings.bankName} />
            <Input name="accountName" placeholder="Account Name" defaultValue={store.settings.accountName} />
            <Input name="accountNumber" placeholder="Account Number" defaultValue={store.settings.accountNumber} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" /> WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <Input name="whatsappNumber" placeholder="+1234567890" defaultValue={store.settings.whatsappNumber} />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 gap-2 text-lg font-bold" disabled={isSaving}>
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
