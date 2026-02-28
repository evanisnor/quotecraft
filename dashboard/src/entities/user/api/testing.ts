interface StubResponse {
  status: number;
  body: unknown;
}

/**
 * StubFetch is a reusable test implementation of the fetch API.
 * Provide an array of pre-configured responses; each call to fetch()
 * consumes the next response in the queue.
 *
 * Does not rely on the global Response constructor so it works in
 * jsdom environments where Response may not be available.
 */
export class StubFetch {
  private responses: StubResponse[];
  private callIndex = 0;

  constructor(responses: StubResponse[]) {
    this.responses = responses;
  }

  readonly fetch: typeof globalThis.fetch = async () => {
    const response = this.responses[this.callIndex];
    if (!response) {
      throw new Error(`StubFetch: no response configured for call ${this.callIndex}`);
    }
    this.callIndex++;

    const bodyText = JSON.stringify(response.body);
    const status = response.status;

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => JSON.parse(bodyText) as unknown,
      text: async () => bodyText,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      redirected: false,
      statusText: '',
      type: 'basic' as ResponseType,
      url: '',
      body: null,
      bodyUsed: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      blob: async () => new Blob([bodyText]),
      formData: async () => new FormData(),
      clone() {
        return this;
      },
    } as Response;
  };

  get calls(): number {
    return this.callIndex;
  }
}

export function stubFetchWith(responses: StubResponse[]): StubFetch {
  return new StubFetch(responses);
}
