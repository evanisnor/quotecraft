import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiClient } from '@/shared/api';
import type { CalculatorEditorConfig } from '@/shared/config';
import { updateCalculatorConfig } from '@/entities/calculator';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEFAULT_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

export interface UseAutoSaveResult {
  status: SaveStatus;
  save: () => void;
}

/**
 * useAutoSave debounces changes to `config` and PUTs them to the API after
 * `delayMs` milliseconds of inactivity. It also exposes a `save` function for
 * manual saves. On failure, it retries up to MAX_RETRIES times with
 * exponential backoff before surfacing an error status.
 *
 * The initial render does NOT trigger a save — only subsequent config changes do.
 */
export function useAutoSave(
  client: ApiClient,
  calculatorId: string,
  config: CalculatorEditorConfig,
  delayMs: number = DEFAULT_DELAY_MS,
): UseAutoSaveResult {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const isFirstRender = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef<CalculatorEditorConfig>(config);
  const clientRef = useRef<ApiClient>(client);
  const calculatorIdRef = useRef<string>(calculatorId);
  const isSaving = useRef(false);

  // Keep refs in sync so the save callback always uses the latest values
  // without being recreated on every render.
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    clientRef.current = client;
  }, [client]);

  useEffect(() => {
    calculatorIdRef.current = calculatorId;
  }, [calculatorId]);

  const performSave = useCallback(async (): Promise<void> => {
    if (isSaving.current) return;
    isSaving.current = true;
    setStatus('saving');

    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      try {
        await updateCalculatorConfig(clientRef.current, calculatorIdRef.current, configRef.current);
        setStatus('saved');
        isSaving.current = false;
        return;
      } catch {
        attempt++;
        if (attempt > MAX_RETRIES) {
          setStatus('error');
          isSaving.current = false;
          return;
        }
        // Exponential backoff: 1s, 2s, 4s
        await new Promise<void>((resolve) =>
          setTimeout(resolve, RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)),
        );
      }
    }
  }, []);

  // Debounce: whenever config changes (after the first render), schedule a save.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      void performSave();
    }, delayMs);

    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [config, delayMs, performSave]);

  const save = useCallback((): void => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    void performSave();
  }, [performSave]);

  return { status, save };
}
