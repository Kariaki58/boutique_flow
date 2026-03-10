"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '@/components/store-context';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNaira, cn } from '@/lib/utils';
import { 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Banknote,
  Globe,
  Plus,
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

type TimeFrame = 'today' | '7d' | '30d' | '3m' | 'all';

export default function AdminDashboard() {
  const { storeId } = useParams() as { storeId: string };
  const { getStore } = useStore();
  const store = getStore(storeId);
  
  const [timeframe, setTimeframe] = useState<TimeFrame>('7d');
  const [timelinePage, setTimelinePage] = useState(0);

  // Memoized stats
  const stats = useMemo(() => {
    if (!store) return null;
    const { orders, products } = store;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filteredOrders = orders.filter(o => o.status === 'Completed');
    
    if (timeframe !== 'all') {
      const cutoff = new Date();
      if (timeframe === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (timeframe === '7d') {
        cutoff.setDate(now.getDate() - 7);
      } else if (timeframe === '30d') {
        cutoff.setDate(now.getDate() - 30);
      } else if (timeframe === '3m') {
        cutoff.setMonth(now.getMonth() - 3);
      }
      filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= cutoff);
    }
    
    // Revenue & Profit
    let totalRevenue = 0;
    let totalProfit = 0;
    
    filteredOrders.forEach(order => {
      totalRevenue += order.total;
      order.items.forEach(item => {
        const profitPerItem = (item.price - (item.buyingPrice || 0)) * item.quantity;
        totalProfit += profitPerItem;
      });
    });

    // Payment method breakdown
    const cashRevenue = filteredOrders
      .filter(o => o.paymentMethod === 'Cash')
      .reduce((s, o) => s + o.total, 0);
    const onlineRevenue = totalRevenue - cashRevenue;

    const pendingOrders = orders.filter(o => o.status === 'Pending Payment' || o.status === 'Payment Submitted').length;
    const lowStock = products.filter(p => p.stock <= 3).length;

    // Chart data generation based on timeframe
    let chartData: { name: string; revenue: number; profit: number }[] = [];
    
    if (timeframe === 'today') {
      // Hourly for today
      chartData = Array.from({ length: 12 }, (_, i) => {
        const hour = i * 2;
        const label = `${hour}:00`;
        const hourOrders = filteredOrders.filter(o => {
          const d = new Date(o.createdAt);
          return d.getHours() >= hour && d.getHours() < hour + 2;
        });
        const revenue = hourOrders.reduce((s, o) => s + o.total, 0);
        const profit = hourOrders.reduce((s, o) => {
          return s + o.items.reduce((ip, item) => ip + (item.price - (item.buyingPrice || 0)) * item.quantity, 0);
        }, 0);
        return { name: label, revenue, profit };
      });
    } else {
      // Daily for 7d, 30d, etc.
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '3m' ? 90 : 30;
      chartData = Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayName = days <= 7 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayOrders = orders.filter(o => o.status === 'Completed' && o.createdAt.startsWith(dateStr));
        const revenue = dayOrders.reduce((s, o) => s + o.total, 0);
        const profit = dayOrders.reduce((s, o) => {
          return s + o.items.reduce((ip, item) => ip + (item.price - (item.buyingPrice || 0)) * item.quantity, 0);
        }, 0);

        return { name: dayName, revenue, profit };
      });
      
      // If 30d or 90d, sample the data to avoid overcrowding the chart
      if (days > 14) {
        const step = Math.ceil(days / 10);
        chartData = chartData.filter((_, i) => i % step === 0);
      }
    }

    // Recent events (timeline)
    const timeline = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Manual Best Selling Products calculation
    const productStats = new Map<string, { id: string; name: string; sales: number; revenue: number; image?: string }>();
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const stats = productStats.get(item.productId) || { 
          id: item.productId, 
          name: item.name, 
          sales: 0, 
          revenue: 0,
          image: products.find(p => p.id === item.productId)?.images[0]
        };
        stats.sales += item.quantity;
        stats.revenue += item.price * item.quantity;
        productStats.set(item.productId, stats);
      });
    });

    const bestSellers = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalProfit,
      completedCount: filteredOrders.length,
      pendingCount: pendingOrders,
      lowStockCount: lowStock,
      cashRevenue,
      onlineRevenue,
      chartData: chartData.length > 0 ? chartData : [{ name: 'N/A', revenue: 0, profit: 0 }],
      timeline,
      bestSellers
    };
  }, [store, timeframe]);

  // Calculate pagination for timeline
  const timelinePages = useMemo(() => {
    if (!stats) return { pages: [], totalPages: 0 };
    
    const itemsPerPage = 6;
    const pages = [];
    
    for (let i = 0; i < stats.timeline.length; i += itemsPerPage) {
      pages.push(stats.timeline.slice(i, i + itemsPerPage));
    }
    
    return {
      pages,
      totalPages: pages.length,
      currentPageItems: pages[timelinePage] || []
    };
  }, [stats, timelinePage]);

  const handlePreviousPage = () => {
    setTimelinePage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setTimelinePage(prev => Math.min(timelinePages.totalPages - 1, prev + 1));
  };

  if (!store || !stats) return <p>Loading store...</p>;

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Insights & Analytics</h1>
          <p className="text-muted-foreground text-sm">Real-time performance for {store.settings.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
            {(['today', '7d', '30d', '3m', 'all'] as const).map((t) => (
              <Button
                key={t}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                  timeframe === t ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
                )}
                onClick={() => setTimeframe(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black text-primary">{formatNaira(stats.totalRevenue)}</div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center text-[10px] text-muted-foreground">
                <Banknote className="w-3 h-3 mr-1" /> {formatNaira(stats.cashRevenue)} Cash
              </div>
              <div className="flex items-center text-[10px] text-muted-foreground">
                <Globe className="w-3 h-3 mr-1" /> {formatNaira(stats.onlineRevenue)} Online
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-green-50">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-600/70">Total Profit</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black text-green-700">{formatNaira(stats.totalProfit)}</div>
            <div className="text-[10px] text-green-600 flex items-center mt-2">
              <TrendingUp className="w-3 h-3 mr-1" /> 
              {stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}% Margin
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-blue-50">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-600/70">Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black text-blue-700">{stats.completedCount}</div>
            <p className="text-[10px] text-blue-600 mt-2">Completed transactions</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-orange-50">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-orange-600/70">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black text-orange-700">{stats.pendingCount + stats.lowStockCount}</div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-orange-600">{stats.pendingCount} Pending</span>
              <span className="text-[10px] text-orange-600">{stats.lowStockCount} Low Stock</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-lg">Performance Over Time</CardTitle>
              <p className="text-xs text-muted-foreground">Revenue vs Profit (Last 7 Days)</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C2D12" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#7C2D12" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803d" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#15803d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(v) => `₦${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(v: number) => [formatNaira(v), ""]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#7C2D12" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    name="Revenue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#15803d" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                    name="Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Timeline - Original Design with Pagination (6 items per page) */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Timeline</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Page {timelinePage + 1} of {timelinePages.totalPages || 1}
              </span>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                  onClick={handlePreviousPage}
                  disabled={timelinePage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                  onClick={handleNextPage}
                  disabled={timelinePage === timelinePages.totalPages - 1 || timelinePages.totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-1 bottom-1 w-px bg-muted" />
              
              {/* Timeline items - exactly 6 per page */}
              <div className="space-y-6 min-h-[320px]">
                {timelinePages.currentPageItems.length > 0 ? (
                  timelinePages.currentPageItems.map((order) => (
                    <div key={order.id} className="relative pl-8">
                      <div className={cn(
                        "absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center",
                        order.status === 'Completed' ? 'bg-green-500' : 
                        order.status === 'Cancelled' ? 'bg-red-500' : 'bg-orange-500'
                      )}>
                        {order.source === 'POS' ? 
                          <Banknote className="w-2.5 h-2.5 text-white" /> : 
                          <Globe className="w-2.5 h-2.5 text-white" />
                        }
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate max-w-[120px]">{order.customerName}</span>
                          <span className="text-[10px] font-black">{formatNaira(order.total)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{order.paymentMethod}</span>
                          <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-muted-foreground text-xs italic">
                    No activity yet.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Best Selling Products</CardTitle>
            <p className="text-xs text-muted-foreground">Ranked by revenue generation</p>
          </CardHeader>
          <CardContent className="p-0">
            {stats.bestSellers.length > 0 ? (
              <div className="divide-y">
                {stats.bestSellers.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <img src={p.image || "https://picsum.photos/seed/product/200"} className="w-full h-full object-cover" alt={p.name} />
                      </div>
                      <div>
                        <p className="font-bold text-sm truncate max-w-[150px]">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.sales} units sold</p>
                      </div>
                    </div>
                    <p className="font-black text-sm text-primary">{formatNaira(p.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Package className="w-8 h-8 opacity-20" />
                <p>No sales data for this period.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Inventory Alerts</CardTitle>
            <p className="text-xs text-muted-foreground">Products requiring restock</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {store.products.filter(p => p.stock <= 5).map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-orange-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={product.images[0]} className="w-full h-full object-cover" alt={product.name} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{product.category}</p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="font-black">
                    {product.stock} LEFT
                  </Badge>
                </div>
              ))}
              {store.products.filter(p => p.stock <= 5).length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm italic">
                  All items are well stocked!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}