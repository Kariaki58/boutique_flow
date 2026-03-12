"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyStores } from "@/lib/actions/stores";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight, Loader2, Store } from "lucide-react";
import Link from "next/link";

export function AdminStoreRedirect({
  buildPath,
  label = "Loading…",
}: {
  buildPath: (storeId: string) => string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasStores, setHasStores] = useState(false);

  useEffect(() => {
    async function redirect() {
      try {
        const stores = await getMyStores();
        const storeId = stores[0]?.settings.id;
        if (storeId) {
          setHasStores(true);
          router.replace(buildPath(storeId));
        } else {
          setHasStores(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to redirect:", error);
        setLoading(false);
      }
    }
    redirect();
  }, [router, buildPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    );
  }

  if (!hasStores) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Boutique Flow!</CardTitle>
            <CardDescription className="text-base mt-2">
              You don't have any boutiques yet. Let's create your first one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-bold text-xs">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Choose a name</p>
                  <p>Give your boutique a memorable name</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-bold text-xs">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Pay activation fee</p>
                  <p>One-time payment of ₦2,500 to activate your store</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-bold text-xs">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Start selling</p>
                  <p>Add products and start taking orders</p>
                </div>
              </div>
            </div>
            <Link href="/">
              <Button className="w-full h-12 text-lg font-bold gap-2">
                Create Your First Boutique <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-10 text-sm text-muted-foreground">
      {label}
    </div>
  );
}


