'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listCalculators, CalculatorCard } from '@/entities/calculator';
import type { CalculatorSummary } from '@/entities/calculator';
import { CreateCalculatorButton } from '@/features/create-calculator';
import { useDeleteCalculator, DeleteConfirmDialog } from '@/features/delete-calculator';

interface DashboardPageProps {
  apiBaseUrl: string;
  token: string;
  fetcher?: typeof globalThis.fetch;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; calculators: CalculatorSummary[] };

export function DashboardPage({ apiBaseUrl, token, fetcher }: DashboardPageProps) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    listCalculators(apiBaseUrl, token, fetcher)
      .then((calculators) => {
        if (!cancelled) {
          setLoadState({ status: 'loaded', calculators });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load calculators';
          setLoadState({ status: 'error', message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, token, fetcher]);

  function handleOpen(id: string): void {
    router.push(`/editor/${id}`);
  }

  function handleDeleted(id: string): void {
    setLoadState((prev) => {
      if (prev.status !== 'loaded') return prev;
      return {
        status: 'loaded',
        calculators: prev.calculators.filter((c) => c.id !== id),
      };
    });
  }

  const deleteHook = useDeleteCalculator(apiBaseUrl, token, handleDeleted, fetcher);

  if (loadState.status === 'loading') {
    return (
      <main>
        <h1>My Calculators</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (loadState.status === 'error') {
    return (
      <main>
        <h1>My Calculators</h1>
        <p role="alert">{loadState.message}</p>
      </main>
    );
  }

  const { calculators } = loadState;

  return (
    <main>
      <h1>My Calculators</h1>
      <CreateCalculatorButton baseUrl={apiBaseUrl} token={token} fetcher={fetcher} />
      {deleteHook.errorMessage !== null && <p role="alert">{deleteHook.errorMessage}</p>}
      {calculators.length === 0 ? (
        <p>No calculators yet. Create your first one.</p>
      ) : (
        <ul>
          {calculators.map((calculator) => (
            <li key={calculator.id}>
              <CalculatorCard
                calculator={calculator}
                onOpen={handleOpen}
                onDelete={deleteHook.requestDelete}
              />
              {deleteHook.confirmingId === calculator.id && (
                <DeleteConfirmDialog
                  onConfirm={deleteHook.confirmDelete}
                  onCancel={deleteHook.cancelDelete}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
