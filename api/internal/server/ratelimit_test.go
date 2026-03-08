package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// TestClientIP_HostPort verifies that clientIP extracts the host from a "host:port" RemoteAddr.
func TestClientIP_HostPort(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "192.0.2.1:1234"
	got := clientIP(req)
	if got != "192.0.2.1" {
		t.Errorf("expected %q, got %q", "192.0.2.1", got)
	}
}

// TestClientIP_BareIP verifies that clientIP returns a bare IP unchanged.
func TestClientIP_BareIP(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "192.0.2.1"
	got := clientIP(req)
	if got != "192.0.2.1" {
		t.Errorf("expected %q, got %q", "192.0.2.1", got)
	}
}

// TestClientIP_IPv6HostPort verifies that clientIP handles bracketed IPv6 "host:port" addresses.
func TestClientIP_IPv6HostPort(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "[::1]:8080"
	got := clientIP(req)
	if got != "::1" {
		t.Errorf("expected %q, got %q", "::1", got)
	}
}

// TestTokenBucket_Allow verifies that a full bucket allows the first request and decrements tokens.
func TestTokenBucket_Allow(t *testing.T) {
	b := newTokenBucket(1, 5) // rate=1/s, capacity=5
	// Bucket starts full (5 tokens).
	if !b.allow() {
		t.Fatal("expected first allow() to return true with a full bucket")
	}
	// After consuming one token, should have 4 remaining (allow would still succeed).
	if b.tokens != 4 {
		t.Errorf("expected 4 tokens after one allow(), got %f", b.tokens)
	}
}

// TestTokenBucket_Deny verifies that a bucket with no tokens denies requests.
func TestTokenBucket_Deny(t *testing.T) {
	b := newTokenBucket(1, 3) // rate=1/s, capacity=3
	// Drain all tokens.
	for i := 0; i < 3; i++ {
		if !b.allow() {
			t.Fatalf("expected allow() to succeed on drain iteration %d", i)
		}
	}
	// Now the bucket should be empty and the next request should be denied.
	if b.allow() {
		t.Error("expected allow() to return false on empty bucket")
	}
}

// TestTokenBucket_Refill verifies that elapsed time causes the bucket to refill,
// allowing a request that would otherwise be denied.
func TestTokenBucket_Refill(t *testing.T) {
	b := newTokenBucket(10, 1) // rate=10/s, capacity=1
	// Drain the single token.
	if !b.allow() {
		t.Fatal("expected first allow() to succeed")
	}
	// Bucket is now empty; a request right now should be denied.
	if b.allow() {
		t.Fatal("expected allow() to be denied on empty bucket")
	}
	// Simulate 1 second of elapsed time by rewinding lastCheck.
	b.mu.Lock()
	b.lastCheck = b.lastCheck.Add(-1 * time.Second)
	b.mu.Unlock()
	// After refill, the bucket should have capacity=1 again.
	if !b.allow() {
		t.Error("expected allow() to succeed after simulated time elapsed")
	}
}

// TestRateLimiter_Allow verifies that a new bucket is created on the first call
// and allows requests up to capacity.
func TestRateLimiter_Allow(t *testing.T) {
	l := newRateLimiter(3) // capacity=3
	// First 3 requests should be allowed.
	for i := 0; i < 3; i++ {
		if !l.allow("key1") {
			t.Fatalf("expected allow() to succeed on request %d", i+1)
		}
	}
	// 4th request should be denied.
	if l.allow("key1") {
		t.Error("expected allow() to be denied after capacity exhausted")
	}
}

// TestRateLimiter_SeparateKeys verifies that different keys have independent buckets.
func TestRateLimiter_SeparateKeys(t *testing.T) {
	l := newRateLimiter(1) // capacity=1 per key
	// First request for key1 should succeed.
	if !l.allow("key1") {
		t.Fatal("expected allow() to succeed for key1")
	}
	// key1 is now exhausted, but key2 has its own fresh bucket.
	if !l.allow("key2") {
		t.Fatal("expected allow() to succeed for key2 independently of key1")
	}
	// Both keys should now be exhausted.
	if l.allow("key1") {
		t.Error("expected allow() to be denied for key1 after exhaustion")
	}
	if l.allow("key2") {
		t.Error("expected allow() to be denied for key2 after exhaustion")
	}
}

// TestIPRateLimit_Allows verifies that the middleware passes requests through when under the limit.
func TestIPRateLimit_Allows(t *testing.T) {
	limiter := newRateLimiter(100) // high limit so normal test traffic passes
	handler := IPRateLimit(limiter)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.RemoteAddr = "10.0.0.1:1234"
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

// TestIPRateLimit_Blocks verifies that the middleware returns 429 when the limit is exceeded.
func TestIPRateLimit_Blocks(t *testing.T) {
	limiter := newRateLimiter(1) // capacity=1: first request passes, second is blocked
	handler := IPRateLimit(limiter)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// First request: should pass.
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.RemoteAddr = "10.0.0.2:9999"
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("expected first request to return 200, got %d", rec.Code)
	}

	// Second request immediately after: bucket exhausted, should be blocked.
	req = httptest.NewRequest(http.MethodGet, "/test", nil)
	req.RemoteAddr = "10.0.0.2:9999"
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("expected second request to return 429, got %d", rec.Code)
	}

	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode 429 response body: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error body in 429 response, got nil")
	}
	if env.Error.Code != ErrCodeTooManyRequests {
		t.Errorf("expected error code %q, got %q", ErrCodeTooManyRequests, env.Error.Code)
	}
}

// TestIPRateLimit_LogsViolation verifies that a blocked request returns 429
// (logging is exercised indirectly through the handler path).
func TestIPRateLimit_LogsViolation(t *testing.T) {
	limiter := newRateLimiter(1) // capacity=1
	handler := IPRateLimit(limiter)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Exhaust the bucket.
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", nil)
	req.RemoteAddr = "10.0.0.3:4321"
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	// The second request triggers the logging + 429 path.
	req = httptest.NewRequest(http.MethodPost, "/v1/auth/login", nil)
	req.RemoteAddr = "10.0.0.3:4321"
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429 on rate-limited request, got %d", rec.Code)
	}
}

// TestMountAuth_RateLimitsAuthEndpoints verifies that making more than 10 rapid
// POST requests to /v1/auth/login from the same IP triggers a 429 response.
// The token bucket starts with capacity=10, so the 11th request must be denied.
func TestMountAuth_RateLimitsAuthEndpoints(t *testing.T) {
	s := testServer(t)
	svc := &stubAuthService{token: "tok"}
	s.MountAuth(svc)

	const limit = 10
	body := `{"email":"a@b.com","password":"pass1234"}`
	ip := "10.0.0.1"

	var lastCode int
	for i := 0; i < limit+1; i++ {
		req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(body))
		req.RemoteAddr = ip + ":1234"
		rec := httptest.NewRecorder()
		s.Handler().ServeHTTP(rec, req)
		lastCode = rec.Code
	}

	if lastCode != http.StatusTooManyRequests {
		t.Errorf("expected the 11th request to return 429, got %d", lastCode)
	}
}
