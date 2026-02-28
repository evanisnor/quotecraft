import { renderHook, act, waitFor } from '@testing-library/react';
import { useCreateCalculator } from './useCreateCalculator';
import { stubFetchWith } from '@/entities/calculator/api/testing';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const BASE_URL = 'http://localhost:8080';
const TOKEN = 'test-token';

describe('useCreateCalculator', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it('starts in idle state', () => {
    const stub = stubFetchWith([]);

    const { result } = renderHook(() => useCreateCalculator(BASE_URL, TOKEN, stub.fetch));

    expect(result.current.status).toBe('idle');
    expect(result.current.errorMessage).toBeNull();
  });

  it('calls createCalculator and navigates to /editor/{id} on success', async () => {
    const stub = stubFetchWith([
      {
        status: 201,
        body: {
          data: {
            id: 'new-calc-id',
            created_at: '2024-03-01T00:00:00Z',
            updated_at: '2024-03-01T00:00:00Z',
          },
          error: null,
          meta: {},
        },
      },
    ]);

    const { result } = renderHook(() => useCreateCalculator(BASE_URL, TOKEN, stub.fetch));

    act(() => {
      result.current.handleCreate();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/editor/new-calc-id');
    });

    expect(stub.calls).toBe(1);
  });

  it('sets error state when the API call fails', async () => {
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

    const { result } = renderHook(() => useCreateCalculator(BASE_URL, TOKEN, stub.fetch));

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
