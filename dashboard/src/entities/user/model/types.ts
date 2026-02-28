export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; token: string };

export type AuthAction =
  | { type: 'auth_initialized'; token?: string }
  | { type: 'login_succeeded'; token: string }
  | { type: 'logout' };
