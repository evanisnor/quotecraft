import type { ApiClient } from '@/shared/api';
import type { CalculatorEditorConfig, FeatureFlags } from '@/shared/config';
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

interface PublicConfigData {
  id: string;
  config: unknown;
  config_version: number;
  feature_flags?: {
    branding_removable?: boolean;
  };
}

export async function fetchPublicConfig(client: ApiClient, id: string): Promise<FeatureFlags> {
  const data = await client.get<PublicConfigData>(`/v1/calculators/${id}/config`);
  return {
    brandingRemovable: data.feature_flags?.branding_removable ?? false,
  };
}

export async function updateCalculatorConfig(
  client: ApiClient,
  id: string,
  config: CalculatorEditorConfig,
): Promise<void> {
  await client.put(`/v1/calculators/${id}`, { config });
}
