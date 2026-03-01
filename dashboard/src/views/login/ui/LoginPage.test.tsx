import { render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/entities/user';
import { LocalStorageStub } from '@/entities/user/model/testing';
import { LoginPage } from './LoginPage';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockReplace.mockReset();
  });

  it('does not redirect when unauthenticated', async () => {
    const stub = new LocalStorageStub();
    Object.defineProperty(window, 'localStorage', { value: stub, writable: true });

    render(
      <Wrapper>
        <LoginPage apiBaseUrl="http://localhost:8080" />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('redirects to /dashboard when auth state is authenticated', async () => {
    const stub = new LocalStorageStub();
    stub.setItem('auth_token', 'stored-token');
    Object.defineProperty(window, 'localStorage', { value: stub, writable: true });

    render(
      <Wrapper>
        <LoginPage apiBaseUrl="http://localhost:8080" />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });
});
