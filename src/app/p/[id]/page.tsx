
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/components/store-context";

export default function LegacyProductRedirectPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { stores } = useStore();

  useEffect(() => {
    const store = stores.find((s) => s.products.some((p) => p.id === id));
    if (store) router.replace(`/s/${store.settings.id}/p/${id}`);
  }, [stores, id, router]);

  return (
    <div className="py-10 text-sm text-muted-foreground">
      Loading product…
    </div>
  );
}
