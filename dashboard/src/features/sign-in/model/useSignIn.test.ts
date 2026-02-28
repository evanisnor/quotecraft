import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { AuthProvider, useAuthState } from '@/entities/user';
import { stubFetchWith } from '@/entities/user/api/testing';
import { useSignIn } from './useSignIn';

const BASE_URL = 'http://localhost:8080';

function wrapper({ children }: { children: ReactNode }) {
  return createElement(AuthProvider, null, children);
}

describe('useSignIn', () => {
  it('starts with idle status', () => {
    const stub = stubFetchWith([]);
    const { result } = renderHook(() => useSignIn(BASE_URL, stub.fetch), { wrapper });

    expect(result.current.status).toBe('idle');
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
  });

  it('sets status to submitting during submit then dispatches login_succeeded on success', async () => {
    const stub = stubFetchWith([
      {
        status: 200,
        body: { data: { token: 'tok_abc' }, error: null, meta: {} },
      },
    ]);

    const { result } = renderHook(
      () => ({ signIn: useSignIn(BASE_URL, stub.fetch), authState: useAuthState() }),
      { wrapper },
    );

    act(() => {
      result.current.signIn.setEmail('user@example.com');
      result.current.signIn.setPassword('secret');
    });

    const fakeEvent = { preventDefault: () => undefined } as React.FormEvent;

    act(() => {
      result.current.signIn.handleSubmit(fakeEvent);
    });

    expect(result.current.signIn.status).toBe('submitting');

    await waitFor(() => {
      expect(result.current.authState.status).toBe('authenticated');
    });
  });

  it('sets status to error and errorMessage on API failure', async () => {
    const stub = stubFetchWith([
      {
        status: 401,
        body: {
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'invalid credentials' },
          meta: {},
        },
      },
    ]);

    const { result } = renderHook(() => useSignIn(BASE_URL, stub.fetch), { wrapper });

    const fakeEvent = { preventDefault: () => undefined } as React.FormEvent;

    act(() => {
      result.current.handleSubmit(fakeEvent);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.errorMessage).toBe('invalid credentials');
  });
});
