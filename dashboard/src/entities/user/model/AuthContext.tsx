'use client';

import { createContext, useContext, useEffect, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { authReducer } from './authReducer';
import type { AuthAction, AuthState } from './types';

const AUTH_TOKEN_KEY = 'auth_token';

const AuthStateContext = createContext<AuthState | null>(null);
const AuthDispatchContext = createContext<Dispatch<AuthAction> | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, { status: 'loading' });

  // Hydrate auth state from localStorage on mount (client-side only)
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) ?? undefined;
    dispatch({ type: 'auth_initialized', token });
  }, []);

  // Sync localStorage when auth state changes
  useEffect(() => {
    if (state.status === 'authenticated') {
      localStorage.setItem(AUTH_TOKEN_KEY, state.token);
    } else if (state.status === 'unauthenticated') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, [state]);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>{children}</AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
}

export function useAuthState(): AuthState {
  const context = useContext(AuthStateContext);
  if (context === null) {
    throw new Error('useAuthState must be used within AuthProvider');
  }
  return context;
}

export function useAuthDispatch(): Dispatch<AuthAction> {
  const context = useContext(AuthDispatchContext);
  if (context === null) {
    throw new Error('useAuthDispatch must be used within AuthProvider');
  }
  return context;
}
