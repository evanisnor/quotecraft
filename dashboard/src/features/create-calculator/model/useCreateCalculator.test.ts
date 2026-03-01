import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateCalculator } from './useCreateCalculator';
import { StubApiClient } from '@/shared/api/testing';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('useCreateCalculator', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it('starts in idle state', () => {
    const client = new StubApiClient();

    const { result } = renderHook(() => useCreateCalculator(client));

    expect(result.current.status).toBe('idle');
    expect(result.current.errorMessage).toBeNull();
  });

  it('calls createCalculator and navigates to /editor/{id} on success', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess({
      id: 'new-calc-id',
      name: 'Test',
      created_at: '2024-03-01T00:00:00Z',
      updated_at: '2024-03-01T00:00:00Z',
    });

    const { result } = renderHook(() => useCreateCalculator(client));

    act(() => {
      result.current.handleCreate();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/editor/new-calc-id');
    });

    expect(client.calls).toHaveLength(1);
    expect(client.calls[0]).toEqual({ method: 'POST', path: '/v1/calculators', body: undefined });
  });

  it('sets error state when the API call fails', async () => {
    const client = new StubApiClient();
    client.enqueueError('plan limit reached');

    const { result } = renderHook(() => useCreateCalculator(client));

    act(() => {
      result.current.handleCreate();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.errorMessage).toBe('plan limit reached');
    expect(mockPush).not.toHaveBeenCalled();
  });
});
