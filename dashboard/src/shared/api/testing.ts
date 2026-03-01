import type { ApiClient } from './apiClient';

interface StubResponse {
  status: number;
  body: unknown | null;
}

/**
 * StubFetch is a reusable test implementation of the fetch API for testing ApiClient.
 * Provide an array of pre-configured responses; each call to fetch()
 * consumes the next response in the queue.
 */
export class StubFetch {
  calls: number = 0;
  private responses: StubResponse[];

  constructor(responses: StubResponse[]) {
    this.responses = [...responses];
  }

  get fetch(): typeof globalThis.fetch {
    return () => {
      this.calls++;
      const response = this.responses.shift();
      if (!response) throw new Error('StubFetch: no more responses');
      return Promise.resolve({
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: () => Promise.resolve(response.body),
      } as Response);
    };
  }
}

export function stubFetchWith(responses: StubResponse[]): StubFetch {
  return new StubFetch(responses);
}

interface QueueEntry {
  data?: unknown;
  error?: Error;
}

/**
 * StubApiClient is a reusable test implementation of ApiClient.
 * Enqueue success responses or errors before each API call under test.
 */
export class StubApiClient implements ApiClient {
  readonly calls: { method: string; path: string; body?: unknown }[] = [];
  private queue: QueueEntry[] = [];

  enqueueSuccess<T>(data: T): void {
    this.queue.push({ data });
  }

  enqueueError(message: string): void {
    this.queue.push({ error: new Error(message) });
  }

  private async dequeue<T>(): Promise<T> {
    const entry = this.queue.shift();
    if (!entry) throw new Error('StubApiClient: no more queued responses');
    if (entry.error) throw entry.error;
    return entry.data as T;
  }

  async get<T>(path: string): Promise<T> {
    this.calls.push({ method: 'GET', path });
    return this.dequeue<T>();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    this.calls.push({ method: 'POST', path, body });
    return this.dequeue<T>();
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    this.calls.push({ method: 'PUT', path, body });
    return this.dequeue<T>();
  }

  async delete(path: string): Promise<void> {
    this.calls.push({ method: 'DELETE', path });
    await this.dequeue<void>();
  }
}
