export interface ApiEnvelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown>;
}

export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  delete(path: string): Promise<void>;
}

async function request<T>(
  baseUrl: string,
  token: string,
  fetcher: typeof globalThis.fetch,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetcher(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const envelope = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(envelope.error?.message ?? 'Unknown error');
  }

  if (envelope.data === null) {
    throw new Error('Unexpected response: missing data');
  }

  return envelope.data;
}

export function createApiClient(
  baseUrl: string,
  token: string,
  fetcher: typeof globalThis.fetch = globalThis.fetch,
): ApiClient {
  return {
    get<T>(path: string): Promise<T> {
      return request<T>(baseUrl, token, fetcher, 'GET', path);
    },

    post<T>(path: string, body?: unknown): Promise<T> {
      return request<T>(baseUrl, token, fetcher, 'POST', path, body);
    },

    put<T>(path: string, body?: unknown): Promise<T> {
      return request<T>(baseUrl, token, fetcher, 'PUT', path, body);
    },

    async delete(path: string): Promise<void> {
      const response = await fetcher(`${baseUrl}${path}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let message = 'Unknown error';
        try {
          const envelope = (await response.json()) as ApiEnvelope<unknown>;
          message = envelope.error?.message ?? message;
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(message);
      }
    },
  };
}
