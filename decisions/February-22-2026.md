# Decisions — February 22, 2026

## Task: INFR-US3-A002 — Implement structured JSON logging with trace_id propagation

**Requirements:** 1.9.1, 1.9.7, 1.9.9

### Decisions

**`service: "api"` on base logger via `.With()`**

The base logger in `main.go` is created as:
```go
slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("service", "api")
```
Using `.With()` attaches the attribute to every log entry emitted by the logger and all child loggers derived from it (including the per-request loggers created by `InjectLogger`). This satisfies the SYSTEM_DESIGN.md requirement that all log entries include `service: "api"` without having to add it manually to each `logger.Info(...)` call.

**`loggerKey{}` as unexported struct context key**

An unexported empty struct type (`loggerKey{}`) is used as the context key rather than a string or int. This is the idiomatic Go pattern — the unexported type ensures that only code within the `server` package can construct the same key, preventing accidental collisions with other packages that might store values under the same string key.

**`InjectLogger` creates a child logger per request**

`InjectLogger` calls `logger.With(slog.String("trace_id", traceID))` to produce a new `*slog.Logger` that permanently carries the `trace_id` attribute. This child logger is stored in context. Any handler that calls `LoggerFrom(ctx).Info(...)` will automatically include `trace_id` without any extra work. The base logger is not mutated — `.With()` returns a new logger.

**`LoggerFrom` falls back to `slog.Default()`**

The fallback to `slog.Default()` covers two cases: (1) code paths outside the HTTP request lifecycle (e.g., startup/shutdown logging in `main`) and (2) test code that bypasses the middleware stack. This is safe because `slog.Default()` is always initialized and never nil.

**`InjectLogger` placed between `RequestID` and `RequestLogger` in middleware stack**

`InjectLogger` must run after `RequestID` (so `middleware.GetReqID(r.Context())` returns a non-empty value) and before `RequestLogger` (which currently uses its own `GetReqID` call — this ordering ensures consistency and leaves the door open for `RequestLogger` to use `LoggerFrom` in a future task).

**`middleware.RequestIDKey` in tests**

To simulate chi's `RequestID` middleware in unit tests without running the full middleware stack, the test injects the trace ID directly into the request context using `context.WithValue(ctx, middleware.RequestIDKey, wantTraceID)`. `middleware.RequestIDKey` is chi's exported context key constant of type `ctxKeyRequestID`. Since `GetReqID` reads from this exact key, the injection faithfully replicates what `RequestID` middleware does at runtime.

**Test for empty trace_id when no `RequestID` middleware is present**

One test verifies the behavior when `InjectLogger` runs without `RequestID` in the chain. In this case `middleware.GetReqID(r.Context())` returns an empty string, so the injected logger includes `trace_id: ""`. This is intentional and correct — the field is always present (enabling log queries like `WHERE trace_id = ''` to find requests with no ID) rather than being conditionally omitted.

### Technical Challenges

**`middleware.WithValue` is not a context helper**

Initial test code tried to use `middleware.WithValue(ctx, middleware.RequestIDKey, traceID)` to inject the request ID into context. This failed to compile: `middleware.WithValue` in chi is a middleware constructor function (`func(key, val interface{}) func(http.Handler) http.Handler`), not a `context.WithValue` analog. The fix was to use `context.WithValue(req.Context(), middleware.RequestIDKey, wantTraceID)` directly — which is exactly what chi's `RequestID` middleware does internally.

---

## Task: INFR-US3-A003 — Implement consistent error response format

**Requirements:** 1.9.7

### Decisions

**`writeResponse` private helper to share fallback logic**

The initial design had both `WriteJSON` and `WriteError` containing their own `if err != nil` fallback branches. The fallback in `WriteError` was unreachable because `Envelope[any]{Data: nil, Error: &ErrorBody{...}, Meta: Meta{}}` is always JSON-serializable — all constituent types are plain structs and nil. To achieve 100% statement coverage while keeping defensive fallback behavior, the fallback write logic was extracted into a private `writeResponse(w, status, b []byte)` helper. `WriteJSON` calls it with `nil` when marshal fails (triggering the fallback), and `WriteError` always calls it with a valid body. Tests for `writeResponse` directly cover the nil-body branch.

**`WriteError` uses `b, _ := json.Marshal(env)` (blank identifier)**

