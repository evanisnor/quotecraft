package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// dummyHandler is an http.HandlerFunc that writes 200 OK and nothing else.
// It is used in CORS tests to give the middleware a real handler to delegate to.
var dummyHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
})

// TestPublicCORS_WildcardOriginOnActualRequest verifies that the publicCORS
// middleware sets Access-Control-Allow-Origin: * on a simple cross-origin GET.
func TestPublicCORS_WildcardOriginOnActualRequest(t *testing.T) {
	h := publicCORS()(dummyHandler)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Origin", "https://some-third-party-site.com")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "*" {
		t.Errorf("expected Access-Control-Allow-Origin: *, got %q", origin)
	}
}

// TestPublicCORS_PreflightReturns200WithWildcard verifies that an OPTIONS
// preflight request to a public endpoint is approved with wildcard origin.
func TestPublicCORS_PreflightReturns200WithWildcard(t *testing.T) {
	h := publicCORS()(dummyHandler)

	req := httptest.NewRequest(http.MethodOptions, "/", nil)
	req.Header.Set("Origin", "https://any-domain.example")
	req.Header.Set("Access-Control-Request-Method", http.MethodGet)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	// go-chi/cors returns 200 for OPTIONS preflight.
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 for preflight, got %d", rec.Code)
	}

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "*" {
		t.Errorf("expected Access-Control-Allow-Origin: * on preflight, got %q", origin)
	}
}

// TestPublicCORS_PostAllowed verifies that POST is in the allowed methods list
// for public endpoints (submissions endpoint uses POST).
func TestPublicCORS_PostAllowed(t *testing.T) {
	h := publicCORS()(dummyHandler)

	req := httptest.NewRequest(http.MethodOptions, "/", nil)
	req.Header.Set("Origin", "https://example.com")
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 for POST preflight, got %d", rec.Code)
	}

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "*" {
		t.Errorf("expected Access-Control-Allow-Origin: * for POST preflight, got %q", origin)
	}
}

// TestPrivateCORS_AllowedOriginReceivesHeader verifies that a request from an
// allowed origin receives the reflected origin in the CORS response header.
func TestPrivateCORS_AllowedOriginReceivesHeader(t *testing.T) {
	allowedOrigins := []string{"http://localhost:3000", "https://dashboard.quotecraft.io"}
	h := privateCORS(allowedOrigins)(dummyHandler)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "http://localhost:3000" {
		t.Errorf("expected Access-Control-Allow-Origin: http://localhost:3000, got %q", origin)
	}
}

// TestPrivateCORS_DisallowedOriginReceivesNoHeader verifies that a request
// from an origin not in the allowed list receives no CORS header, which causes
// the browser to block the request.
func TestPrivateCORS_DisallowedOriginReceivesNoHeader(t *testing.T) {
	allowedOrigins := []string{"http://localhost:3000"}
	h := privateCORS(allowedOrigins)(dummyHandler)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Origin", "https://evil.com")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "" {
		t.Errorf("expected no Access-Control-Allow-Origin header for disallowed origin, got %q", origin)
	}
}

// TestPrivateCORS_PreflightAllowedOrigin verifies that a preflight OPTIONS
// request from an allowed origin is approved.
func TestPrivateCORS_PreflightAllowedOrigin(t *testing.T) {
	allowedOrigins := []string{"http://localhost:3000"}
	h := privateCORS(allowedOrigins)(dummyHandler)

	req := httptest.NewRequest(http.MethodOptions, "/", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 for allowed-origin preflight, got %d", rec.Code)
	}

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "http://localhost:3000" {
		t.Errorf("expected Access-Control-Allow-Origin: http://localhost:3000, got %q", origin)
	}
}

// TestPrivateCORS_PreflightDisallowedOrigin verifies that a preflight OPTIONS
// request from a disallowed origin receives no CORS header.
func TestPrivateCORS_PreflightDisallowedOrigin(t *testing.T) {
	allowedOrigins := []string{"http://localhost:3000"}
	h := privateCORS(allowedOrigins)(dummyHandler)

	req := httptest.NewRequest(http.MethodOptions, "/", nil)
	req.Header.Set("Origin", "https://evil.com")
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "" {
		t.Errorf("expected no Access-Control-Allow-Origin for disallowed preflight, got %q", origin)
	}
}

