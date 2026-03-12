"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Mail, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const boutiqueName = searchParams.get('boutique');
  const [status, setStatus] = useState<'waiting' | 'checking' | 'confirmed'>('waiting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already confirmed
    async function checkConfirmation() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email_confirmed_at) {
        setStatus('confirmed');
        // Clear pending boutique name from sessionStorage
        if (boutiqueName) {
          sessionStorage.removeItem('pendingBoutiqueName');
        }
        // Redirect after a moment
        setTimeout(() => {
          if (boutiqueName) {
            router.push(`/?create=${encodeURIComponent(boutiqueName)}`);
          } else {
            router.push('/admin');
          }
        }, 2000);
      }
    }

    checkConfirmation();
    
    // Set up listener for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setStatus('confirmed');
        if (boutiqueName) {
          sessionStorage.removeItem('pendingBoutiqueName');
          setTimeout(() => {
            router.push(`/?create=${encodeURIComponent(boutiqueName)}`);
          }, 2000);
        } else {
          setTimeout(() => {
            router.push('/admin');
          }, 2000);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, boutiqueName]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setError(null);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback${boutiqueName ? `?boutique=${encodeURIComponent(boutiqueName)}` : ''}`,
        },
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setError(null);
        alert('Confirmation email sent! Please check your inbox.');
      }
    } catch (err) {
      setError('Failed to resend email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F4F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg">
            <ShoppingBag className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">Boutique Flow</h1>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            {status === 'confirmed' ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-xl text-green-600">Email Confirmed!</CardTitle>
                <CardDescription className="mt-2">
                  Your account is ready. {boutiqueName && `Redirecting to create "${boutiqueName}"...`}
                  {!boutiqueName && 'Redirecting to your dashboard...'}
                </CardDescription>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl">Check Your Email</CardTitle>
                <CardDescription className="mt-2">
                  We've sent a confirmation link to
                </CardDescription>
                {email && (
                  <div className="mt-3 px-4 py-2 bg-muted rounded-lg">
                    <p className="font-medium text-sm">{email}</p>
                  </div>
                )}
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {status === 'waiting' && (
              <>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Check your inbox</p>
                      <p>Look for an email from Boutique Flow</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Click the confirmation link</p>
                      <p>This will verify your email address</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Get started</p>
                      <p>{boutiqueName ? `Create "${boutiqueName}" and start selling` : 'Access your dashboard'}</p>
                    </div>
                  </div>
                </div>

                {boutiqueName && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Your boutique is ready</p>
                      <p className="text-xs text-muted-foreground">"{boutiqueName}" will be created after confirmation</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <Button 
                    onClick={handleResendEmail}
                    variant="outline" 
                    className="w-full"
                  >
                    Resend Confirmation Email
                  </Button>
                  <Button 
                    onClick={() => router.push('/auth/login')}
                    variant="ghost" 
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>

                <div className="pt-4 border-t text-xs text-muted-foreground text-center">
                  <p>Didn't receive the email? Check your spam folder or try resending.</p>
                </div>
              </>
            )}

            {status === 'confirmed' && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Boutique Flow · Built for independent creators
        </p>
      </div>
    </div>
  );
}