`WriteError` always marshals `Envelope[any]` with nil Data and a plain `ErrorBody` struct. This cannot return an error because `encoding/json` only fails on unmarshable types (channels, functions, complex numbers, cyclic data). None of those are present here. Rather than a reachable-but-dead `if err != nil` branch, the marshal error is explicitly discarded with `_`. A comment explains the invariant so a future reader understands why this is safe. If `Envelope` or `ErrorBody` were ever changed to include an unmarshalable field, the result would be a nil `b` passed to `writeResponse`, which would write the hardcoded fallback — a safe degradation.

**`Envelope[T any]` generic struct for type-safe success responses**

Using a generic type parameter `T` lets call sites write `WriteJSON(w, 200, myStruct)` without wrapping in `interface{}`. The type parameter flows into the JSON encoder, preserving field names and types without extra casting. For `WriteError`, the concrete type `Envelope[any]` is used since the data field is always nil — no type information is needed.

**`Meta struct{}` serializes to `{}` not `null`**

An empty struct in Go serializes to `{}` via `encoding/json`, not `null`. This matches the spec requirement that `meta` is always an empty object. Tests explicitly verify `"meta":{}` appears in the response rather than `"meta":null`.

**Fallback body hardcoded as `[]byte` var, not a string constant**

The fallback error body is stored as `var fallbackErrorBody = []byte(...)` rather than a `const string`. This avoids the `[]byte(string)` allocation on every fallback write — the slice header is fixed at startup.

### Technical Challenges

**Unreachable fallback branch in `WriteError` blocking 100% coverage**

The initial implementation mirrored `WriteJSON`'s `if err != nil` pattern in `WriteError`, but because `WriteError` always marshals a fully serializable envelope, the error branch was never reachable in tests. This caused `WriteError` to report 60% coverage. The fix was to extract `writeResponse` as a shared helper, remove the dead branch from `WriteError`, and test `writeResponse` directly with a nil body argument. This gives 100% coverage on all functions without resorting to build tags or coverage-exclusion comments.

---

## Task: INFR-US3-A004 — Implement GET /healthz with DB connectivity check

**Requirements:** Observability (SYSTEM_DESIGN.md Health Checks section)

### Decisions

**`Pinger` interface defined in the `server` package (consumer)**

Per the "interfaces where consumed" convention from the Golang skill, `Pinger` is defined in `internal/server/health.go` — the package that consumes it — not at the point of implementation. The real database adapter (introduced in INFR-US4) will satisfy this interface without importing the server package, maintaining the correct dependency direction.

**Flat JSON response, not `Envelope[T]`**

The `/healthz` endpoint is consumed by infrastructure monitoring tools (uptime monitors, load balancer health checks), not by API clients. Infrastructure tools expect a simple, predictable structure — wrapping the health response in the standard `{"data":..., "error":..., "meta":{}}` envelope would make the response harder to parse for standard health probes and adds no value. The response is written directly via `json.Marshal` and `w.Write` without using `WriteJSON` or `WriteError`.

**`json.Marshal(map[string]string{"db": dbStatus})` over a struct**

A named struct would require a one-off type definition for a single-use, two-value shape. The `map[string]string` produces the correct JSON (`{"db":"ok"}` or `{"db":"degraded"}`) without the ceremony. The marshal error is intentionally discarded with `_` because `map[string]string` with string values cannot produce a marshal error — it is always JSON-serializable.

**`/healthz` mounted at the root mux, not under `/v1/`**

Health checks are an infrastructure concern, not a versioned API surface. Mounting at root (`r.Get("/healthz", ...)`) keeps the route outside the versioned route group and makes the intent clear. Infrastructure tooling that polls `/healthz` does not need to track API version changes.

**`noopPinger` in `main.go` as a temporary placeholder**

The real database pinger requires a database connection, which is not wired up until INFR-US4. Rather than introduce a hard dependency or a build-time error, a `noopPinger` struct is added to `main.go` that always returns nil (always healthy). This keeps the binary compilable and the health endpoint functional in the interim. The comment in the code explicitly references INFR-US4 so the placeholder is traceable and won't be forgotten.

**`stubPinger` defined in `health_test.go` (not a shared `testing.go` file)**

The `Pinger` interface is simple (one method) and the stub is only used within the `server` package tests. A separate `testing.go` file is warranted when stubs need to be shared across packages. Since `Pinger` implementations will live in adapter packages (outside `server`), those packages will define their own test doubles. The `stubPinger` in `health_test.go` covers all server-package test needs without over-engineering.

**`server.New` signature updated to accept `Pinger`**

