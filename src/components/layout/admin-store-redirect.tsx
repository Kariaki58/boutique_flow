"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyStores } from "@/lib/actions/stores";

export function AdminStoreRedirect({
  buildPath,
  label = "Loading…",
}: {
  buildPath: (storeId: string) => string;
  label?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      try {
        const stores = await getMyStores();
        const storeId = stores[0]?.settings.id;
        if (storeId) {
          router.replace(buildPath(storeId));
        } else {
          // No stores found, maybe redirect to landing to create one
          router.replace('/');
        }
      } catch (error) {
        console.error("Failed to redirect:", error);
      }
    }
    redirect();
  }, [router, buildPath]);

  return (
    <div className="py-10 text-sm text-muted-foreground">
      {label}
    </div>
  );
}


