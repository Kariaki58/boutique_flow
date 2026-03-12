"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyStoreActivation, getMyStores } from "@/lib/actions/stores";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyActivationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function verify() {
      if (!reference) {
        setStatus("error");
        setErrorMessage("No reference found in URL");
        return;
      }

      try {
        const stores = await getMyStores();
        const storeId = stores[0]?.settings.id; // Get the most recent store

        if (!storeId) {
          setStatus("error");
          setErrorMessage("No store found to activate");
          return;
        }

        const success = await verifyStoreActivation(storeId, reference);
        if (success) {
          setStatus("success");
          setTimeout(() => {
            router.push(`/admin/${storeId}`);
          }, 2000);
        } else {
          setStatus("error");
          setErrorMessage("Payment verification failed. Please contact support if you were charged.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setErrorMessage("An unexpected error occurred during verification.");
      }
    }

    verify();
  }, [reference, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F4F7] p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-primary/10">
        {status === "verifying" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verifying Payment...</h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your activation fee payment with Paystack.
            </p>
            <div className="pt-4 space-y-2 text-sm text-muted-foreground">
              <p>Step 4 of 4: Activating your boutique</p>
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
          </div>
        )}
        {status === "success" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Store Activated!</h1>
            <p className="text-muted-foreground">
              Your payment was successful. Redirecting you to your dashboard...
            </p>
            <div className="pt-4">
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Activation Failed</h1>
            <p className="text-red-500 font-medium">{errorMessage}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/')} 
                className="w-full h-12 rounded-xl"
              >
                Back to Home
              </Button>
              <Button 
                onClick={() => router.push('/admin')} 
                variant="outline"
                className="w-full h-12 rounded-xl"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
