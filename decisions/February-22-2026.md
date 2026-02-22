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