Adding `pinger Pinger` as a third parameter to `New` follows the explicit dependency injection pattern used throughout the codebase. The server needs a pinger at construction time (it registers the route immediately), so injection at construction is correct. All existing callers (`server_test.go`, `main.go`) were updated accordingly.

### No technical challenges

The implementation was straightforward. The primary decision points were about where to define the interface and how to format the response — both resolved clearly by the existing conventions in SYSTEM_DESIGN.md and the Golang skill file.

---

## Task: INFR-US3-A005 — Configure CORS: wildcard for public endpoints, restricted for dashboard endpoints

**Requirements:** Security section of SYSTEM_DESIGN.md (A05: Security Misconfiguration)

### Decisions

**`securityHeaders` middleware applied globally, before route-specific CORS**

Security headers (`X-Content-Type-Options`, `Strict-Transport-Security`) must apply to every response including `/healthz` and future routes. Placing `securityHeaders` in the root middleware chain (after `StripSlashes`) ensures this without any per-handler boilerplate. The ordering is: `RealIP → RequestID → InjectLogger → RequestLogger → Recoverer → StripSlashes → securityHeaders`. This means security headers are set before route dispatch, so even 404s and panic recoveries carry them.

**`X-Content-Type-Options` removed from `health.go`**

With `securityHeaders` in the global stack, the manual `w.Header().Set("X-Content-Type-Options", "nosniff")` in `healthHandler` became redundant. It was removed to avoid the false impression that handlers are responsible for setting security headers. The health tests were updated to remove the per-handler assertion on this header; a new integration test (`TestServer_SecurityHeadersOnHealthz`) in `cors_test.go` verifies the header is still present via the full middleware stack.

**Two `/v1` route sub-groups with distinct CORS policies**

The `/v1` route is split into two `r.Group()` blocks inside `r.Route("/v1", ...)`. The public group uses `publicCORS()` (wildcard, no credentials); the private group uses `privateCORS(cfg.DashboardOrigins)` (restricted origins, credentials allowed). This structure is ready for future tasks to register handlers in the correct group without needing to configure CORS themselves.

**`publicCORS` uses `AllowCredentials: false`**

Per the CORS specification, `Access-Control-Allow-Origin: *` cannot be combined with `Access-Control-Allow-Credentials: true`. This is also correct for the security model — public endpoints (config fetch, submissions) must not accept cookies or session tokens. Setting `AllowCredentials: false` is explicit about this intent.

**`privateCORS` uses `AllowCredentials: true` with a restricted origin list**

Dashboard endpoints will use session cookies for authentication. For the browser to include cookies on cross-origin requests, the server must respond with `Access-Control-Allow-Credentials: true` and a specific (non-wildcard) origin. The `cfg.DashboardOrigins` slice is passed directly from config so this is externalized and configurable without code changes.

**CORS functions tested in isolation, not through route groups**

Testing CORS through the full server's route group structure would require registering dummy handlers in the public/private groups. This is brittle and couples tests to the route structure, which is not yet stable (future tasks will populate these groups). Instead, `publicCORS()` and `privateCORS()` are tested by wrapping a `dummyHandler` directly — this is both simpler and more directly tests the functions' behavior. Integration coverage of the middleware chain is provided by `TestServer_SecurityHeadersOnHealthz`.

**`github.com/go-chi/cors` chosen over a hand-rolled middleware**

go-chi/cors is the idiomatic CORS library for chi-based servers. It handles the full CORS specification including preflight response generation, origin matching, and the `Vary: Origin` header needed when using a restricted origin list. Writing a hand-rolled middleware would require re-implementing these details correctly. go-chi/cors is maintained by the same team as chi, so the integration is guaranteed to be compatible.

### Technical Challenges

No significant challenges. The main care taken was ensuring the `securityHeaders` middleware position relative to `Recoverer` — placing `securityHeaders` after `Recoverer` means the middleware runs inside the panic recovery boundary, so if a bug in `securityHeaders` panicked, `Recoverer` would catch it. However, `securityHeaders` only calls `w.Header().Set()` and `next.ServeHTTP()`, neither of which can panic under normal conditions. The current ordering (Recoverer before securityHeaders) is correct: headers set before `next.ServeHTTP()` are applied before the handler runs, which is the intent.

---

## Task: INFR-US4-A001 — Implement email+password registration with password hashing

**Requirements:** 1.1.1, 1.1.2, 1.1.3, 1.1.4, 1.1.5

### Decisions

**`auth.Service` holds an injected `passwordHasher` function field**

