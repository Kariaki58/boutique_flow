
"use client";

import { AdminStoreRedirect } from "@/components/layout/admin-store-redirect";

export default function AdminDashboard() {
  return (
    <AdminStoreRedirect
      buildPath={(storeId) => `/admin/${storeId}`}
      label="Loading your store dashboard…"
    />
  );
}
