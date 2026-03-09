
"use client";

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, ClipboardList, Settings, Store, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminNav() {
  const pathname = usePathname();
  const { storeId } = useParams() as { storeId: string };

  const navItems = [
    { href: `/admin/${storeId}`, icon: LayoutDashboard, label: 'Home' },
    { href: `/admin/${storeId}/pos`, icon: ShoppingBag, label: 'POS' },
    { href: `/admin/${storeId}/orders`, icon: ClipboardList, label: 'Orders' },
    { href: `/admin/${storeId}/inventory`, icon: Package, label: 'Stock' },
    { href: `/admin/${storeId}/settings`, icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="pwa-bottom-nav md:top-0 md:bottom-auto md:h-screen md:w-20 md:flex-col md:border-r md:border-t-0 md:pt-8 bg-white shadow-lg">
      <div className="hidden md:flex mb-8 items-center justify-center">
        <Store className="w-8 h-8 text-primary" />
      </div>
      <div className="flex w-full justify-around md:flex-col md:gap-8 md:items-center">
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
          href={`/s/${storeId}`}
          target="_blank"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
        >
          <Globe className="w-6 h-6" />
          <span className="text-[10px] font-medium md:hidden">Live Store</span>
        </Link>
      </div>
    </nav>
  );
}
