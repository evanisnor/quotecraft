package server

import (
	"net/http"

	"github.com/go-chi/cors"
)

// publicCORS returns CORS middleware configured for public endpoints
// (widget-accessible, no credentials). Allows any origin.
//
// Public endpoints (/v1/calculators/:id/config and /v1/submissions) must be
// accessible from any domain because the widget is embedded on third-party
// sites. Using a wildcard is safe here because these endpoints do not use
// cookies or session tokens — they accept only calculator IDs and submission
// payloads.
func publicCORS() func(http.Handler) http.Handler {
	return cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}).Handler
}

// privateCORS returns CORS middleware configured for authenticated endpoints
// (dashboard-only). Only allows the listed origins.
//
// Dashboard endpoints (/v1/auth/*, /v1/calculators/*, /v1/billing/*) use
// session cookies for authentication, so AllowCredentials must be true and
// the origin list must be restricted. A wildcard origin cannot be combined
// with AllowCredentials: true per the CORS specification.
func privateCORS(allowedOrigins []string) func(http.Handler) http.Handler {
	return cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           300,
	}).Handler
}

// securityHeaders sets security-related HTTP response headers on all responses.
// It is applied globally in the middleware stack so every endpoint — including
// /healthz and future API routes — receives these headers without any per-handler
// boilerplate.
//
// Headers set:
//   - X-Content-Type-Options: nosniff — prevents browsers from MIME-sniffing
//     API responses as HTML, reducing XSS risk.
//   - Strict-Transport-Security — tells browsers to use HTTPS for all future
//     requests to this host for two years, including subdomains.
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
		next.ServeHTTP(w, r)
	})
}
