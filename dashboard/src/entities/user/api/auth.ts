interface ApiEnvelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown>;
}

interface AuthResponseData {
  token: string;
}

export async function registerUser(
  baseUrl: string,
  email: string,
  password: string,
  fetcher: typeof globalThis.fetch = globalThis.fetch,
): Promise<{ token: string }> {
  const response = await fetcher(`${baseUrl}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const envelope = (await response.json()) as ApiEnvelope<AuthResponseData>;

  if (!response.ok) {
    throw new Error(envelope.error?.message ?? 'Unknown error');
  }

  const token = envelope.data?.token;
  if (!token) {
    throw new Error('Unexpected response: missing token');
  }

  return { token };
}

export async function loginUser(
  baseUrl: string,
  email: string,
  password: string,
  fetcher: typeof globalThis.fetch = globalThis.fetch,
): Promise<{ token: string }> {
  const response = await fetcher(`${baseUrl}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const envelope = (await response.json()) as ApiEnvelope<AuthResponseData>;

  if (!response.ok) {
    throw new Error(envelope.error?.message ?? 'Unknown error');
  }

  const token = envelope.data?.token;
  if (!token) {
    throw new Error('Unexpected response: missing token');
  }

  return { token };
}
