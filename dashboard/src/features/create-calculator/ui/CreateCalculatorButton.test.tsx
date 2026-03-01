import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StubApiClient } from '@/shared/api/testing';
import { CreateCalculatorButton } from './CreateCalculatorButton';
import type { ApiClient } from '@/shared/api';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('CreateCalculatorButton', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it('renders the New Calculator button', () => {
    const client = new StubApiClient();

    render(<CreateCalculatorButton client={client} />);

    expect(screen.getByRole('button', { name: /new calculator/i })).toBeInTheDocument();
  });

  it('disables the button while creating', async () => {
    const neverResolvingPost: ApiClient = {
      get: () => new Promise(() => undefined),
      post: () => new Promise(() => undefined),
      put: () => new Promise(() => undefined),
      delete: () => new Promise(() => undefined),
    };

    const user = userEvent.setup();

    render(<CreateCalculatorButton client={neverResolvingPost} />);

    await user.click(screen.getByRole('button', { name: /new calculator/i }));

    expect(screen.getByRole('button', { name: /new calculator/i })).toBeDisabled();
  });

  it('shows an error alert when creation fails', async () => {
    const client = new StubApiClient();
    client.enqueueError('plan limit reached');
    const user = userEvent.setup();

    render(<CreateCalculatorButton client={client} />);

    await user.click(screen.getByRole('button', { name: /new calculator/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('plan limit reached');
  });
});
