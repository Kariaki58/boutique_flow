
"use client";

import { AdminStoreRedirect } from "@/components/layout/admin-store-redirect";

export default function PosPage() {
  return (
    <AdminStoreRedirect
      buildPath={(storeId) => `/admin/${storeId}/pos`}
      label="Loading POS…"
    />
  );
}
