'use client';

import Link from 'next/link';
import { useSignIn } from '../model/useSignIn';

interface SignInFormProps {
  baseUrl: string;
  fetcher?: typeof globalThis.fetch;
}

export function SignInForm({ baseUrl, fetcher }: SignInFormProps) {
  const { email, password, setEmail, setPassword, status, errorMessage, handleSubmit } = useSignIn(
    baseUrl,
    fetcher,
  );

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="sign-in-email">Email</label>
        <input
          id="sign-in-email"
          type="email"
          aria-label="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
      </div>
      <div>
        <label htmlFor="sign-in-password">Password</label>
        <input
          id="sign-in-password"
          type="password"
          aria-label="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
      </div>
      {status === 'error' && errorMessage !== null && <div role="alert">{errorMessage}</div>}
      <button type="submit" disabled={status === 'submitting'}>
        Sign in
      </button>
      <p>
        <Link href="/register">Don&apos;t have an account? Register</Link>
      </p>
    </form>
  );
}
