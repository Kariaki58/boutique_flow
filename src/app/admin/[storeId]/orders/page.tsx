
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
import { useParams } from 'next/navigation';
import { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Phone, CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function OrdersPage() {
  const { storeId } = useParams() as { storeId: string };
  const { getStore, updateOrderStatus } = useStore();
  const store = getStore(storeId);
  const [searchTerm, setSearchTerm] = useState('');

  if (!store) return <p>Loading...</p>;

  const filteredOrders = store.orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const variants: Record<string, string> = {
      'Pending Payment': 'bg-yellow-100 text-yellow-800',
      'Payment Submitted': 'bg-blue-100 text-blue-800',
      'Confirmed': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return <Badge variant="outline" className={variants[status] || ''}>{status}</Badge>;
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="mb-4">
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-primary">{order.id}</CardTitle>
          <p className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <StatusBadge status={order.status} />
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="flex justify-between items-center">
           <div>
             <p className="text-sm font-medium">{order.customerName}</p>
             <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {order.customerPhone}</p>
           </div>
           <div className="text-right font-bold text-lg">
             ${order.total}
           </div>
        </div>
        <div className="flex gap-2">
           {order.status === 'Payment Submitted' && (
             <Button size="sm" className="flex-1" onClick={() => updateOrderStatus(storeId, order.id, 'Confirmed')}>Confirm Payment</Button>
           )}
           {order.status === 'Confirmed' && (
             <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => updateOrderStatus(storeId, order.id, 'Completed')}>Complete Order</Button>
           )}
           {order.status !== 'Completed' && order.status !== 'Cancelled' && (
             <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => updateOrderStatus(storeId, order.id, 'Cancelled')}>Cancel</Button>
           )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage your sales</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder="Search orders..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">Active</TabsTrigger>
          <TabsTrigger value="done" className="flex-1">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4">
          {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.length === 0 && <div className="text-center py-10 opacity-50"><Clock className="w-10 h-10 mx-auto mb-2" /> No orders</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
