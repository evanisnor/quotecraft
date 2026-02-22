package server

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
)

// loggerKey is the unexported context key type for the request-scoped logger.
// Using a private type prevents collisions with other packages' context keys.
type loggerKey struct{}

// InjectLogger returns a middleware that stores a request-scoped *slog.Logger —
// pre-bound with the trace_id from chi's RequestID middleware — into the request
// context. Handlers retrieve it via LoggerFrom.
//
// Must be mounted AFTER middleware.RequestID (so the trace_id is available in
// context) and BEFORE any handlers that need to emit structured log entries with
// the trace_id automatically included.
func InjectLogger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			traceID := middleware.GetReqID(r.Context())
			requestLogger := logger.With(slog.String("trace_id", traceID))
			ctx := context.WithValue(r.Context(), loggerKey{}, requestLogger)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// LoggerFrom retrieves the request-scoped *slog.Logger from ctx. If no logger
// is present (e.g., outside a request context or in tests that bypass the
// InjectLogger middleware), it falls back to slog.Default().
func LoggerFrom(ctx context.Context) *slog.Logger {
	if logger, ok := ctx.Value(loggerKey{}).(*slog.Logger); ok && logger != nil {
		return logger
	}
	return slog.Default()
}
