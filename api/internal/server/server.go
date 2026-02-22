package server

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/evanisnor/quotecraft/api/internal/config"
)

// Server is the HTTP server. It owns the router and the middleware stack.
// Routes for specific features (healthz, auth, calculators, etc.) are mounted
// by subsequent tasks (INFR-US3-A002 through A005).
type Server struct {
	mux    *chi.Mux
	logger *slog.Logger
	cfg    *config.APIConfig
}

// New creates a Server with the configured middleware stack applied.
// Routes under /v1/ are mounted but individual handlers are added in
// subsequent tasks.
//
// Middleware order (outermost first):
//  1. RealIP        — extract real client IP from X-Forwarded-For
//  2. RequestID     — generate/propagate X-Request-ID (used as trace_id)
//  3. InjectLogger  — bind trace_id into a request-scoped logger; store in context
//  4. RequestLogger — structured JSON access log per request
//  5. Recoverer     — catch panics, return 500
//  6. StripSlashes  — normalize trailing slashes
func New(cfg *config.APIConfig, logger *slog.Logger) *Server {
	r := chi.NewRouter()

	r.Use(middleware.RealIP)
	r.Use(middleware.RequestID)
	r.Use(InjectLogger(logger))
	r.Use(RequestLogger(logger))
	r.Use(middleware.Recoverer)
	r.Use(middleware.StripSlashes)

	// Mount the /v1 prefix. Individual route handlers are registered by
	// subsequent tasks (A002–A005).
	r.Route("/v1", func(r chi.Router) {
		// Route group is intentionally empty at this stage.
		// Handlers are added incrementally by subsequent tasks.
	})

	return &Server{
		mux:    r,
		logger: logger,
		cfg:    cfg,
	}
}

// Handler returns the configured http.Handler for use with http.ListenAndServe.
func (s *Server) Handler() http.Handler {
	return s.mux
}
