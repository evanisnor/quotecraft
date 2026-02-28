import type { CalculatorSummary } from '../model/types';

interface ApiEnvelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown>;
}

interface CalculatorData {
  id: string;
  created_at: string;
  updated_at: string;
}

function parseCalculatorSummary(data: CalculatorData): CalculatorSummary {
  return {
    id: data.id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function listCalculators(
  baseUrl: string,
  token: string,
  fetcher: typeof globalThis.fetch = globalThis.fetch,
): Promise<CalculatorSummary[]> {
  const response = await fetcher(`${baseUrl}/v1/calculators`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  const envelope = (await response.json()) as ApiEnvelope<CalculatorData[]>;

  if (!response.ok) {
    throw new Error(envelope.error?.message ?? 'Unknown error');
  }

  const data = envelope.data ?? [];
  return data.map(parseCalculatorSummary);
}

export async function createCalculator(
  baseUrl: string,
  token: string,
  fetcher: typeof globalThis.fetch = globalThis.fetch,
): Promise<CalculatorSummary> {
  const response = await fetcher(`${baseUrl}/v1/calculators`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const envelope = (await response.json()) as ApiEnvelope<CalculatorData>;

  if (!response.ok) {
    throw new Error(envelope.error?.message ?? 'Unknown error');
  }

  const data = envelope.data;
  if (!data) {
    throw new Error('Unexpected response: missing calculator data');
  }

  return parseCalculatorSummary(data);
}

export async function deleteCalculator(
  baseUrl: string,
  id: string,
  token: string,
  fetcher: typeof globalThis.fetch = globalThis.fetch,
): Promise<void> {
  const response = await fetcher(`${baseUrl}/v1/calculators/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    // 204 has no body; non-ok responses may have a body
    let message = 'Unknown error';
    try {
      const envelope = (await response.json()) as ApiEnvelope<unknown>;
      message = envelope.error?.message ?? message;
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(message);
  }
}
