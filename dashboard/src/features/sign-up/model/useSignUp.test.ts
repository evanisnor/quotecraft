import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { AuthProvider, useAuthState } from '@/entities/user';
import { stubFetchWith } from '@/entities/user/api/testing';
import { useSignUp } from './useSignUp';

const BASE_URL = 'http://localhost:8080';

function wrapper({ children }: { children: ReactNode }) {
  return createElement(AuthProvider, null, children);
}

describe('useSignUp', () => {
  it('starts with idle status', () => {
    const stub = stubFetchWith([]);
    const { result } = renderHook(() => useSignUp(BASE_URL, stub.fetch), { wrapper });

    expect(result.current.status).toBe('idle');
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.confirmPassword).toBe('');
  });

  it('sets status to error with password mismatch message without calling API', async () => {
    const stub = stubFetchWith([]);
    const { result } = renderHook(() => useSignUp(BASE_URL, stub.fetch), { wrapper });

    act(() => {
      result.current.setEmail('user@example.com');
      result.current.setPassword('password123');
      result.current.setConfirmPassword('different');
    });

    const fakeEvent = { preventDefault: () => undefined } as React.FormEvent;

    act(() => {
      result.current.handleSubmit(fakeEvent);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('Passwords do not match');
    expect(stub.calls).toBe(0);
  });

  it('sets status to submitting during submit then dispatches login_succeeded on success', async () => {
    const stub = stubFetchWith([
      {
        status: 201,
        body: { data: { token: 'tok_register' }, error: null, meta: {} },
      },
    ]);

    const { result } = renderHook(
      () => ({ signUp: useSignUp(BASE_URL, stub.fetch), authState: useAuthState() }),
      { wrapper },
    );

    act(() => {
      result.current.signUp.setEmail('newuser@example.com');
      result.current.signUp.setPassword('password123');
      result.current.signUp.setConfirmPassword('password123');
    });

    const fakeEvent = { preventDefault: () => undefined } as React.FormEvent;

    act(() => {
      result.current.signUp.handleSubmit(fakeEvent);
    });

    expect(result.current.signUp.status).toBe('submitting');

    await waitFor(() => {
      expect(result.current.authState.status).toBe('authenticated');
    });
  });

  it('sets status to error and errorMessage on API failure', async () => {
    const stub = stubFetchWith([
      {
        status: 409,
        body: {
          data: null,
          error: { code: 'CONFLICT', message: 'email already registered' },
          meta: {},
        },
      },
    ]);

    const { result } = renderHook(() => useSignUp(BASE_URL, stub.fetch), { wrapper });

    act(() => {
      result.current.setEmail('taken@example.com');
      result.current.setPassword('password123');
      result.current.setConfirmPassword('password123');
    });

    const fakeEvent = { preventDefault: () => undefined } as React.FormEvent;

    act(() => {
      result.current.handleSubmit(fakeEvent);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.errorMessage).toBe('email already registered');
  });
});
