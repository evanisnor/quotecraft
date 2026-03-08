package server

import (
	"net"
	"net/http"
	"sync"
	"time"
)

// tokenBucket implements a single token bucket for one key.
type tokenBucket struct {
	mu        sync.Mutex
	tokens    float64
	lastCheck time.Time
	rate      float64 // tokens per second
	capacity  float64
}

func newTokenBucket(rate, capacity float64) *tokenBucket {
	return &tokenBucket{
		tokens:    capacity,
		lastCheck: time.Now(),
		rate:      rate,
		capacity:  capacity,
	}
}

// allow consumes one token and returns true if the request is permitted.
func (b *tokenBucket) allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(b.lastCheck).Seconds()
	b.lastCheck = now

	b.tokens += elapsed * b.rate
	if b.tokens > b.capacity {
		b.tokens = b.capacity
	}

	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// rateLimiter manages per-key token buckets in memory.
// NOTE: Buckets are never evicted in the MVP. For auth endpoints with low
// distinct-IP counts this is acceptable; a production upgrade would add TTL eviction.
type rateLimiter struct {
	mu       sync.Mutex
	buckets  map[string]*tokenBucket
	rate     float64 // tokens/second
	capacity float64
}

// newRateLimiter creates a rateLimiter allowing requestsPerMinute requests per
// minute per key. The burst capacity equals requestsPerMinute.
func newRateLimiter(requestsPerMinute float64) *rateLimiter {
	return &rateLimiter{
		buckets:  make(map[string]*tokenBucket),
		rate:     requestsPerMinute / 60,
		capacity: requestsPerMinute,
	}
}

// allow returns true if the given key is within its rate limit.
func (l *rateLimiter) allow(key string) bool {
	l.mu.Lock()
	bucket, ok := l.buckets[key]
	if !ok {
		bucket = newTokenBucket(l.rate, l.capacity)
		l.buckets[key] = bucket
	}
	l.mu.Unlock()
	return bucket.allow()
}

// IPRateLimit returns middleware that allows up to the limiter's configured
// rate per unique client IP. Excess requests receive 429 Too Many Requests.
// Rate limit violations are logged as warnings with the client IP and path.
func IPRateLimit(l *rateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := clientIP(r)
			if !l.allow(ip) {
				LoggerFrom(r.Context()).Warn("rate limit exceeded", "ip", ip, "path", r.URL.Path)
				WriteError(w, http.StatusTooManyRequests, ErrCodeTooManyRequests, "rate limit exceeded")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// clientIP extracts the host component from r.RemoteAddr.
// After middleware.RealIP has run, RemoteAddr may be a bare IP or "host:port".
func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		// RemoteAddr is already a bare IP (no port).
		return r.RemoteAddr
	}
	return host
}
