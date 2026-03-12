'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signUp(formData: FormData, boutiqueName?: string | null) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback${boutiqueName ? `?boutique=${encodeURIComponent(boutiqueName)}` : ''}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    // Email confirmation required
    revalidatePath('/', 'layout');
    redirect(`/auth/confirm-email?email=${encodeURIComponent(email)}${boutiqueName ? `&boutique=${encodeURIComponent(boutiqueName)}` : ''}`);
  }

  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Check if error is due to unconfirmed email
    if (error.message.includes('email') && error.message.includes('confirm')) {
      return { error: error.message, needsConfirmation: true };
    }
    return { error: error.message };
  }

  // Check if user email is confirmed
  if (data.user && !data.user.email_confirmed_at) {
    return { error: 'Please confirm your email address before signing in. Check your inbox for the confirmation link.', needsConfirmation: true };
  }

  revalidatePath('/', 'layout');
  
  // Check if there's a pending boutique name
  const pendingBoutiqueName = formData.get('pendingBoutiqueName') as string | null;
  if (pendingBoutiqueName) {
    redirect(`/?create=${encodeURIComponent(pendingBoutiqueName)}`);
  } else {
    redirect('/admin');
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth/login');
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
