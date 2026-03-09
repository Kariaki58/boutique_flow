
"use client";

import React from 'react';
import { useStore } from '@/components/store-context';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Store, CreditCard, MessageCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { storeId } = useParams() as { storeId: string };
  const { getStore, updateSettings } = useStore();
  const store = getStore(storeId);
  const { toast } = useToast();

  if (!store) return <p>Loading...</p>;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    updateSettings(storeId, {
      id: storeId,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      logo: store.settings.logo,
      bankName: formData.get('bankName') as string,
      accountName: formData.get('accountName') as string,
      accountNumber: formData.get('accountNumber') as string,
      whatsappNumber: formData.get('whatsappNumber') as string,
    });
    toast({ title: "Settings Saved" });
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

        <Button type="submit" className="w-full h-12 gap-2 text-lg font-bold">
          <Save className="w-5 h-5" /> Save Changes
        </Button>
      </form>
    </div>
  );
}
