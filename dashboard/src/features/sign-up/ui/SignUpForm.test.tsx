import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { AuthProvider } from '@/entities/user';
import { stubFetchWith } from '@/entities/user/api/testing';
import { SignUpForm } from './SignUpForm';

const BASE_URL = 'http://localhost:8080';

function wrapper({ children }: { children: ReactNode }) {
  return createElement(AuthProvider, null, children);
}

describe('SignUpForm', () => {
  it('renders email, password, confirm password inputs and submit button', () => {
    const stub = stubFetchWith([]);

    render(createElement(SignUpForm, { baseUrl: BASE_URL, fetcher: stub.fetch }), { wrapper });

    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    // Use a fetch that never resolves so we can observe the submitting state
    const neverResolving: typeof globalThis.fetch = () => new Promise<Response>(() => undefined);

    const user = userEvent.setup();

    render(createElement(SignUpForm, { baseUrl: BASE_URL, fetcher: neverResolving }), { wrapper });

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();
  });

  it('shows error message when passwords do not match', async () => {
    const stub = stubFetchWith([]);
    const user = userEvent.setup();

    render(createElement(SignUpForm, { baseUrl: BASE_URL, fetcher: stub.fetch }), { wrapper });

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Passwords do not match');
  });

  it('shows error message when registration fails', async () => {
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

    const user = userEvent.setup();

    render(createElement(SignUpForm, { baseUrl: BASE_URL, fetcher: stub.fetch }), { wrapper });

    await user.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('email already registered');
  });
});