The bcrypt hasher is injected as a `passwordHasher` type alias (`func([]byte, int) ([]byte, error)`) on `Service` rather than called directly as a package-level function. This lets tests inject a fake hasher that returns a configurable error, enabling 100% coverage of the `Register` function's hasher error branch. The public `NewService` wires bcrypt's `GenerateFromPassword` automatically. A package-private `newServiceWithHasher` constructor is provided for test use only — it is not exported and adds no surface area to the public API.

**`generateToken` panics on entropy failure**

Per the task specification, the `generateToken` function panics if `io.ReadFull(rand.Reader, buf)` returns an error. Entropy exhaustion is a kernel-level failure and there is no meaningful recovery path. The panic branch is intentionally not covered by tests — covering it would require mocking the OS entropy source, which introduces more complexity than value. The coverage gap (2 statements inside the panic block) is accepted and documented.

**`db.DB` wraps a `dbPool` interface, not `*sql.DB` directly**

The `DB` struct stores its database operations behind a `dbPool` interface (`PingContext`, `Close`) rather than holding `*sql.DB` directly. This allows the `Ping` error branch and `Close` error branch to be tested by injecting a `fakePool` that returns configurable errors. The raw `*sql.DB` is kept as a separate `sqlDB` field and exposed via `DB()` for repository use (repositories need the full `*sql.DB` for `QueryRowContext` etc., which is not in the interface). In production, both fields point to the same `*sql.DB`.

**`openWithOpener` factory for DB construction**

Following the same pattern established by `FileMigrator.newFileMigratorWithFactory` in `db/migrate.go`, `DB.openWithOpener` accepts a `sqlOpener` function that is substituted in tests to avoid real network connections. The public `Open` function delegates to `openWithOpener(driverName, dataSourceName, sql.Open)` — a single-line wrapper tested by a `TestOpen_PublicFunction` test that expects an error from a bad DSN.

**`go-sqlmock` v1 for repository tests**

`github.com/DATA-DOG/go-sqlmock` (v1.5.2, the latest version of the module) is used for `PostgresUserRepository` and `PostgresSessionRepository` tests. The repositories take `*sql.DB` directly (not an interface), so sqlmock is the right tool here — it implements `database/sql/driver` to return mocked rows and errors. `mock.ExpectClose()` must be declared after each query expectation so the mock's ordered expectation list matches the call sequence (query, then deferred close).

**Email validation is intentionally minimal**

Email validation checks for non-empty string containing "@". Full RFC 5322 validation is not required by the task spec and would add complexity for little benefit at this stage. The constraint check `strings.Contains(email, "@")` is sufficient to catch obvious mistakes (empty string, no domain separator) without rejecting valid addresses that strict regex would flag.

**`Registrar` interface defined in `server` package (consumer)**

Following the interfaces-at-consumer convention, `Registrar` is defined in `internal/server/auth.go`, not in the `auth` package. The `auth.Service` struct satisfies `Registrar` without being aware of it. This maintains the correct dependency direction: `server` depends on `auth`, not the reverse.

**`auth.ErrEmailConflict` and `auth.ErrInvalidInput` sentinel errors**

Two package-level sentinel errors are defined in `auth`. The handler uses `errors.Is()` to detect them and map to the appropriate HTTP status codes (409 and 400). This avoids string matching in the handler layer. The `ErrEmailConflict` detection in `Service.Register` uses `strings.Contains(err.Error(), "unique")` on the raw database error — this is a deliberate choice to avoid importing `github.com/lib/pq` into the auth package. The `pq.Error` type check would create a direct dependency on the pq driver in the domain/application layer, violating the hexagonal architecture boundary.

**Session token: 32 bytes from `crypto/rand`, base64url (no padding), SHA-256 stored**

The token is 32 bytes of cryptographically random data encoded as base64url without padding, giving 43 characters of URL-safe entropy. The SHA-256 hash (lowercase hex, 64 characters) is stored in the `sessions.token_hash` column. The raw token is returned to the client and never stored. This design means even with database access, an attacker cannot reverse the stored hash to obtain valid session tokens.

### Technical Challenges

**`go-sqlmock` v1 `New()` auto-pings the DB**

`sqlmock.New()` in v1 automatically pings the database (registers an `ExpectPing` internally) and then consumes it. This means tests do not need to call `mock.ExpectPing()` explicitly, but they do need `mock.ExpectClose()` declared *after* all query expectations (not before), because sqlmock processes expectations in order. Placing `ExpectClose()` before `ExpectQuery()` caused failures where sqlmock expected Close before the query ran.

