
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
import { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Phone, Clock, CreditCard, CheckCircle2, XCircle, ChevronRight, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function OrdersPage() {
  const { orders, updateOrderStatus } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    switch (status) {
      case 'Pending Payment': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'Payment Submitted': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Payment Submitted</Badge>;
      case 'Confirmed': return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Confirmed</Badge>;
      case 'Completed': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'Cancelled': return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-primary">{order.id}</CardTitle>
          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <StatusBadge status={order.status} />
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-bold">{order.customerName[0]}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{order.customerName}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Phone className="w-2 h-2" /> {order.customerPhone}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">${order.total}</p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
              <CreditCard className="w-2 h-2" /> {order.paymentMethod}
            </p>
          </div>
        </div>

        <div className="bg-muted/30 p-2 rounded-md">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Items</p>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span>{item.quantity}x {item.name}</span>
              <span>${item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          {order.status === 'Payment Submitted' && (
            <Button size="sm" className="flex-1 gap-1" onClick={() => updateOrderStatus(order.id, 'Confirmed')}>
              <CheckCircle2 className="w-4 h-4" /> Confirm Payment
            </Button>
          )}
          {order.status === 'Confirmed' && (
            <Button size="sm" className="flex-1 gap-1 bg-green-600 hover:bg-green-700" onClick={() => updateOrderStatus(order.id, 'Completed')}>
              <CheckCircle2 className="w-4 h-4" /> Complete Order
            </Button>
          )}
          {order.status !== 'Completed' && order.status !== 'Cancelled' && (
            <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => updateOrderStatus(order.id, 'Cancelled')}>
              <XCircle className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1">
            <FileText className="w-4 h-4" /> Receipt
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Track and manage sales from all channels</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          placeholder="Search by name or order ID..." 
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-12">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Ready</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4">
          {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.length === 0 && <EmptyState />}
        </TabsContent>
        <TabsContent value="pending" className="pt-4">
          {filteredOrders.filter(o => o.status === 'Pending Payment' || o.status === 'Payment Submitted').map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.filter(o => o.status === 'Pending Payment' || o.status === 'Payment Submitted').length === 0 && <EmptyState />}
        </TabsContent>
        <TabsContent value="confirmed" className="pt-4">
          {filteredOrders.filter(o => o.status === 'Confirmed').map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.filter(o => o.status === 'Confirmed').length === 0 && <EmptyState />}
        </TabsContent>
        <TabsContent value="done" className="pt-4">
          {filteredOrders.filter(o => o.status === 'Completed').map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.filter(o => o.status === 'Completed').length === 0 && <EmptyState />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground space-y-2">
      <Clock className="w-12 h-12 mx-auto opacity-20" />
      <p className="font-medium">No orders found</p>
      <p className="text-xs">New orders will appear here automatically.</p>
    </div>
  );
}
