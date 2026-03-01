import { createApiClient } from './apiClient';
import { stubFetchWith } from './testing';

const BASE_URL = 'http://localhost:8080';
const TOKEN = 'test-token';

describe('ApiClient.get', () => {
  it('returns parsed data on 200', async () => {
    const stub = stubFetchWith([
      {
        status: 200,
        body: { data: { id: 'abc', name: 'Test' }, error: null, meta: {} },
      },
    ]);
    const client = createApiClient(BASE_URL, TOKEN, stub.fetch);

    const result = await client.get<{ id: string; name: string }>('/v1/things');

    expect(result).toEqual({ id: 'abc', name: 'Test' });
    expect(stub.calls).toBe(1);
  });

  it('throws API error message on non-ok response', async () => {
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
    const client = createApiClient(BASE_URL, TOKEN, stub.fetch);

    await expect(client.get('/v1/things')).rejects.toThrow('missing auth token');
  });

  it('throws on null data in success response', async () => {
    const stub = stubFetchWith([
      {
        status: 200,
        body: { data: null, error: null, meta: {} },
      },
    ]);
    const client = createApiClient(BASE_URL, TOKEN, stub.fetch);

    await expect(client.get('/v1/things')).rejects.toThrow('Unexpected response: missing data');
  });

  it('throws generic message when error field is null on non-ok response', async () => {
    const stub = stubFetchWith([{ status: 500, body: { data: null, error: null, meta: {} } }]);
    const client = createApiClient(BASE_URL, TOKEN, stub.fetch);

    await expect(client.get('/v1/test')).rejects.toThrow('Unknown error');
  });
});

describe('ApiClient.post', () => {
  it('returns parsed data on 201, sends body as JSON with Content-Type header', async () => {
    let capturedHeaders: HeadersInit | undefined;
    let capturedBody: string | undefined;

    const capturingFetch: typeof globalThis.fetch = async (_url, options) => {
      capturedHeaders = options?.headers;
      capturedBody = options?.body as string | undefined;
      return {
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 'new-id' }, error: null, meta: {} }),
      } as Response;
    };

    const client = createApiClient(BASE_URL, TOKEN, capturingFetch);

    const result = await client.post<{ id: string }>('/v1/things', { name: 'Test' });

    expect(result).toEqual({ id: 'new-id' });
    expect(capturedBody).toBe('{"name":"Test"}');
    const headers = capturedHeaders as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBe(`Bearer ${TOKEN}`);
  });

  it('throws API error message on non-ok response', async () => {
    const stub = stubFetchWith([
      {
        status: 403,
        body: { data: null, error: { code: 'FORBIDDEN', message: 'plan limit reached' }, meta: {} },
      },
    ]);
    const client = createApiClient(BASE_URL, TOKEN, stub.fetch);

    await expect(client.post('/v1/things', { name: 'Test' })).rejects.toThrow('plan limit reached');
  });

  it('does NOT send Content-Type header when called without a body', async () => {
    let capturedHeaders: HeadersInit | undefined;

    const capturingFetch: typeof globalThis.fetch = async (_url, options) => {
      capturedHeaders = options?.headers;
      return {
        ok: true,
        status: 201,
        json: async () => ({ data: { id: 'new-id' }, error: null, meta: {} }),
      } as Response;
    };

    const client = createApiClient(BASE_URL, TOKEN, capturingFetch);

    await client.post<{ id: string }>('/v1/things');

    const headers = capturedHeaders as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
    expect(headers['Authorization']).toBe(`Bearer ${TOKEN}`);
  });

  it('throws generic message when error field is null on non-ok response', async () => {
    const stub = stubFetchWith([{ status: 500, body: { data: null, error: null, meta: {} } }]);
    const client = createApiClient(BASE_URL, TOKEN, stub.fetch);

    await expect(client.post('/v1/test', { name: 'Test' })).rejects.toThrow('Unknown error');
  });
});

describe('ApiClient.put', () => {
  it('returns parsed data on 200', async () => {
    const stub = stubFetchWith([
      {
        status: 200,
        body: { data: { id: 'abc', name: 'Updated' }, error: null, meta: {} },
      },
    ]);
    const client = createApiClient(BASE_URL, TOKEN, stub.fetch);

    const result = await client.put<{ id: string; name: string }>('/v1/things/abc', {
      name: 'Updated',
    });

    expect(result).toEqual({ id: 'abc', name: 'Updated' });
  });

  it('throws API error message on non-ok response', async () => {
    const stub = stubFetchWith([
      {
        status: 404,
        body: { data: null, error: { code: 'NOT_FOUND', message: 'thing not found' }, meta: {} },
      },
    ]);
    const client = createApiClient(BASE_URL, TOKEN, stub.fetch);

    await expect(client.put('/v1/things/abc', { name: 'Updated' })).rejects.toThrow(
      'thing not found',
    );
  });

  it('throws generic message when error field is null on non-ok response', async () => {
    const stub = stubFetchWith([{ status: 500, body: { data: null, error: null, meta: {} } }]);
    const client = createApiClient(BASE_URL, TOKEN, stub.fetch);

    await expect(client.put('/v1/test', { name: 'Test' })).rejects.toThrow('Unknown error');
  });
});

describe('ApiClient.delete', () => {
  it('resolves on 204', async () => {
    const stub = stubFetchWith([{ status: 204, body: null }]);
    const client = createApiClient(BASE_URL, TOKEN, stub.fetch);

    await expect(client.delete('/v1/things/abc')).resolves.toBeUndefined();
  });

  it('throws API error message on non-ok response', async () => {
    const stub = stubFetchWith([
      {
        status: 404,
        body: { data: null, error: { code: 'NOT_FOUND', message: 'thing not found' }, meta: {} },
      },
    ]);
    const client = createApiClient(BASE_URL, TOKEN, stub.fetch);

    await expect(client.delete('/v1/things/abc')).rejects.toThrow('thing not found');
  });

  it('throws generic message when error body cannot be parsed', async () => {
    const unparsableFetch: typeof globalThis.fetch = async () => {
      return {
        ok: false,
        status: 500,
        json: async (): Promise<unknown> => {
          throw new Error('invalid json');
        },
      } as Response;
    };

    const client = createApiClient(BASE_URL, TOKEN, unparsableFetch);

    await expect(client.delete('/v1/things/abc')).rejects.toThrow('Unknown error');
  });
});
