"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store-context";

export function AdminStoreRedirect({
  buildPath,
  label = "Loading…",
}: {
  buildPath: (storeId: string) => string;
  label?: string;
}) {
  const { stores } = useStore();
  const router = useRouter();

  useEffect(() => {
    const storeId = stores[0]?.settings.id;
    if (storeId) router.replace(buildPath(storeId));
  }, [stores, router, buildPath]);

  return (
    <div className="py-10 text-sm text-muted-foreground">
      {label}
    </div>
  );
}


