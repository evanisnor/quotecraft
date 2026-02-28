import { render, renderHook, act, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuthDispatch, useAuthState } from './AuthContext';
import { LocalStorageStub } from './testing';

describe('AuthProvider', () => {
  let localStorageStub: LocalStorageStub;

  beforeEach(() => {
    localStorageStub = new LocalStorageStub();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageStub,
      writable: true,
    });
  });

  it('transitions to unauthenticated when localStorage has no token', async () => {
    const { result } = renderHook(() => useAuthState(), {
      wrapper: ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });
  });

  it('transitions to authenticated when localStorage has a token', async () => {
    localStorageStub.setItem('auth_token', 'stored-token');

    const { result } = renderHook(() => useAuthState(), {
      wrapper: ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    if (result.current.status === 'authenticated') {
      expect(result.current.token).toBe('stored-token');
    }
  });

  it('persists token to localStorage on login_succeeded', async () => {
    const { result } = renderHook(() => ({ state: useAuthState(), dispatch: useAuthDispatch() }), {
      wrapper: ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('unauthenticated');
    });

    act(() => {
      result.current.dispatch({ type: 'login_succeeded', token: 'new-token' });
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('authenticated');
    });

    expect(localStorageStub.getItem('auth_token')).toBe('new-token');
  });

  it('clears token from localStorage on logout', async () => {
    localStorageStub.setItem('auth_token', 'existing-token');

    const { result } = renderHook(() => ({ state: useAuthState(), dispatch: useAuthDispatch() }), {
      wrapper: ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('authenticated');
    });

    act(() => {
      result.current.dispatch({ type: 'logout' });
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('unauthenticated');
    });

    expect(localStorageStub.getItem('auth_token')).toBeNull();
  });

  it('renders children', async () => {
    render(
      <AuthProvider>
        <span>child content</span>
      </AuthProvider>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});

describe('useAuthState', () => {
  it('throws when used outside AuthProvider', () => {
    // Suppress console.error for this expected error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuthState());
    }).toThrow('useAuthState must be used within AuthProvider');

    consoleSpy.mockRestore();
  });
});

describe('useAuthDispatch', () => {
  it('throws when used outside AuthProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuthDispatch());
    }).toThrow('useAuthDispatch must be used within AuthProvider');

    consoleSpy.mockRestore();
  });
});