// TestPrivateCORS_SecondAllowedOrigin verifies that the second origin in the
// allowed list is also accepted, ensuring the slice is iterated correctly.
func TestPrivateCORS_SecondAllowedOrigin(t *testing.T) {
	allowedOrigins := []string{"http://localhost:3000", "https://dashboard.quotecraft.io"}
	h := privateCORS(allowedOrigins)(dummyHandler)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Origin", "https://dashboard.quotecraft.io")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "https://dashboard.quotecraft.io" {
		t.Errorf("expected Access-Control-Allow-Origin: https://dashboard.quotecraft.io, got %q", origin)
	}
}

// TestSecurityHeaders_SetsExpectedHeaders verifies that securityHeaders middleware
// sets both X-Content-Type-Options and Strict-Transport-Security on all responses.
func TestSecurityHeaders_SetsExpectedHeaders(t *testing.T) {
	h := securityHeaders(dummyHandler)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if got := rec.Header().Get("X-Content-Type-Options"); got != "nosniff" {
		t.Errorf("expected X-Content-Type-Options: nosniff, got %q", got)
	}

	wantHSTS := "max-age=63072000; includeSubDomains"
	if got := rec.Header().Get("Strict-Transport-Security"); got != wantHSTS {
		t.Errorf("expected Strict-Transport-Security: %q, got %q", wantHSTS, got)
	}
}

// TestSecurityHeaders_CallsNextHandler verifies that securityHeaders delegates
// to the next handler and does not short-circuit the chain.
func TestSecurityHeaders_CallsNextHandler(t *testing.T) {
	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusTeapot)
	})

	h := securityHeaders(next)
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if !called {
		t.Error("expected next handler to be called, but it was not")
	}
	if rec.Code != http.StatusTeapot {
		t.Errorf("expected status 418 from next handler, got %d", rec.Code)
	}
}

// TestServer_SecurityHeadersOnHealthz verifies that the securityHeaders
// middleware applies to /healthz via the full server stack (not just the
// handler in isolation).
func TestServer_SecurityHeadersOnHealthz(t *testing.T) {
	s := testServer(t)

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if got := rec.Header().Get("X-Content-Type-Options"); got != "nosniff" {
		t.Errorf("expected X-Content-Type-Options: nosniff via middleware on /healthz, got %q", got)
	}

	wantHSTS := "max-age=63072000; includeSubDomains"
	if got := rec.Header().Get("Strict-Transport-Security"); got != wantHSTS {
		t.Errorf("expected Strict-Transport-Security: %q on /healthz, got %q", wantHSTS, got)
	}
}

// TestServer_PublicGroupCORSWiring verifies that publicCORS() is actually wired
// into the public route group in the server, not just that the function works in
// isolation. Registers a dummy route in s.publicGroup and confirms wildcard CORS.
func TestServer_PublicGroupCORSWiring(t *testing.T) {
	s := testServer(t)
	s.publicGroup.Get("/probe", dummyHandler)

	req := httptest.NewRequest(http.MethodGet, "/v1/probe", nil)
	req.Header.Set("Origin", "https://any-site.example")
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "*" {
		t.Errorf("expected Access-Control-Allow-Origin: * from public group, got %q", origin)
	}
}

// TestServer_PrivateGroupCORSWiring_AllowedOrigin verifies that privateCORS() is
// wired into the private route group in the server. An allowed origin receives
// the reflected CORS header.
func TestServer_PrivateGroupCORSWiring_AllowedOrigin(t *testing.T) {
	s := testServer(t)
	s.privateGroup.Get("/probe", dummyHandler)

	req := httptest.NewRequest(http.MethodGet, "/v1/probe", nil)
	req.Header.Set("Origin", "http://localhost:3000") // matches config default
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "http://localhost:3000" {
		t.Errorf("expected Access-Control-Allow-Origin: http://localhost:3000 from private group, got %q", origin)
	}
}

// TestServer_PrivateGroupCORSWiring_DisallowedOrigin verifies that a request
// from an origin not in DashboardOrigins receives no CORS header from the
// private group.
func TestServer_PrivateGroupCORSWiring_DisallowedOrigin(t *testing.T) {
	s := testServer(t)
	s.privateGroup.Get("/probe", dummyHandler)

	req := httptest.NewRequest(http.MethodGet, "/v1/probe", nil)
	req.Header.Set("Origin", "https://attacker.example")
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	origin := rec.Header().Get("Access-Control-Allow-Origin")
	if origin != "" {
		t.Errorf("expected no Access-Control-Allow-Origin for disallowed origin, got %q", origin)
	}
}
