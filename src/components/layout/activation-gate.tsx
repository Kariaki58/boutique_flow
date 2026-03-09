"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStoreById } from "@/lib/actions/stores";
import { Loader2, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoutiqueStore } from "@/lib/types";

export function ActivationGate({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const storeId = params?.storeId as string | undefined;
  const [store, setStore] = useState<BoutiqueStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    async function checkActivation() {
      try {
        const storeData = await getStoreById(storeId as string);
        setStore(storeData);
      } catch (error) {
        console.error("Failed to check activation:", error);
      } finally {
        setLoading(false);
      }
    }

    checkActivation();
  }, [storeId]);

  const [retrying, setRetrying] = useState(false);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
      </div>
    );
  }

  // If no storeId yet (like in /admin), let it pass to the individual page handlers
  if (!storeId) return <>{children}</>;

  if (store && !store.settings.isActivated) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-primary/10 text-center space-y-8">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <CreditCard className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">Activate your store</h1>
            <p className="text-lg text-muted-foreground">
              Welcome to <span className="font-semibold text-primary">{store.settings.name}</span>! 
              To start managing your products and orders, please pay the one-time activation fee of ₦2,500.
            </p>
          </div>

          <div className="bg-[#F9F4F7] p-6 rounded-2xl text-left space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-primary/10">
              <span className="text-muted-foreground font-medium">Activation Fee</span>
              <span className="text-xl font-bold">₦2,500.00</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" />
              One-time payment
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Lifetime access to dashboard
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Secure payment via Paystack
            </div>
          </div>

          <Button 
            className="w-full h-14 text-lg font-bold rounded-2xl gap-2 shadow-lg shadow-primary/20"
            disabled={retrying}
            onClick={async () => {
              setRetrying(true);
              try {
                const { reinitializeActivationPayment } = await import("@/lib/actions/stores");
                const url = await reinitializeActivationPayment(storeId as string);
                window.location.href = url;
              } catch (error) {
                console.error("Failed to retry payment:", error);
                setRetrying(false);
              }
            }}
          >
            {retrying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay Now"} <ArrowRight className="w-5 h-5" />
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Already paid? Wait a moment while we verify your status.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
