import { listCalculators, createCalculator, deleteCalculator } from './calculators';
import { StubApiClient } from '@/shared/api/testing';

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
