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
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // Email confirmed successfully
        // Sign out the user so they need to sign in on the login page
        await supabase.auth.signOut();
        
        // Redirect to login page with success message
        const redirectUrl = new URL('/auth/login', requestUrl.origin);
        redirectUrl.searchParams.set('confirmed', 'true');
        if (boutiqueName) {
          redirectUrl.searchParams.set('boutique', boutiqueName);
        }
        redirect(redirectUrl.toString());
      } else {
        // Error exchanging code, redirect to login with error
        const redirectUrl = new URL('/auth/login', requestUrl.origin);
        redirectUrl.searchParams.set('error', error.message || 'Failed to confirm email. Please try again.');
        redirect(redirectUrl.toString());
      }
    } catch (err: any) {
      // Catch any unexpected errors
      const redirectUrl = new URL('/auth/login', requestUrl.origin);
      redirectUrl.searchParams.set('error', 'An unexpected error occurred. Please try again.');
      redirect(redirectUrl.toString());
    }
  }

  // No code provided, redirect to login
  redirect('/auth/login');
}

