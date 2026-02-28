import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubFetchWith } from '@/entities/calculator/api/testing';
import { DashboardPage } from './DashboardPage';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const API_BASE_URL = 'http://localhost:8080';
const TOKEN = 'test-token';

const CALC_1 = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  name: 'Calculator Alpha',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

const CALC_2 = {
  id: 'bbbbbbbb-0000-0000-0000-000000000002',
  name: 'Calculator Beta',
  created_at: '2024-02-01T00:00:00Z',
  updated_at: '2024-02-02T00:00:00Z',
};

function listSuccessResponse(calculators: (typeof CALC_1)[]) {
  return { status: 200, body: { data: calculators, error: null, meta: {} } };
}

function deleteSuccessResponse() {
  return { status: 204, body: null };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it('shows loading state initially', () => {
    // Never resolves so we can observe the loading state
    const neverResolving: typeof globalThis.fetch = () => new Promise<Response>(() => undefined);

    render(<DashboardPage apiBaseUrl={API_BASE_URL} token={TOKEN} fetcher={neverResolving} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /my calculators/i })).toBeInTheDocument();
  });

  it('shows calculator list after successful load', async () => {
    const stub = stubFetchWith([listSuccessResponse([CALC_1, CALC_2])]);

    render(<DashboardPage apiBaseUrl={API_BASE_URL} token={TOKEN} fetcher={stub.fetch} />);

    await waitFor(() => {
      expect(screen.getByText('Calculator Alpha')).toBeInTheDocument();
    });

    expect(screen.getByText('Calculator Beta')).toBeInTheDocument();
  });

  it('shows empty state when no calculators exist', async () => {
    const stub = stubFetchWith([listSuccessResponse([])]);

    render(<DashboardPage apiBaseUrl={API_BASE_URL} token={TOKEN} fetcher={stub.fetch} />);

    await waitFor(() => {
      expect(screen.getByText('No calculators yet. Create your first one.')).toBeInTheDocument();
    });
  });

  it('shows error when the API call fails', async () => {
    const stub = stubFetchWith([
      {
        status: 500,
        body: {
          data: null,
          error: { code: 'INTERNAL_ERROR', message: 'server unavailable' },
          meta: {},
        },
      },
    ]);

    render(<DashboardPage apiBaseUrl={API_BASE_URL} token={TOKEN} fetcher={stub.fetch} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('server unavailable');
    });
  });

  it('renders the New Calculator button', async () => {
    const stub = stubFetchWith([listSuccessResponse([])]);

    render(<DashboardPage apiBaseUrl={API_BASE_URL} token={TOKEN} fetcher={stub.fetch} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new calculator/i })).toBeInTheDocument();
    });
  });

  it('navigates to /editor/{id} when Open is clicked on a calculator card', async () => {
    const stub = stubFetchWith([listSuccessResponse([CALC_1])]);
    const user = userEvent.setup();

    render(<DashboardPage apiBaseUrl={API_BASE_URL} token={TOKEN} fetcher={stub.fetch} />);

    await waitFor(() => {
      expect(screen.getByText('Calculator Alpha')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /open/i }));

    expect(mockPush).toHaveBeenCalledWith(`/editor/${CALC_1.id}`);
  });

  it('shows confirmation dialog when Delete is clicked on a calculator card', async () => {
    const stub = stubFetchWith([listSuccessResponse([CALC_1])]);
    const user = userEvent.setup();

    render(<DashboardPage apiBaseUrl={API_BASE_URL} token={TOKEN} fetcher={stub.fetch} />);

    await waitFor(() => {
      expect(screen.getByText('Calculator Alpha')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(screen.getByRole('dialog', { name: /confirm deletion/i })).toBeInTheDocument();
    expect(screen.getByText('Delete this calculator? This cannot be undone.')).toBeInTheDocument();
  });

  it('removes the calculator from the list after confirming deletion', async () => {
    // First call: list; second call: delete
    const stub = stubFetchWith([listSuccessResponse([CALC_1, CALC_2]), deleteSuccessResponse()]);
    const user = userEvent.setup();

    render(<DashboardPage apiBaseUrl={API_BASE_URL} token={TOKEN} fetcher={stub.fetch} />);

    await waitFor(() => {
      expect(screen.getByText('Calculator Alpha')).toBeInTheDocument();
    });

    // Click Delete on the first calculator card
    const firstCard = screen.getByRole('article', { name: /calculator alpha/i });
    await user.click(within(firstCard).getByRole('button', { name: /^delete$/i }));

    // Confirmation dialog appears — click "Delete" within the dialog
    const dialog = screen.getByRole('dialog', { name: /confirm deletion/i });
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.queryByText('Calculator Alpha')).not.toBeInTheDocument();
    });

    // The second calculator should still be visible
    expect(screen.getByText('Calculator Beta')).toBeInTheDocument();
  });

  it('dismisses the confirmation dialog and keeps the calculator when Cancel is clicked', async () => {
    const stub = stubFetchWith([listSuccessResponse([CALC_1])]);
    const user = userEvent.setup();

    render(<DashboardPage apiBaseUrl={API_BASE_URL} token={TOKEN} fetcher={stub.fetch} />);

    await waitFor(() => {
      expect(screen.getByText('Calculator Alpha')).toBeInTheDocument();
    });

    // Open the confirmation dialog
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByRole('dialog', { name: /confirm deletion/i })).toBeInTheDocument();

    // Click Cancel — dialog should disappear, calculator should remain
    const dialog = screen.getByRole('dialog', { name: /confirm deletion/i });
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Calculator Alpha')).toBeInTheDocument();
  });
});
