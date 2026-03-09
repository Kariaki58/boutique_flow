
"use client";

import React, { useState } from 'react';
import { useStore } from '@/components/store-context';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/lib/utils';
import { 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { generateAiSalesInsights, AiSalesInsightsGeneratorOutput } from '@/ai/flows/ai-sales-insights-generator';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { storeId } = useParams() as { storeId: string };
  const { getStore } = useStore();
  const store = getStore(storeId);
  
  const [insights, setInsights] = useState<AiSalesInsightsGeneratorOutput | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  if (!store) return <p>Loading store...</p>;

  const { orders, products } = store;

  const totalRevenue = orders.reduce((sum, o) => o.status === 'Completed' ? sum + o.total : sum, 0);
  const completedOrders = orders.filter(o => o.status === 'Completed').length;
  const pendingOrders = orders.filter(o => o.status === 'Pending Payment' || o.status === 'Payment Submitted').length;
  const lowStock = products.filter(p => p.stock <= 3).length;

  const handleGenerateInsights = async () => {
    if (orders.length === 0) return;
    setLoadingInsights(true);
    try {
      const salesData = orders.map(o => ({
        productId: o.items[0]?.productId || 'unknown',
        productName: o.items[0]?.name || 'Unknown Product',
        quantity: o.items.reduce((s, i) => s + i.quantity, 0),
        price: o.total,
        saleDate: o.createdAt,
        paymentMethod: o.paymentMethod as 'Cash' | 'Bank Transfer',
      }));
      const result = await generateAiSalesInsights({
        salesData,
        timeframe: 'last 30 days'
      });
      setInsights(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {store.settings.name} Owner</p>
        </div>
        <Button
          onClick={handleGenerateInsights}
          disabled={loadingInsights || orders.length === 0}
          size="sm"
          className="gap-2 w-full sm:w-auto"
        >
          {loadingInsights ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Insights
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="h-full">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{formatNaira(totalRevenue)}</div>
            <div className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{completedOrders}</div>
            <div className="text-xs text-muted-foreground mt-1">Completed orders</div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-accent">{pendingOrders}</div>
            <div className="text-xs text-muted-foreground mt-1">Awaiting payment</div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-orange-500">{lowStock}</div>
            <div className="text-xs text-muted-foreground mt-1">Items below 3 units</div>
          </CardContent>
        </Card>
      </div>

      {insights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              AI Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm italic">{insights.summary}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Key Trends</h4>
                <ul className="text-xs space-y-1 list-disc pl-4">
                  {insights.keyTrends.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recommendations</h4>
                <ul className="text-xs space-y-1 list-disc pl-4">
                  {insights.actionableRecommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingInsights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatNaira(order.total)}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No orders yet. Start selling!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Best Selling Products</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {insights?.bestSellingProducts ? (
              <div className="space-y-4">
                {insights.bestSellingProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{p.productName}</p>
                      <p className="text-xs text-muted-foreground">{p.salesVolume} sold</p>
                    </div>
                    <p className="font-bold text-sm text-primary">{formatNaira(p.totalRevenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Generate AI insights to see analytics.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
