'use client';

import { useCreateCalculator } from '../model/useCreateCalculator';

interface CreateCalculatorButtonProps {
  baseUrl: string;
  token: string;
  fetcher?: typeof globalThis.fetch;
}

export function CreateCalculatorButton({ baseUrl, token, fetcher }: CreateCalculatorButtonProps) {
  const { status, errorMessage, handleCreate } = useCreateCalculator(baseUrl, token, fetcher);

  return (
    <div>
      <button type="button" onClick={handleCreate} disabled={status === 'creating'}>
        New Calculator
      </button>
      {status === 'error' && errorMessage !== null && <p role="alert">{errorMessage}</p>}
    </div>
  );
}
