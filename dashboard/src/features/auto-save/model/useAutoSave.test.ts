import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';
import { StubApiClient } from '@/shared/api/testing';
import { DEFAULT_THEME } from '@/shared/config';
import type { CalculatorEditorConfig } from '@/shared/config';

const EMPTY_CONFIG: CalculatorEditorConfig = {
  fields: [],
  outputs: [],
  layoutMode: 'single-page',
  steps: [],
  theme: DEFAULT_THEME,
};
const DELAY_MS = 500;

function makeConfig(id: string): CalculatorEditorConfig {
  return {
    fields: [{ id, type: 'number', label: 'Count', required: false, variableName: 'count' }],
    outputs: [],
    layoutMode: 'single-page',
    steps: [],
    theme: DEFAULT_THEME,
  };
}

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with idle status', () => {
    const client = new StubApiClient();
    const { result } = renderHook(() => useAutoSave(client, 'calc-1', EMPTY_CONFIG, DELAY_MS));

    expect(result.current.status).toBe('idle');
  });

  it('does not save on the initial render', () => {
    const client = new StubApiClient();
    renderHook(() => useAutoSave(client, 'calc-1', EMPTY_CONFIG, DELAY_MS));

    act(() => {
      jest.runAllTimers();
    });

    expect(client.calls).toHaveLength(0);
  });

  it('transitions to saving then saved after config changes and debounce fires', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess({});

    const { result, rerender } = renderHook(
      ({ config }: { config: CalculatorEditorConfig }) =>
        useAutoSave(client, 'calc-1', config, DELAY_MS),
      { initialProps: { config: EMPTY_CONFIG } },
    );

    rerender({ config: makeConfig('f1') });

    expect(result.current.status).toBe('idle');

    await act(async () => {
      jest.advanceTimersByTime(DELAY_MS);
      // Allow the async save to settle
      await Promise.resolve();
    });

    expect(result.current.status).toBe('saved');
    expect(client.calls).toHaveLength(1);
    expect(client.calls[0].method).toBe('PUT');
    expect(client.calls[0].path).toBe('/v1/calculators/calc-1');
  });

  it('debounces: only one PUT when config changes multiple times within the delay', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess({});

    const { rerender } = renderHook(
      ({ config }: { config: CalculatorEditorConfig }) =>
        useAutoSave(client, 'calc-1', config, DELAY_MS),
      { initialProps: { config: EMPTY_CONFIG } },
    );

    rerender({ config: makeConfig('f1') });
    jest.advanceTimersByTime(DELAY_MS / 2);

    rerender({ config: makeConfig('f2') });
    jest.advanceTimersByTime(DELAY_MS / 2);

    rerender({ config: makeConfig('f3') });

    await act(async () => {
      jest.advanceTimersByTime(DELAY_MS);
      await Promise.resolve();
    });

    expect(client.calls).toHaveLength(1);
  });

  it('sends the latest config when debounce fires after multiple rapid changes', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess({});

    const finalConfig = makeConfig('f3');

    const { rerender } = renderHook(
      ({ config }: { config: CalculatorEditorConfig }) =>
        useAutoSave(client, 'calc-1', config, DELAY_MS),
      { initialProps: { config: EMPTY_CONFIG } },
    );

    rerender({ config: makeConfig('f1') });
    rerender({ config: makeConfig('f2') });
    rerender({ config: finalConfig });

    await act(async () => {
      jest.advanceTimersByTime(DELAY_MS);
      await Promise.resolve();
    });

    expect(client.calls[0].body).toEqual({ config: finalConfig });
  });

  it('uses the calculatorId in the PUT path', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess({});

    const { rerender } = renderHook(
      ({ config }: { config: CalculatorEditorConfig }) =>
        useAutoSave(client, 'my-calculator-id', config, DELAY_MS),
      { initialProps: { config: EMPTY_CONFIG } },
    );

    rerender({ config: makeConfig('f1') });

    await act(async () => {
      jest.advanceTimersByTime(DELAY_MS);
      await Promise.resolve();
    });

    expect(client.calls[0].path).toBe('/v1/calculators/my-calculator-id');
  });

  it('manual save triggers immediately without waiting for the debounce', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess({});

    const { result, rerender } = renderHook(
      ({ config }: { config: CalculatorEditorConfig }) =>
        useAutoSave(client, 'calc-1', config, DELAY_MS),
      { initialProps: { config: EMPTY_CONFIG } },
    );

    rerender({ config: makeConfig('f1') });

    // Trigger save manually before the debounce fires
    await act(async () => {
      result.current.save();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('saved');
    expect(client.calls).toHaveLength(1);
  });

  it('manual save cancels the pending debounce so only one PUT is sent', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess({});

    const { result, rerender } = renderHook(
      ({ config }: { config: CalculatorEditorConfig }) =>
        useAutoSave(client, 'calc-1', config, DELAY_MS),
      { initialProps: { config: EMPTY_CONFIG } },
    );

    rerender({ config: makeConfig('f1') });

    await act(async () => {
      result.current.save();
      await Promise.resolve();
    });

    // Let the debounce timer that was cancelled fire — should be a no-op
    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
    });

    expect(client.calls).toHaveLength(1);
  });

  it('retries on failure up to MAX_RETRIES times before setting error status', async () => {
    const client = new StubApiClient();
    // Fail all 4 attempts (initial + 3 retries)
    client.enqueueError('network error');
    client.enqueueError('network error');
    client.enqueueError('network error');
    client.enqueueError('network error');

    const { result, rerender } = renderHook(
      ({ config }: { config: CalculatorEditorConfig }) =>
        useAutoSave(client, 'calc-1', config, DELAY_MS),
      { initialProps: { config: EMPTY_CONFIG } },
    );

    rerender({ config: makeConfig('f1') });

    await act(async () => {
      jest.advanceTimersByTime(DELAY_MS);
      // runAllTimersAsync repeatedly flushes timers + microtasks until none remain,
      // which handles the sequential backoff setTimeout calls created by each retry.
      await jest.runAllTimersAsync();
    });

    expect(result.current.status).toBe('error');
    expect(client.calls).toHaveLength(4);
  });

  it('recovers to saved if a retry succeeds', async () => {
    const client = new StubApiClient();
    client.enqueueError('transient error');
    client.enqueueSuccess({});

    const { result, rerender } = renderHook(
      ({ config }: { config: CalculatorEditorConfig }) =>
        useAutoSave(client, 'calc-1', config, DELAY_MS),
      { initialProps: { config: EMPTY_CONFIG } },
    );

    rerender({ config: makeConfig('f1') });

    await act(async () => {
      jest.advanceTimersByTime(DELAY_MS);
      await jest.runAllTimersAsync();
    });

    expect(result.current.status).toBe('saved');
    expect(client.calls).toHaveLength(2);
  });
});
