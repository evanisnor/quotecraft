'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/entities/user';
import { SignInForm } from '@/features/sign-in';

interface LoginPageProps {
  apiBaseUrl: string;
}

export function LoginPage({ apiBaseUrl }: LoginPageProps) {
  const authState = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (authState.status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [authState.status, router]);

  return (
    <main>
      <h1>Sign in</h1>
      <SignInForm baseUrl={apiBaseUrl} />
    </main>
  );
}
