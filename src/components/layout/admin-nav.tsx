
"use client";

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, ClipboardList, Settings, Store, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/components/store-context';

export function AdminNav() {
  const pathname = usePathname();
  const { storeId } = useParams() as { storeId: string };
  const { stores } = useStore();

  const resolvedStoreId = storeId ?? stores[0]?.settings.id;

  const navItems = [
    { href: `/admin/${resolvedStoreId}`, icon: LayoutDashboard, label: 'Home' },
    { href: `/admin/${resolvedStoreId}/pos`, icon: ShoppingBag, label: 'POS' },
    { href: `/admin/${resolvedStoreId}/orders`, icon: ClipboardList, label: 'Orders' },
    { href: `/admin/${resolvedStoreId}/inventory`, icon: Package, label: 'Stock' },
    { href: `/admin/${resolvedStoreId}/settings`, icon: Settings, label: 'Settings' },
  ];

  return (
    <nav
      className={cn(
        // Mobile: fixed bottom nav (PWA style)
        "fixed bottom-0 left-0 right-0 z-50 h-16 px-4",
        "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
        "border-t shadow-[0_-6px_24px_-18px_hsl(var(--foreground)/0.25)]",
        "flex items-center justify-around",
        "pb-[env(safe-area-inset-bottom)]",
        // Desktop: sticky sidebar
        "md:sticky md:top-0 md:bottom-auto md:left-auto md:right-auto",
        "md:h-screen md:w-20 md:px-0 md:pt-8 md:pb-6",
        "md:flex-col md:justify-start md:gap-8",
        "md:border-t-0 md:border-r md:shadow-lg"
      )}
    >
      <div className="hidden md:flex items-center justify-center">
        <Store className="w-8 h-8 text-primary" />
      </div>
      <div className="flex w-full justify-around md:flex-col md:gap-6 md:items-center">
        {!resolvedStoreId ? (
          <div className="text-xs text-muted-foreground md:rotate-90 md:whitespace-nowrap">
            Loading store…
          </div>
        ) : (
          <>
            {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-medium md:hidden">{label}</span>
            </Link>
          );
        })}
            <Link
              href={`/s/${resolvedStoreId}`}
              target="_blank"
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
            >
              <Globe className="w-6 h-6" />
              <span className="text-[10px] font-medium md:hidden">Live Store</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
