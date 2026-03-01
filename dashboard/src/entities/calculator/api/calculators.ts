import type { ApiClient } from '@/shared/api';
import type { CalculatorSummary } from '../model/types';

interface CalculatorData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

function parseCalculatorSummary(data: CalculatorData): CalculatorSummary {
  return {
    id: data.id,
    name: data.name,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function listCalculators(client: ApiClient): Promise<CalculatorSummary[]> {
  const data = await client.get<CalculatorData[]>('/v1/calculators');
  return data.map(parseCalculatorSummary);
}

export async function createCalculator(client: ApiClient): Promise<CalculatorSummary> {
  const data = await client.post<CalculatorData>('/v1/calculators');
  return parseCalculatorSummary(data);
}

export async function deleteCalculator(client: ApiClient, id: string): Promise<void> {
  await client.delete(`/v1/calculators/${id}`);
}
