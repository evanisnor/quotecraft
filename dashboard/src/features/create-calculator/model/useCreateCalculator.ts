'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiClient } from '@/shared/api';
import { createCalculator } from '@/entities/calculator';

type CreateStatus = 'idle' | 'creating' | 'error';

interface UseCreateCalculatorResult {
  status: CreateStatus;
  errorMessage: string | null;
  handleCreate: () => void;
}

export function useCreateCalculator(client: ApiClient): UseCreateCalculatorResult {
  const router = useRouter();
  const [status, setStatus] = useState<CreateStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleCreate(): void {
    setStatus('creating');
    setErrorMessage(null);

    createCalculator(client)
      .then((calculator) => {
        router.push(`/editor/${calculator.id}`);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setStatus('error');
        setErrorMessage(message);
      });
  }

  return { status, errorMessage, handleCreate };
}
