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
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-8">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 text-center space-y-6 md:space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Activate your store</h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Welcome to <span className="font-semibold text-primary">{store.settings.name}</span>! To start managing your products and orders, please pay the one-time activation fee of ₦2,500.
              </p>
            </div>

            <div className="bg-[#F9F4F7] p-5 md:p-6 rounded-2xl text-left space-y-3 md:space-y-4">
              <div className="flex justify-between items-center pb-3 md:pb-4 border-b border-primary/10">
                <span className="text-muted-foreground font-medium text-sm md:text-base">Activation Fee</span>
                <span className="text-xl md:text-2xl font-bold text-gray-900">₦2,500.00</span>
              </div>
              <div className="space-y-2.5 md:space-y-3">
                <div className="flex items-center gap-3 text-sm md:text-base text-muted-foreground">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary flex-shrink-0" />
                  <span>One-time payment</span>
                </div>
                <div className="flex items-center gap-3 text-sm md:text-base text-muted-foreground">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary flex-shrink-0" />
                  <span>Lifetime access to dashboard</span>
                </div>
                <div className="flex items-center gap-3 text-sm md:text-base text-muted-foreground">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary flex-shrink-0" />
                  <span>Secure payment via Paystack</span>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-14 md:h-16 text-base md:text-lg font-bold rounded-2xl gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
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
              {retrying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay Now <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
            
            <p className="text-xs md:text-sm text-muted-foreground">
              Already paid? Wait a moment while we verify your status.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
