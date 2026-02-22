package server

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
)

// RequestLogger returns a middleware that:
//   - Propagates the chi request ID as the X-Request-Id response header so
//     clients can correlate requests with server-side log entries.
//   - Logs each HTTP request as a structured JSON entry after the handler returns.
//
// Log fields per SYSTEM_DESIGN.md:
//   - trace_id    — chi request ID (X-Request-Id)
//   - endpoint    — HTTP method + path (e.g. "GET /v1/healthz")
//   - status_code — HTTP response status code
//   - duration_ms — request duration in integer milliseconds
//   - remote_addr — client address from r.RemoteAddr
func RequestLogger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rw := newResponseWriter(w)

			traceID := middleware.GetReqID(r.Context())
			rw.Header().Set(middleware.RequestIDHeader, traceID)

			next.ServeHTTP(rw, r)

			logger.Info("request",
				slog.String("trace_id", traceID),
				slog.String("endpoint", r.Method+" "+r.URL.Path),
				slog.Int("status_code", rw.statusCode),
				slog.Int64("duration_ms", time.Since(start).Milliseconds()),
				slog.String("remote_addr", r.RemoteAddr),
			)
		})
	}
}
