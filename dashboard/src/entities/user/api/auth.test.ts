import { registerUser, loginUser } from './auth';
import { stubFetchWith } from './testing';

const BASE_URL = 'http://localhost:8080';

describe('registerUser', () => {
  it('returns token on success', async () => {
    const stub = stubFetchWith([
      {
        status: 201,
        body: { data: { token: 'tok_register_success' }, error: null, meta: {} },
      },
    ]);

    const result = await registerUser(BASE_URL, 'user@example.com', 'password123', stub.fetch);

    expect(result.token).toBe('tok_register_success');
  });

  it('throws with API error message on 409 conflict', async () => {
    const stub = stubFetchWith([
      {
        status: 409,
        body: {
          data: null,
          error: { code: 'CONFLICT', message: 'email already registered' },
          meta: {},
        },
      },
    ]);

    await expect(
      registerUser(BASE_URL, 'taken@example.com', 'password123', stub.fetch),
    ).rejects.toThrow('email already registered');
  });

  it('throws with API error message on 400 bad request', async () => {
    const stub = stubFetchWith([
      {
        status: 400,
        body: {
          data: null,
          error: { code: 'BAD_REQUEST', message: 'email is required' },
          meta: {},
        },
      },
    ]);

    await expect(registerUser(BASE_URL, '', '', stub.fetch)).rejects.toThrow('email is required');
  });

  it('throws when 2xx response has no token in data', async () => {
    const stub = stubFetchWith([{ status: 201, body: { data: null, error: null, meta: {} } }]);

    await expect(
      registerUser(BASE_URL, 'user@example.com', 'password123', stub.fetch),
    ).rejects.toThrow('Unexpected response: missing token');
  });
});

describe('loginUser', () => {
  it('returns token on success', async () => {
    const stub = stubFetchWith([
      {
        status: 200,
        body: { data: { token: 'tok_login_success' }, error: null, meta: {} },
      },
    ]);

    const result = await loginUser(BASE_URL, 'user@example.com', 'password123', stub.fetch);

    expect(result.token).toBe('tok_login_success');
  });

  it('throws with API error message on 401 unauthorized', async () => {
    const stub = stubFetchWith([
      {
        status: 401,
        body: {
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'invalid credentials' },
          meta: {},
        },
      },
    ]);

    await expect(
      loginUser(BASE_URL, 'user@example.com', 'wrongpassword', stub.fetch),
    ).rejects.toThrow('invalid credentials');
  });

  it('throws when 2xx response has no token in data', async () => {
    const stub = stubFetchWith([{ status: 200, body: { data: null, error: null, meta: {} } }]);

    await expect(
      loginUser(BASE_URL, 'user@example.com', 'password123', stub.fetch),
    ).rejects.toThrow('Unexpected response: missing token');
  });
});
