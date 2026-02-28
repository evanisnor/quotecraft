import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeleteCalculator } from './useDeleteCalculator';
import { stubFetchWith } from '@/entities/calculator/api/testing';

const BASE_URL = 'http://localhost:8080';
const TOKEN = 'test-token';

describe('useDeleteCalculator', () => {
  it('requestDelete sets confirmingId', () => {
    const stub = stubFetchWith([]);
    const onDeleted = jest.fn();

    const { result } = renderHook(() =>
      useDeleteCalculator(BASE_URL, TOKEN, onDeleted, stub.fetch),
    );

    expect(result.current.confirmingId).toBeNull();

    act(() => {
      result.current.requestDelete('calc-abc');
    });

    expect(result.current.confirmingId).toBe('calc-abc');
  });

  it('cancelDelete clears confirmingId', () => {
    const stub = stubFetchWith([]);
    const onDeleted = jest.fn();

    const { result } = renderHook(() =>
      useDeleteCalculator(BASE_URL, TOKEN, onDeleted, stub.fetch),
    );

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
    const stub = stubFetchWith([{ status: 204, body: null }]);
    const onDeleted = jest.fn();

    const { result } = renderHook(() =>
      useDeleteCalculator(BASE_URL, TOKEN, onDeleted, stub.fetch),
    );

    act(() => {
      result.current.requestDelete('calc-to-delete');
    });

    act(() => {
      result.current.confirmDelete();
    });

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledWith('calc-to-delete');
    });

    expect(stub.calls).toBe(1);
    expect(result.current.confirmingId).toBeNull();
    expect(result.current.deletingId).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('confirmDelete sets error state on failure', async () => {
    const stub = stubFetchWith([
      {
        status: 404,
        body: {
          data: null,
          error: { code: 'NOT_FOUND', message: 'calculator not found' },
          meta: {},
        },
      },
    ]);
    const onDeleted = jest.fn();

    const { result } = renderHook(() =>
      useDeleteCalculator(BASE_URL, TOKEN, onDeleted, stub.fetch),
    );

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
});
