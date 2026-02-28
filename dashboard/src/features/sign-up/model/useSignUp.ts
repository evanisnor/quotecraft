'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuthDispatch } from '@/entities/user';
import { registerUser } from '@/entities/user';

type SignUpStatus = 'idle' | 'submitting' | 'error';

interface UseSignUpResult {
  email: string;
  password: string;
  confirmPassword: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
  status: SignUpStatus;
  errorMessage: string | null;
  handleSubmit: (e: FormEvent) => void;
}

export function useSignUp(
  baseUrl: string,
  fetcher: typeof globalThis.fetch = globalThis.fetch,
): UseSignUpResult {
  const dispatch = useAuthDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<SignUpStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMessage('Passwords do not match');
      return;
    }

    setStatus('submitting');
    setErrorMessage(null);

    registerUser(baseUrl, email, password, fetcher)
      .then(({ token }) => {
        dispatch({ type: 'login_succeeded', token });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setStatus('error');
        setErrorMessage(message);
      });
  }

  return {
    email,
    password,
    confirmPassword,
    setEmail,
    setPassword,
    setConfirmPassword,
    status,
    errorMessage,
    handleSubmit,
  };
}
