import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { AuthProvider } from '@/entities/user';
import { stubFetchWith } from '@/entities/user/api/testing';
import { SignInForm } from './SignInForm';

const BASE_URL = 'http://localhost:8080';

function wrapper({ children }: { children: ReactNode }) {
  return createElement(AuthProvider, null, children);
}

describe('SignInForm', () => {
  it('renders email and password inputs and submit button', () => {
    const stub = stubFetchWith([]);

    render(createElement(SignInForm, { baseUrl: BASE_URL, fetcher: stub.fetch }), { wrapper });

    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    // Use a fetch that never resolves so we can observe the submitting state
    const neverResolving: typeof globalThis.fetch = () => new Promise<Response>(() => undefined);

    const user = userEvent.setup();

    render(createElement(SignInForm, { baseUrl: BASE_URL, fetcher: neverResolving }), { wrapper });

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('shows error message when sign in fails', async () => {
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

    const user = userEvent.setup();

    render(createElement(SignInForm, { baseUrl: BASE_URL, fetcher: stub.fetch }), { wrapper });

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('invalid credentials');
  });
});
