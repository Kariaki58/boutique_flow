import { AdminNav } from '@/components/layout/admin-nav';
import { ActivationGate } from '@/components/layout/activation-gate';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F9F4F7] flex flex-col md:flex-row">
      <AdminNav />
      <main className="flex-1 pb-24 md:pb-0 overflow-x-hidden">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <ActivationGate>
            {children}
          </ActivationGate>
        </div>
      </main>
    </div>
  );
}
