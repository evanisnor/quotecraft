package server

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequestLogger_LogsExpectedFields(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))

	handler := RequestLogger(logger)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
	}))

	req := httptest.NewRequest(http.MethodPost, "/v1/test", nil)
	req.RemoteAddr = "127.0.0.1:12345"
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if buf.Len() == 0 {
		t.Fatal("expected log output, got empty buffer")
	}

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("log output is not valid JSON: %v\noutput: %s", err, buf.String())
	}

	if got, ok := entry["msg"]; !ok || got != "request" {
		t.Errorf("expected msg=request, got %v", got)
	}

	endpoint, ok := entry["endpoint"]
	if !ok {
		t.Error("expected endpoint field in log entry")
	}
	if endpoint != "POST /v1/test" {
		t.Errorf("expected endpoint=%q, got %q", "POST /v1/test", endpoint)
	}

	statusCode, ok := entry["status_code"]
	if !ok {
		t.Error("expected status_code field in log entry")
	}
	// JSON numbers unmarshal as float64.
	if statusCode != float64(http.StatusCreated) {
		t.Errorf("expected status_code=%d, got %v", http.StatusCreated, statusCode)
	}

	if _, ok := entry["duration_ms"]; !ok {
		t.Error("expected duration_ms field in log entry")
	}

	remoteAddr, ok := entry["remote_addr"]
	if !ok {
		t.Error("expected remote_addr field in log entry")
	}
	if remoteAddr != "127.0.0.1:12345" {
		t.Errorf("expected remote_addr=%q, got %q", "127.0.0.1:12345", remoteAddr)
	}

	if _, ok := entry["trace_id"]; !ok {
		t.Error("expected trace_id field in log entry")
	}
}

func TestRequestLogger_SetsRequestIDResponseHeader(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))

	handler := RequestLogger(logger)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/v1/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	// The X-Request-Id response header may be empty when no RequestID
	// middleware is in the chain, but the header must be present (even if
	// empty) because RequestLogger always calls Header().Set().
	// In production, chi's RequestID middleware runs before RequestLogger
	// and populates the request ID in the context.
	if _, exists := rec.Header()["X-Request-Id"]; !exists {
		t.Error("expected X-Request-Id response header to be set by RequestLogger")
	}
}

func TestRequestLogger_DefaultStatusCode(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))

	// Handler that does NOT call WriteHeader — default 200 should be captured.
	handler := RequestLogger(logger)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, err := w.Write([]byte("ok")); err != nil {
			t.Errorf("handler Write() failed: %v", err)
		}
	}))

	req := httptest.NewRequest(http.MethodGet, "/v1/ping", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("log output is not valid JSON: %v", err)
	}

	statusCode, ok := entry["status_code"]
	if !ok {
		t.Fatal("expected status_code field in log entry")
	}
	if statusCode != float64(http.StatusOK) {
		t.Errorf("expected status_code=200, got %v", statusCode)
	}
}
