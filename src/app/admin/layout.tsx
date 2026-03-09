
import { AdminNav } from '@/components/layout/admin-nav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
