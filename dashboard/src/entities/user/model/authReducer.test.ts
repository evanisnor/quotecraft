import { authReducer } from './authReducer';
import type { AuthState } from './types';

describe('authReducer', () => {
  describe('auth_initialized', () => {
    it('transitions to authenticated when a token is provided', () => {
      const state: AuthState = { status: 'loading' };
      const result = authReducer(state, { type: 'auth_initialized', token: 'abc123' });

      expect(result).toEqual({ status: 'authenticated', token: 'abc123' });
    });

    it('transitions to unauthenticated when no token is provided', () => {
      const state: AuthState = { status: 'loading' };
      const result = authReducer(state, { type: 'auth_initialized' });

      expect(result).toEqual({ status: 'unauthenticated' });
    });

    it('transitions to unauthenticated when token is undefined', () => {
      const state: AuthState = { status: 'loading' };
      const result = authReducer(state, { type: 'auth_initialized', token: undefined });

      expect(result).toEqual({ status: 'unauthenticated' });
    });

    it('transitions to authenticated from unauthenticated state when token is provided', () => {
      const state: AuthState = { status: 'unauthenticated' };
      const result = authReducer(state, { type: 'auth_initialized', token: 'abc123' });

      expect(result).toEqual({ status: 'authenticated', token: 'abc123' });
    });

    it('transitions to unauthenticated from authenticated state when no token is provided', () => {
      const state: AuthState = { status: 'authenticated', token: 'old-token' };
      const result = authReducer(state, { type: 'auth_initialized' });

      expect(result).toEqual({ status: 'unauthenticated' });
    });
  });

  describe('login_succeeded', () => {
    it('transitions to authenticated with the provided token', () => {
      const state: AuthState = { status: 'unauthenticated' };
      const result = authReducer(state, { type: 'login_succeeded', token: 'token-xyz' });

      expect(result).toEqual({ status: 'authenticated', token: 'token-xyz' });
    });

    it('transitions to authenticated from loading state', () => {
      const state: AuthState = { status: 'loading' };
      const result = authReducer(state, { type: 'login_succeeded', token: 'token-xyz' });

      expect(result).toEqual({ status: 'authenticated', token: 'token-xyz' });
    });

    it('replaces the existing token when already authenticated', () => {
      const state: AuthState = { status: 'authenticated', token: 'old-token' };
      const result = authReducer(state, { type: 'login_succeeded', token: 'new-token' });

      expect(result).toEqual({ status: 'authenticated', token: 'new-token' });
    });
  });

  describe('logout', () => {
    it('transitions to unauthenticated from authenticated state', () => {
      const state: AuthState = { status: 'authenticated', token: 'some-token' };
      const result = authReducer(state, { type: 'logout' });

      expect(result).toEqual({ status: 'unauthenticated' });
    });

    it('remains unauthenticated when already unauthenticated', () => {
      const state: AuthState = { status: 'unauthenticated' };
      const result = authReducer(state, { type: 'logout' });

      expect(result).toEqual({ status: 'unauthenticated' });
    });

    it('transitions to unauthenticated from loading state', () => {
      const state: AuthState = { status: 'loading' };
      const result = authReducer(state, { type: 'logout' });

      expect(result).toEqual({ status: 'unauthenticated' });
    });
  });
});
