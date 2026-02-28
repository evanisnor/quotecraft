'use client';

import { useState } from 'react';
import { deleteCalculator } from '@/entities/calculator';

interface UseDeleteCalculatorResult {
  confirmingId: string | null;
  deletingId: string | null;
  errorMessage: string | null;
  requestDelete: (id: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
}

export function useDeleteCalculator(
  baseUrl: string,
  token: string,
  onDeleted: (id: string) => void,
  fetcher: typeof globalThis.fetch = globalThis.fetch,
): UseDeleteCalculatorResult {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function requestDelete(id: string): void {
    setConfirmingId(id);
    setErrorMessage(null);
  }

  function cancelDelete(): void {
    setConfirmingId(null);
  }

  function confirmDelete(): void {
    if (confirmingId === null) return;

    const idToDelete = confirmingId;
    setDeletingId(idToDelete);
    setConfirmingId(null);

    deleteCalculator(baseUrl, idToDelete, token, fetcher)
      .then(() => {
        setDeletingId(null);
        onDeleted(idToDelete);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setDeletingId(null);
        setErrorMessage(message);
      });
  }

  return { confirmingId, deletingId, errorMessage, requestDelete, confirmDelete, cancelDelete };
}
