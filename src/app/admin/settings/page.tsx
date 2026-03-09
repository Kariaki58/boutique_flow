
"use client";

import React from 'react';
import { useStore } from '@/components/store-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Store, CreditCard, MessageCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    updateSettings({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      logo: settings.logo,
      bankName: formData.get('bankName') as string,
      accountName: formData.get('accountName') as string,
      accountNumber: formData.get('accountNumber') as string,
      whatsappNumber: formData.get('whatsappNumber') as string,
    });
    toast({ title: "Settings Saved", description: "Your store configuration has been updated." });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Customize your boutique storefront and payment options</p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Boutique Profile
            </CardTitle>
            <CardDescription>This information will be visible to your customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Store Name</Label>
              <Input id="name" name="name" defaultValue={settings.name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Store Description</Label>
              <Textarea id="description" name="description" defaultValue={settings.description} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Bank Transfer Details
            </CardTitle>
            <CardDescription>Customers will see this for manual payment confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" name="bankName" defaultValue={settings.bankName} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" name="accountName" defaultValue={settings.accountName} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input id="accountNumber" name="accountNumber" defaultValue={settings.accountNumber} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              WhatsApp Integration
            </CardTitle>
            <CardDescription>Used for the "Order on WhatsApp" button.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number (with country code)</Label>
              <Input id="whatsappNumber" name="whatsappNumber" defaultValue={settings.whatsappNumber} placeholder="+1234567890" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 gap-2 text-lg font-semibold">
          <Save className="w-5 h-5" /> Save Changes
        </Button>
      </form>
    </div>
  );
}
