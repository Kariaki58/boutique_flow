
"use client";

import { AdminStoreRedirect } from "@/components/layout/admin-store-redirect";

export default function OrdersPage() {
  return (
    <AdminStoreRedirect
      buildPath={(storeId) => `/admin/${storeId}/orders`}
      label="Loading orders…"
    />
  );
}