**`(*sql.DB).Close()` is idempotent and returns nil on double-close**

The initial `TestClose_Error` implementation tried to call `db.Close()` twice on a real `*sql.DB` (obtained from a fake driver) and expected the second call to return an error. It doesn't — the standard library's `Close()` is idempotent and returns `nil` even after already being closed. The fix was to introduce the `dbPool` interface and test the error branch using a `fakePool` that returns a configurable error, rather than trying to trigger the error through the real `*sql.DB`.

**`noopPinger` removed from `main.go`**

`TestNoopPinger_AlwaysHealthy` in `main_test.go` referenced the `noopPinger` type that was removed as part of this task. The test was removed since the noopPinger no longer exists — the real database connection satisfies `server.Pinger` from this task onwards.

---

## Task: INFR-US4-A002 — Implement login endpoint with session token issuance

**Requirements:** 1.1.3, 1.1.4

### Decisions

**`UserReader` interface separate from `UserWriter`**

`GetUserByEmail` is defined in a new `UserReader` interface, separate from `UserWriter`. `Register` only needs `UserWriter`; `Login` only needs `UserReader`. Keeping them separate follows ISP and means future consumers can take only what they need. `PostgresUserRepository` implements both. `NewService` now accepts `userWriter UserWriter, userReader UserReader, sessions SessionWriter` — `main.go` passes `userRepo` for both user params since the same struct satisfies both.

**`ErrUserNotFound` sentinel returned by repository, mapped to `ErrInvalidCredentials` by service**

`GetUserByEmail` returns `ErrUserNotFound` (not `sql.ErrNoRows` directly) when the email is not found. The service then maps `ErrUserNotFound` → `ErrInvalidCredentials`. This keeps the postgres driver dependency inside the adapter layer and gives the service a clean domain-level signal. An analogous pattern to `ErrEmailConflict` in `CreateUser`.

**Timing-safe login: dummy bcrypt comparison when user not found**

When `GetUserByEmail` returns `ErrUserNotFound`, the service still calls `s.verifier` against a hardcoded dummy bcrypt hash before returning `ErrInvalidCredentials`. Without this, an attacker can distinguish "email not registered" from "wrong password" via response latency (~0ms vs ~100–300ms for bcrypt). The dummy hash is a pre-computed cost-12 bcrypt value stored as a package-level `var`. The `notFound` boolean is captured before the verifier call so a nil `user.PasswordHash` is never dereferenced.

**`passwordVerifier` injectable field on `Service`**

`bcrypt.CompareHashAndPassword` is injected as a `passwordVerifier` function type on `Service`, following the same pattern as `passwordHasher`. This lets tests inject a stub verifier that returns `nil` (success) or a configurable error, enabling full coverage of all Login branches without running real bcrypt against real hashes in fast unit tests.

**`generateTokenFrom(io.Reader)` extracted for coverage of the entropy error path**

The original `generateToken()` called `io.ReadFull(rand.Reader, buf)` directly, making the error branch unreachable in tests. The fix splits it: `generateToken()` delegates to `generateTokenFrom(rand.Reader)`, and `generateTokenFrom` accepts any `io.Reader`. Tests inject an `errorReader` stub to cover the `io.ReadFull` error path. This achieves 100% statement coverage in `auth.go`.

**`AuthService` composite interface in `server` package**

`MountAuth` was updated from accepting `Registrar` to accepting `AuthService` — a composite interface embedding both `Registrar` and `Authenticator`. This keeps the handler registration co-located in a single `MountAuth` call. `auth.Service` satisfies both interfaces automatically. The `stubRegistrar` in `server/stubs_test.go` was replaced by `stubAuthService` which implements both methods, covering all existing and new handler tests.

**`loginHandler` returns 200 OK (not 201 Created) on success**

Login does not create a new resource — it creates a session and returns a token. The appropriate response code is 200 OK, matching the convention for authentication endpoints that return state rather than creating primary resources.

**`ErrInvalidCredentials` mapped to 401 in handler, not 400**

Invalid credentials mean the request is unauthenticated, not malformed. HTTP 401 Unauthorized is the correct code. The handler maps `auth.ErrInvalidCredentials` → 401, other errors → 500.

### Technical Challenges

**`newServiceForTest` signature grew with each new injectable field**

After adding `userReader`, `verifier`, and updated `genToken` handling, `newServiceForTest` grew to six parameters. All existing test call sites were updated in one pass. The function remains package-private and test-only, so the expansion has no impact on the public API.
