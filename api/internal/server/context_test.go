package server

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5/middleware"
)

// TestLoggerFrom_FallsBackToDefault verifies that LoggerFrom returns slog.Default()
// when no logger has been injected into the context.
func TestLoggerFrom_FallsBackToDefault(t *testing.T) {
	ctx := context.Background()
	got := LoggerFrom(ctx)
	if got == nil {
		t.Fatal("LoggerFrom() returned nil for empty context")
	}
	// The fallback must be the slog default logger.
	if got != slog.Default() {
		t.Error("LoggerFrom() with no logger in context should return slog.Default()")
	}
}

// TestLoggerFrom_ReturnsInjectedLogger verifies that LoggerFrom returns the logger
// that was stored in context by InjectLogger.
func TestLoggerFrom_ReturnsInjectedLogger(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))

	// Simulate what InjectLogger does: store a child logger in context.
	ctx := context.WithValue(context.Background(), loggerKey{}, logger)
	got := LoggerFrom(ctx)
	if got == nil {
		t.Fatal("LoggerFrom() returned nil when logger was in context")
	}
	if got != logger {
		t.Error("LoggerFrom() did not return the logger stored in context")
	}
}

// TestInjectLogger_StoresLoggerInContext verifies that InjectLogger middleware places
// a logger in the request context that is retrievable via LoggerFrom.
func TestInjectLogger_StoresLoggerInContext(t *testing.T) {
	var buf bytes.Buffer
	baseLogger := slog.New(slog.NewJSONHandler(&buf, nil))

	var capturedLogger *slog.Logger
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedLogger = LoggerFrom(r.Context())
		w.WriteHeader(http.StatusOK)
	})

	handler := InjectLogger(baseLogger)(inner)
	req := httptest.NewRequest(http.MethodGet, "/v1/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if capturedLogger == nil {
		t.Fatal("LoggerFrom(r.Context()) returned nil inside InjectLogger handler")
	}
}

// TestInjectLogger_LoggerIncludesTraceID verifies that the logger injected into
// context includes the trace_id attribute from the chi RequestID middleware.
func TestInjectLogger_LoggerIncludesTraceID(t *testing.T) {
	var buf bytes.Buffer
	baseLogger := slog.New(slog.NewJSONHandler(&buf, nil))

	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Log something from the handler using the context-bound logger.
		LoggerFrom(r.Context()).InfoContext(r.Context(), "handler ran")
		w.WriteHeader(http.StatusOK)
	})

	// Wrap with InjectLogger (which reads trace_id from chi's RequestID context key).
	handler := InjectLogger(baseLogger)(inner)

	// Simulate chi's RequestID middleware by injecting a known request ID into context.
	// middleware.RequestIDKey is the exported key that GetReqID reads from.
	const wantTraceID = "test-trace-abc123"
	req := httptest.NewRequest(http.MethodGet, "/v1/test", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.RequestIDKey, wantTraceID))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if buf.Len() == 0 {
		t.Fatal("expected log output from handler, got empty buffer")
	}

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("log output is not valid JSON: %v\noutput: %s", err, buf.String())
	}

	traceID, ok := entry["trace_id"]
	if !ok {
		t.Fatal("expected trace_id field in log entry from context-bound logger")
	}
	if traceID != wantTraceID {
		t.Errorf("expected trace_id=%q, got %q", wantTraceID, traceID)
	}
}

// TestInjectLogger_EmptyTraceID verifies that InjectLogger works when no RequestID
// middleware has set a trace_id — the logger is still injected, trace_id is empty.
func TestInjectLogger_EmptyTraceID(t *testing.T) {
	var buf bytes.Buffer
	baseLogger := slog.New(slog.NewJSONHandler(&buf, nil))

	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		LoggerFrom(r.Context()).InfoContext(r.Context(), "handler ran")
		w.WriteHeader(http.StatusOK)
	})

	handler := InjectLogger(baseLogger)(inner)
	// No RequestID middleware in the chain — trace_id will be empty string.
	req := httptest.NewRequest(http.MethodGet, "/v1/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if buf.Len() == 0 {
		t.Fatal("expected log output from handler, got empty buffer")
	}

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("log output is not valid JSON: %v\noutput: %s", err, buf.String())
	}

	// trace_id should be present but empty when no RequestID is in context.
	traceID, ok := entry["trace_id"]
	if !ok {
		t.Fatal("expected trace_id field in log entry even when empty")
	}
	if traceID != "" {
		t.Errorf("expected empty trace_id when no RequestID middleware set, got %q", traceID)
	}
}

// TestInjectLogger_NextHandlerCalled verifies that InjectLogger passes the request
// to the next handler in the chain.
func TestInjectLogger_NextHandlerCalled(t *testing.T) {
	var buf bytes.Buffer
	baseLogger := slog.New(slog.NewJSONHandler(&buf, nil))

	nextCalled := false
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusNoContent)
	})

	handler := InjectLogger(baseLogger)(inner)
	req := httptest.NewRequest(http.MethodDelete, "/v1/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if !nextCalled {
		t.Error("InjectLogger did not call the next handler")
	}
	if rec.Code != http.StatusNoContent {
		t.Errorf("expected status 204 from inner handler, got %d", rec.Code)
	}
}
