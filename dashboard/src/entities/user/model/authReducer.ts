import type { AuthAction, AuthState } from './types';

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'auth_initialized':
      if (action.token) {
        return { status: 'authenticated', token: action.token };
      }
      return { status: 'unauthenticated' };

    case 'login_succeeded':
      return { status: 'authenticated', token: action.token };

    case 'logout':
      return { status: 'unauthenticated' };
  }
}
