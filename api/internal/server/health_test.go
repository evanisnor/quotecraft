package server

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthHandler_Healthy(t *testing.T) {
	// A healthy pinger returns nil. The handler must respond 200 with {"db":"ok"}.
	pinger := &stubPinger{err: nil}
	h := healthHandler(pinger)

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}

	want := `{"db":"ok"}`
	got := rec.Body.String()
	if got != want {
		t.Errorf("expected body %q, got %q", want, got)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", ct)
	}
	// X-Content-Type-Options is set by the securityHeaders middleware in
	// server.go. The handler itself no longer sets it. Coverage of the header
	// via the full middleware stack is in TestServer_SecurityHeadersOnHealthz
	// in cors_test.go.
}

func TestHealthHandler_Degraded(t *testing.T) {
	// A degraded pinger returns an error. The handler must respond 503 with {"db":"degraded"}.
	pinger := &stubPinger{err: errors.New("connection refused")}
	h := healthHandler(pinger)

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status 503, got %d", rec.Code)
	}

	want := `{"db":"degraded"}`
	got := rec.Body.String()
	if got != want {
		t.Errorf("expected body %q, got %q", want, got)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", ct)
	}
	// X-Content-Type-Options is set by the securityHeaders middleware in
	// server.go. The handler itself no longer sets it. Coverage of the header
	// via the full middleware stack is in TestServer_SecurityHeadersOnHealthz
	// in cors_test.go.
}
