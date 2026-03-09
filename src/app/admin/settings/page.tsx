
"use client";

import { AdminStoreRedirect } from "@/components/layout/admin-store-redirect";

export default function SettingsPage() {
  return (
    <AdminStoreRedirect
      buildPath={(storeId) => `/admin/${storeId}/settings`}
      label="Loading settings…"
    />
  );
}
