
"use client";

import { AdminStoreRedirect } from "@/components/layout/admin-store-redirect";

export default function InventoryPage() {
  return (
    <AdminStoreRedirect
      buildPath={(storeId) => `/admin/${storeId}/inventory`}
      label="Loading inventory…"
    />
  );
}
