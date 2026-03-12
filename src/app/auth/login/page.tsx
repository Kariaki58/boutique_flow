
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Loader2, ArrowRight, Mail, CheckCircle2 } from 'lucide-react';
import { signIn, signUp } from '@/lib/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode');
  const confirmed = searchParams.get('confirmed');
  const boutiqueFromUrl = searchParams.get('boutique');
  const [mode, setMode] = useState<'signin' | 'signup'>(urlMode === 'signup' ? 'signup' : 'signin');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingBoutiqueName, setPendingBoutiqueName] = useState<string>('');

  useEffect(() => {
    // Restore boutique name from sessionStorage if available
    const storedName = sessionStorage.getItem('pendingBoutiqueName');
    if (storedName) {
      setPendingBoutiqueName(storedName);
    }
    
    // Check if user just confirmed their email
    if (confirmed === 'true') {
      setSuccessMessage('Email confirmed successfully! Please sign in to continue.');
      setMode('signin'); // Switch to signin mode
      if (boutiqueFromUrl) {
        setPendingBoutiqueName(boutiqueFromUrl);
        sessionStorage.setItem('pendingBoutiqueName', boutiqueFromUrl);
      }
      // Clear the URL parameter but keep mode=signin
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('confirmed');
      newUrl.searchParams.delete('boutique');
      newUrl.searchParams.set('mode', 'signin');
      router.replace(newUrl.pathname + newUrl.search);
    }
    
    // Check for error in URL
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(urlError);
      router.replace('/auth/login');
    }
  }, [confirmed, boutiqueFromUrl, router, searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    // Add pending boutique name to formData for signin
    if (pendingBoutiqueName && mode === 'signin') {
      formData.append('pendingBoutiqueName', pendingBoutiqueName);
    }

    startTransition(async () => {
      const result = mode === 'signup' ? await signUp(formData, pendingBoutiqueName) : await signIn(formData);
      if (result?.error) {
        setError(result.error);
      } else if (mode === 'signup' && result?.needsConfirmation) {
        // Redirect handled by signUp action
      } else if (mode === 'signin' && result?.needsConfirmation) {
        setError('Please check your email and confirm your account before signing in.');
      }
    });
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
            <CardTitle className="text-xl">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <CardDescription>
              {mode === 'signin'
                ? 'Sign in to manage your boutique'
                : pendingBoutiqueName 
                  ? `Create your account to launch "${pendingBoutiqueName}"`
                  : 'Launch your online boutique in minutes'}
            </CardDescription>
            {pendingBoutiqueName && mode === 'signup' && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="font-medium">Boutique: {pendingBoutiqueName}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  After creating your account, you'll confirm your email, then activate "{pendingBoutiqueName}"
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    required
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              </div>

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{successMessage}</p>
                    {pendingBoutiqueName && (
                      <p className="text-xs mt-1">Your boutique "{pendingBoutiqueName}" is ready to be created after you sign in.</p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12 font-bold gap-2" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null); }}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); }}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Boutique Flow · Built for independent creators
        </p>
      </div>
    </div>
  );
}
