
"use client";

import { AdminNav } from '@/components/layout/admin-nav';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/components/store-context';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { storeId } = useParams() as { storeId: string };
  const { getStore } = useStore();
  const router = useRouter();
  
  const store = getStore(storeId);

  useEffect(() => {
    if (!store && storeId) {
       // Optional: Redirect if store not found after hydration
    }
  }, [store, storeId]);

  return (
    <div className="min-h-screen bg-[#F9F4F7] flex flex-col md:flex-row">
      <AdminNav />
      <main className="flex-1 pb-20 md:pb-0 md:pl-24 overflow-x-hidden">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
