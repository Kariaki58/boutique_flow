import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const boutiqueName = requestUrl.searchParams.get('boutique');

  if (code) {
    const supabase = await createClient();
    
    try {
      // Exchange the code for a session (this confirms the email)
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        // Error exchanging code, redirect to login with error
        console.error('Email verification error:', error);
        const redirectUrl = new URL('/auth/login', requestUrl.origin);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to confirm email. Please try again.';
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          errorMessage = 'This verification link has expired or is invalid. Please request a new verification email.';
        } else if (error.message.includes('already')) {
          errorMessage = 'This email has already been verified. Please sign in.';
        } else {
          errorMessage = error.message || errorMessage;
        }
        
        redirectUrl.searchParams.set('error', errorMessage);
        redirect(redirectUrl.toString());
        return;
      }

      // Email confirmed successfully
      // Sign out the user so they need to sign in on the login page
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        // Log but don't fail - the email is already confirmed
        console.warn('Sign out error (non-critical):', signOutError);
      }
      
      // Redirect to login page with success message
      const redirectUrl = new URL('/auth/login', requestUrl.origin);
      redirectUrl.searchParams.set('confirmed', 'true');
      if (boutiqueName) {
        redirectUrl.searchParams.set('boutique', boutiqueName);
      }
      redirect(redirectUrl.toString());
    } catch (err: any) {
      // Catch any unexpected errors
      console.error('Unexpected error in email verification callback:', err);
      const redirectUrl = new URL('/auth/login', requestUrl.origin);
      
      // Provide more helpful error message
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err?.message) {
        errorMessage = err.message;
      }
      
      redirectUrl.searchParams.set('error', errorMessage);
      redirect(redirectUrl.toString());
    }
  } else {
    // No code provided, redirect to login
    redirect('/auth/login');
  }
}

