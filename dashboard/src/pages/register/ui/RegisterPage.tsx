'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/entities/user';
import { SignUpForm } from '@/features/sign-up';

interface RegisterPageProps {
  apiBaseUrl: string;
}

export function RegisterPage({ apiBaseUrl }: RegisterPageProps) {
  const authState = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (authState.status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [authState.status, router]);

  return (
    <main>
      <h1>Create your account</h1>
      <SignUpForm baseUrl={apiBaseUrl} />
    </main>
  );
}
