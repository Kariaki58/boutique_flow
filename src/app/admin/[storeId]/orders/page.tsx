
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
import { useParams } from 'next/navigation';
import { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Phone, CreditCard, CheckCircle2, XCircle, Clock, Loader2, Truck, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatNaira } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OrdersPage() {
  const { storeId } = useParams() as { storeId: string };
  const { getStore, updateOrderStatus } = useStore();
  const store = getStore(storeId);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  if (!store) return <p>Loading...</p>;

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(storeId, orderId, status);
      toast({ title: "Order status updated", description: `Order ${orderId} is now ${status}.` });
    } catch (error) {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = store.orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
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

  const OrderCard = ({ order }: { order: Order }) => {
    const isUpdating = updatingOrderId === order.id;
    return (
      <Card className="mb-4">
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-primary">{order.orderNumber}</CardTitle>
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
               {formatNaira(order.total)}
             </div>
          </div>
           
           <div className="bg-muted/30 p-3 rounded-lg flex flex-col gap-2 border border-dashed">
              <div className="flex items-center justify-between text-xs">
                 <span className="text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                    {order.deliveryMethod === 'Delivery' ? <Truck className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                    {order.deliveryMethod}
                 </span>
                 {order.deliveryMethod === 'Delivery' && (
                   <span className="text-primary font-medium">Home Delivery</span>
                 )}
              </div>
              {order.deliveryMethod === 'Delivery' && order.deliveryAddress && (
                <div className="text-xs">
                   <p className="text-muted-foreground mb-1">Address:</p>
                   <p className="font-medium bg-white p-2 rounded border">{order.deliveryAddress}</p>
                </div>
              )}
              {order.deliveryMethod === 'Pickup' && (
                <p className="text-[10px] text-muted-foreground italic">Customer will pick up from the store.</p>
              )}
           </div>
           <div className="flex gap-2">
             {(order.status === 'Payment Submitted' || order.status === 'Pending Payment') && (
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button size="sm" className="flex-1" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Confirm Payment
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                     <AlertDialogDescription>
                       Are you sure you want to mark order <strong>{order.orderNumber}</strong> as paid? This will change the status to "Confirmed".
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel>Cancel</AlertDialogCancel>
                     <AlertDialogAction onClick={() => handleUpdateStatus(order.id, 'Confirmed')} className="bg-primary hover:bg-primary/90">
                       Confirm
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
             )}
             {order.status === 'Confirmed' && (
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Complete Order
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Complete Order</AlertDialogTitle>
                     <AlertDialogDescription>
                       Mark order <strong>{order.orderNumber}</strong> as completed? This usually means the customer has received their items.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel>No, wait</AlertDialogCancel>
                     <AlertDialogAction onClick={() => handleUpdateStatus(order.id, 'Completed')} className="bg-green-600 hover:bg-green-700">
                       Yes, Complete
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
             )}
             {order.status !== 'Completed' && order.status !== 'Cancelled' && (
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button size="sm" variant="outline" className="text-destructive border-destructive" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Cancel
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                     <AlertDialogDescription>
                       Are you sure you want to cancel order <strong>{order.orderNumber}</strong>? This action will restock the items and cannot be easily undone.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel>No, keep it</AlertDialogCancel>
                     <AlertDialogAction onClick={() => handleUpdateStatus(order.id, 'Cancelled')} className="bg-destructive hover:bg-destructive/90 text-white">
                       Yes, Cancel Order
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
             )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
        <TabsContent value="pending" className="pt-4">
          {filteredOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length === 0 && <div className="text-center py-10 opacity-50"><Clock className="w-10 h-10 mx-auto mb-2" /> No active orders</div>}
        </TabsContent>
        <TabsContent value="done" className="pt-4">
          {filteredOrders.filter(o => o.status === 'Completed').map(order => <OrderCard key={order.id} order={order} />)}
          {filteredOrders.filter(o => o.status === 'Completed').length === 0 && <div className="text-center py-10 opacity-50"><Clock className="w-10 h-10 mx-auto mb-2" /> No completed orders</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
