package server

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/evanisnor/quotecraft/api/internal/config"
)

func testServer(t *testing.T) *Server {
	t.Helper()
	cfg := &config.APIConfig{
		Port:             8080,
		DashboardOrigins: []string{"http://localhost:3000"},
	}
	logger := slog.Default()
	return New(cfg, logger, &stubPinger{err: nil})
}

func TestNew_DoesNotPanic(t *testing.T) {
	// Verifies that constructing the server with a valid config and logger
	// does not panic.
	s := testServer(t)
	if s == nil {
		t.Fatal("New() returned nil")
	}
}

func TestHandler_ReturnsNonNilHandler(t *testing.T) {
	s := testServer(t)
	h := s.Handler()
	if h == nil {
		t.Fatal("Handler() returned nil")
	}
}

func TestHandler_RequestIDHeaderSet(t *testing.T) {
	// The RequestID middleware must add X-Request-Id to every response.
	s := testServer(t)
	ts := httptest.NewServer(s.Handler())
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/v1/nonexistent")
	if err != nil {
		t.Fatalf("GET request failed: %v", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			t.Errorf("failed to close response body: %v", err)
		}
	}()

	if resp.Header.Get("X-Request-Id") == "" {
		t.Error("expected X-Request-Id header to be set, but it was empty")
	}
}

func TestHandler_StripSlashes(t *testing.T) {
	// StripSlashes middleware: a request with a trailing slash should be
	// treated the same as the path without it. Both should return 404 (no
	// routes registered yet) rather than 301.
	s := testServer(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/", nil)
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	// StripSlashes does not redirect; it strips in-place and re-routes.
	// With no routes under /v1, chi returns 404.
	if rec.Code == http.StatusMovedPermanently || rec.Code == http.StatusPermanentRedirect {
		t.Errorf("expected no redirect from StripSlashes, got %d", rec.Code)
	}
}

func TestHandler_RecovererCatchesPanic(t *testing.T) {
	// The Recoverer middleware must catch a panicking handler and return 500.
	cfg := &config.APIConfig{Port: 8080}
	logger := slog.Default()
	s := New(cfg, logger, &stubPinger{err: nil})

	// Mount a panicking handler directly on the mux for this test.
	s.mux.Get("/panic-test", func(w http.ResponseWriter, r *http.Request) {
		panic("test panic")
	})

	req := httptest.NewRequest(http.MethodGet, "/panic-test", nil)
	rec := httptest.NewRecorder()

	// Should not panic out to the test runner.
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 from Recoverer on panic, got %d", rec.Code)
	}
}
