'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiClient } from '@/shared/api';
import { listCalculators, CalculatorCard } from '@/entities/calculator';
import type { CalculatorSummary } from '@/entities/calculator';
import { CreateCalculatorButton } from '@/features/create-calculator';
import { useDeleteCalculator, DeleteConfirmDialog } from '@/features/delete-calculator';

interface DashboardPageProps {
  client: ApiClient;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; calculators: CalculatorSummary[] };

export function DashboardPage({ client }: DashboardPageProps) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    listCalculators(client)
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
  }, [client]);

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

  const deleteHook = useDeleteCalculator(client, handleDeleted);

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
      <CreateCalculatorButton client={client} />
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
