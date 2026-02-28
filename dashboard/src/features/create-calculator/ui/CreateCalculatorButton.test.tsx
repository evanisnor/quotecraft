import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubFetchWith } from '@/entities/calculator/api/testing';
import { CreateCalculatorButton } from './CreateCalculatorButton';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const BASE_URL = 'http://localhost:8080';
const TOKEN = 'test-token';

describe('CreateCalculatorButton', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it('renders the New Calculator button', () => {
    const stub = stubFetchWith([]);

    render(<CreateCalculatorButton baseUrl={BASE_URL} token={TOKEN} fetcher={stub.fetch} />);

    expect(screen.getByRole('button', { name: /new calculator/i })).toBeInTheDocument();
  });

  it('disables the button while creating', async () => {
    const neverResolving: typeof globalThis.fetch = () => new Promise<Response>(() => undefined);
    const user = userEvent.setup();

    render(<CreateCalculatorButton baseUrl={BASE_URL} token={TOKEN} fetcher={neverResolving} />);

    await user.click(screen.getByRole('button', { name: /new calculator/i }));

    expect(screen.getByRole('button', { name: /new calculator/i })).toBeDisabled();
  });

  it('shows an error alert when creation fails', async () => {
    const stub = stubFetchWith([
      {
        status: 403,
        body: {
          data: null,
          error: { code: 'FORBIDDEN', message: 'plan limit reached' },
          meta: {},
        },
      },
    ]);
    const user = userEvent.setup();

    render(<CreateCalculatorButton baseUrl={BASE_URL} token={TOKEN} fetcher={stub.fetch} />);

    await user.click(screen.getByRole('button', { name: /new calculator/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('plan limit reached');
  });
});
