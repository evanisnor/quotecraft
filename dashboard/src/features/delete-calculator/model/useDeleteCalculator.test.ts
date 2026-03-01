import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeleteCalculator } from './useDeleteCalculator';
import { StubApiClient } from '@/shared/api/testing';

describe('useDeleteCalculator', () => {
  it('requestDelete sets confirmingId', () => {
    const client = new StubApiClient();
    const onDeleted = jest.fn();

    const { result } = renderHook(() => useDeleteCalculator(client, onDeleted));

    expect(result.current.confirmingId).toBeNull();

    act(() => {
      result.current.requestDelete('calc-abc');
    });

    expect(result.current.confirmingId).toBe('calc-abc');
  });

  it('cancelDelete clears confirmingId', () => {
    const client = new StubApiClient();
    const onDeleted = jest.fn();

    const { result } = renderHook(() => useDeleteCalculator(client, onDeleted));

    act(() => {
      result.current.requestDelete('calc-abc');
    });

    expect(result.current.confirmingId).toBe('calc-abc');

    act(() => {
      result.current.cancelDelete();
    });

    expect(result.current.confirmingId).toBeNull();
  });

  it('confirmDelete calls the API and calls onDeleted with the id on success', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess(undefined);
    const onDeleted = jest.fn();

    const { result } = renderHook(() => useDeleteCalculator(client, onDeleted));

    act(() => {
      result.current.requestDelete('calc-to-delete');
    });

    act(() => {
      result.current.confirmDelete();
    });

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledWith('calc-to-delete');
    });

    expect(client.calls).toHaveLength(1);
    expect(client.calls[0]).toEqual({ method: 'DELETE', path: '/v1/calculators/calc-to-delete' });
    expect(result.current.confirmingId).toBeNull();
    expect(result.current.deletingId).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('confirmDelete sets error state on failure', async () => {
    const client = new StubApiClient();
    client.enqueueError('calculator not found');
    const onDeleted = jest.fn();

    const { result } = renderHook(() => useDeleteCalculator(client, onDeleted));

    act(() => {
      result.current.requestDelete('bad-id');
    });

    act(() => {
      result.current.confirmDelete();
    });

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('calculator not found');
    });

    expect(onDeleted).not.toHaveBeenCalled();
    expect(result.current.deletingId).toBeNull();
  });

  it('confirmDelete does nothing when confirmingId is null', () => {
    const client = new StubApiClient();
    const onDeleted = jest.fn();

    const { result } = renderHook(() => useDeleteCalculator(client, onDeleted));

    // confirmDelete without prior requestDelete — confirmingId is null
    act(() => {
      result.current.confirmDelete();
    });

    expect(client.calls).toHaveLength(0);
    expect(onDeleted).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBeNull();
  });
});
