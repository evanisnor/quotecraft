import { listCalculators, createCalculator, deleteCalculator } from './calculators';
import { stubFetchWith } from './testing';

const BASE_URL = 'http://localhost:8080';
const TOKEN = 'test-token';

describe('listCalculators', () => {
  it('returns an array of CalculatorSummary on success', async () => {
    const stub = stubFetchWith([
      {
        status: 200,
        body: {
          data: [
            {
              id: 'abc-123',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
            {
              id: 'def-456',
              created_at: '2024-02-01T00:00:00Z',
              updated_at: '2024-02-02T00:00:00Z',
            },
          ],
          error: null,
          meta: {},
        },
      },
    ]);

    const result = await listCalculators(BASE_URL, TOKEN, stub.fetch);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('abc-123');
    expect(result[0].createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(result[0].updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'));
    expect(result[1].id).toBe('def-456');
  });

  it('returns an empty array when the list is empty', async () => {
    const stub = stubFetchWith([
      {
        status: 200,
        body: { data: [], error: null, meta: {} },
      },
    ]);

    const result = await listCalculators(BASE_URL, TOKEN, stub.fetch);

    expect(result).toEqual([]);
  });

  it('throws with the API error message on non-ok response', async () => {
    const stub = stubFetchWith([
      {
        status: 401,
        body: {
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'missing auth token' },
          meta: {},
        },
      },
    ]);

    await expect(listCalculators(BASE_URL, TOKEN, stub.fetch)).rejects.toThrow(
      'missing auth token',
    );
  });
});

describe('createCalculator', () => {
  it('returns a CalculatorSummary with parsed dates on success', async () => {
    const stub = stubFetchWith([
      {
        status: 201,
        body: {
          data: {
            id: 'new-calc-id',
            created_at: '2024-03-01T12:00:00Z',
            updated_at: '2024-03-01T12:00:00Z',
          },
          error: null,
          meta: {},
        },
      },
    ]);

    const result = await createCalculator(BASE_URL, TOKEN, stub.fetch);

    expect(result.id).toBe('new-calc-id');
    expect(result.createdAt).toEqual(new Date('2024-03-01T12:00:00Z'));
    expect(result.updatedAt).toEqual(new Date('2024-03-01T12:00:00Z'));
  });

  it('throws with the API error message on non-ok response', async () => {
    const stub = stubFetchWith([
      {
        status: 403,
        body: {
          data: null,
          error: { code: 'FORBIDDEN', message: 'plan limit reached' },
          meta: {},
        },
      },
    ]);

    await expect(createCalculator(BASE_URL, TOKEN, stub.fetch)).rejects.toThrow(
      'plan limit reached',
    );
  });
});

describe('deleteCalculator', () => {
  it('resolves without error on 204 success', async () => {
    const stub = stubFetchWith([
      {
        status: 204,
        body: null,
      },
    ]);

    await expect(deleteCalculator(BASE_URL, 'calc-id', TOKEN, stub.fetch)).resolves.toBeUndefined();
  });

  it('throws with the API error message on 404', async () => {
    const stub = stubFetchWith([
      {
        status: 404,
        body: {
          data: null,
          error: { code: 'NOT_FOUND', message: 'calculator not found' },
          meta: {},
        },
      },
    ]);

    await expect(deleteCalculator(BASE_URL, 'bad-id', TOKEN, stub.fetch)).rejects.toThrow(
      'calculator not found',
    );
  });
});
