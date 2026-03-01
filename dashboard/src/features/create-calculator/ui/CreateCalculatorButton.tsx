'use client';

import type { ApiClient } from '@/shared/api';
import { useCreateCalculator } from '../model/useCreateCalculator';

interface CreateCalculatorButtonProps {
  client: ApiClient;
}

export function CreateCalculatorButton({ client }: CreateCalculatorButtonProps) {
  const { status, errorMessage, handleCreate } = useCreateCalculator(client);

  return (
    <div>
      <button type="button" onClick={handleCreate} disabled={status === 'creating'}>
        New Calculator
      </button>
      {status === 'error' && errorMessage !== null && <p role="alert">{errorMessage}</p>}
    </div>
  );
}
