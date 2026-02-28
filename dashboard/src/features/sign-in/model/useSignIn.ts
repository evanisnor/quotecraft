'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuthDispatch } from '@/entities/user';
import { loginUser } from '@/entities/user';

type SignInStatus = 'idle' | 'submitting' | 'error';

interface UseSignInResult {
  email: string;
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  status: SignInStatus;
  errorMessage: string | null;
  handleSubmit: (e: FormEvent) => void;
}

export function useSignIn(
  baseUrl: string,
  fetcher: typeof globalThis.fetch = globalThis.fetch,
): UseSignInResult {
  const dispatch = useAuthDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<SignInStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);

    loginUser(baseUrl, email, password, fetcher)
      .then(({ token }) => {
        dispatch({ type: 'login_succeeded', token });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setStatus('error');
        setErrorMessage(message);
      });
  }

  return { email, password, setEmail, setPassword, status, errorMessage, handleSubmit };
}
