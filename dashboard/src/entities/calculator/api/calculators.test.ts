import {
  listCalculators,
  createCalculator,
  deleteCalculator,
  updateCalculatorConfig,
} from './calculators';
import { StubApiClient } from '@/shared/api/testing';
import { DEFAULT_THEME } from '@/shared/config';

describe('listCalculators', () => {
  it('returns an array of CalculatorSummary on success', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess([
      {
        id: 'abc-123',
        name: 'Test Calculator',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
      {
        id: 'def-456',
        name: 'Test Calculator',
        created_at: '2024-02-01T00:00:00Z',
        updated_at: '2024-02-02T00:00:00Z',
      },
    ]);

    const result = await listCalculators(client);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('abc-123');
    expect(result[0].createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(result[0].updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'));
    expect(result[1].id).toBe('def-456');
  });

  it('returns an empty array when the list is empty', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess([]);

    const result = await listCalculators(client);

    expect(result).toEqual([]);
  });

  it('throws with the API error message on non-ok response', async () => {
    const client = new StubApiClient();
    client.enqueueError('missing auth token');

    await expect(listCalculators(client)).rejects.toThrow('missing auth token');
  });
});

describe('createCalculator', () => {
  it('returns a CalculatorSummary with parsed dates on success', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess({
      id: 'new-calc-id',
      name: 'Test Calculator',
      created_at: '2024-03-01T12:00:00Z',
      updated_at: '2024-03-01T12:00:00Z',
    });

    const result = await createCalculator(client);

    expect(result.id).toBe('new-calc-id');
    expect(result.createdAt).toEqual(new Date('2024-03-01T12:00:00Z'));
    expect(result.updatedAt).toEqual(new Date('2024-03-01T12:00:00Z'));
  });

  it('throws with the API error message on non-ok response', async () => {
    const client = new StubApiClient();
    client.enqueueError('plan limit reached');

    await expect(createCalculator(client)).rejects.toThrow('plan limit reached');
  });
});

describe('deleteCalculator', () => {
  it('resolves without error on 204 success', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess(undefined);

    await expect(deleteCalculator(client, 'calc-id')).resolves.toBeUndefined();
  });

  it('throws with the API error message on 404', async () => {
    const client = new StubApiClient();
    client.enqueueError('calculator not found');

    await expect(deleteCalculator(client, 'bad-id')).rejects.toThrow('calculator not found');
  });
});

describe('updateCalculatorConfig', () => {
  it('resolves without error on successful PUT', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess({
      id: 'calc-id',
      config: {},
      config_version: 2,
      created_at: '',
      updated_at: '',
    });

    await expect(
      updateCalculatorConfig(client, 'calc-id', {
        fields: [],
        outputs: [],
        layoutMode: 'single-page',
        steps: [],
        theme: DEFAULT_THEME,
      }),
    ).resolves.toBeUndefined();
  });

  it('sends the config wrapped in a config key to the correct URL', async () => {
    const client = new StubApiClient();
    client.enqueueSuccess({
      id: 'calc-id',
      config: {},
      config_version: 2,
      created_at: '',
      updated_at: '',
    });

    const config = {
      fields: [
        {
          id: 'f1',
          type: 'number' as const,
          label: 'Count',
          required: false,
          variableName: 'count',
        },
      ],
      outputs: [],
      layoutMode: 'single-page' as const,
      steps: [],
      theme: DEFAULT_THEME,
    };
    await updateCalculatorConfig(client, 'calc-id', config);

    expect(client.calls).toHaveLength(1);
    expect(client.calls[0].method).toBe('PUT');
    expect(client.calls[0].path).toBe('/v1/calculators/calc-id');
    expect(client.calls[0].body).toEqual({ config });
  });

  it('throws with the API error message on failure', async () => {
    const client = new StubApiClient();
    client.enqueueError('access forbidden');

    await expect(
      updateCalculatorConfig(client, 'bad-id', {
        fields: [],
        outputs: [],
        layoutMode: 'single-page',
        steps: [],
        theme: DEFAULT_THEME,
      }),
    ).rejects.toThrow('access forbidden');
  });
});
