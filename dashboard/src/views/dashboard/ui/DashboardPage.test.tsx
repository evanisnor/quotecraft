import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StubApiClient } from '@/shared/api/testing';
import { DashboardPage } from './DashboardPage';
import type { ApiClient } from '@/shared/api';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

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

/** Creates a client whose get() never resolves (for observing loading state) */
function neverResolvingClient(): ApiClient {
  return {
    get: () => new Promise(() => undefined),
    post: () => new Promise(() => undefined),
    put: () => new Promise(() => undefined),
    delete: () => new Promise(() => undefined),
  };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it('shows loading state initially', () => {
    render(<DashboardPage client={neverResolvingClient()} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /my calculators/i })).toBeInTheDocument();
  });

  it('shows calculator list after successful load', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess([CALC_1, CALC_2]);

    render(<DashboardPage client={client} />);

    await waitFor(() => {
      expect(screen.getByText('Calculator Alpha')).toBeInTheDocument();
    });

    expect(screen.getByText('Calculator Beta')).toBeInTheDocument();
  });

  it('shows empty state when no calculators exist', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess([]);

    render(<DashboardPage client={client} />);

    await waitFor(() => {
      expect(screen.getByText('No calculators yet. Create your first one.')).toBeInTheDocument();
    });
  });

  it('shows error when the API call fails', async () => {
    const client = new StubApiClient();
    client.enqueueError('server unavailable');

    render(<DashboardPage client={client} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('server unavailable');
    });
  });

  it('renders the New Calculator button', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess([]);

    render(<DashboardPage client={client} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new calculator/i })).toBeInTheDocument();
    });
  });

  it('navigates to /editor/{id} when Open is clicked on a calculator card', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess([CALC_1]);
    const user = userEvent.setup();

    render(<DashboardPage client={client} />);

    await waitFor(() => {
      expect(screen.getByText('Calculator Alpha')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /open/i }));

    expect(mockPush).toHaveBeenCalledWith(`/editor/${CALC_1.id}`);
  });

  it('shows confirmation dialog when Delete is clicked on a calculator card', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess([CALC_1]);
    const user = userEvent.setup();

    render(<DashboardPage client={client} />);

    await waitFor(() => {
      expect(screen.getByText('Calculator Alpha')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(screen.getByRole('dialog', { name: /confirm deletion/i })).toBeInTheDocument();
    expect(screen.getByText('Delete this calculator? This cannot be undone.')).toBeInTheDocument();
  });

  it('removes the calculator from the list after confirming deletion', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess([CALC_1, CALC_2]);
    client.enqueueSuccess(undefined); // delete response
    const user = userEvent.setup();

    render(<DashboardPage client={client} />);

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
    const client = new StubApiClient();
    client.enqueueSuccess([CALC_1]);
    const user = userEvent.setup();

    render(<DashboardPage client={client} />);

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
