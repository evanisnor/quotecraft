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
