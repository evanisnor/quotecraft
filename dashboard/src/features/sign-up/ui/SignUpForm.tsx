'use client';

import Link from 'next/link';
import { useSignUp } from '../model/useSignUp';

interface SignUpFormProps {
  baseUrl: string;
  fetcher?: typeof globalThis.fetch;
}

export function SignUpForm({ baseUrl, fetcher }: SignUpFormProps) {
  const {
    email,
    password,
    confirmPassword,
    setEmail,
    setPassword,
    setConfirmPassword,
    status,
    errorMessage,
    handleSubmit,
  } = useSignUp(baseUrl, fetcher);

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="sign-up-email">Email</label>
        <input
          id="sign-up-email"
          type="email"
          aria-label="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
      </div>
      <div>
        <label htmlFor="sign-up-password">Password</label>
        <input
          id="sign-up-password"
          type="password"
          aria-label="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
      </div>
      <div>
        <label htmlFor="sign-up-confirm-password">Confirm password</label>
        <input
          id="sign-up-confirm-password"
          type="password"
          aria-label="Confirm password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
        />
      </div>
      {status === 'error' && errorMessage !== null && <div role="alert">{errorMessage}</div>}
      <button type="submit" disabled={status === 'submitting'}>
        Create account
      </button>
      <p>
        <Link href="/login">Already have an account? Sign in</Link>
      </p>
    </form>
  );
}
