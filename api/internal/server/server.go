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
	mux          *chi.Mux
	logger       *slog.Logger
	cfg          *config.APIConfig
	pinger       Pinger
	publicGroup  chi.Router // /v1 group with wildcard CORS; populated by future public route tasks
	privateGroup chi.Router // /v1 group with restricted CORS; populated by future private route tasks
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
//  7. securityHeaders — set X-Content-Type-Options and Strict-Transport-Security
//
// Route groups under /v1:
//   - Public group  — widget-accessible endpoints; CORS wildcard (no credentials)
//   - Private group — dashboard-only endpoints; CORS restricted to DashboardOrigins
func New(cfg *config.APIConfig, logger *slog.Logger, pinger Pinger) *Server {
	r := chi.NewRouter()

	r.Use(middleware.RealIP)
	r.Use(middleware.RequestID)
	r.Use(InjectLogger(logger))
	r.Use(RequestLogger(logger))
	r.Use(middleware.Recoverer)
	r.Use(middleware.StripSlashes)
	r.Use(securityHeaders)

	// /healthz is at the root, not versioned. It is consumed by infrastructure
	// monitoring tools rather than API clients, so it uses a flat JSON response
	// rather than the standard Envelope[T] wrapper.
	r.Get("/healthz", healthHandler(pinger))

	// Mount the /v1 prefix with two sub-groups differentiated by CORS policy.
	// References to the group routers are stored on the Server so that future
	// tasks and tests can register routes in the correct CORS group.
	//
	// OPTIONS preflight routing: chi evaluates route method-matching before
	// group middleware runs, so a plain OPTIONS request hits 405 before CORS
	// middleware has a chance to respond. A single Options("/*") is registered
	// at the /v1 level and dispatches through both CORS policies in order:
	// private first (reflected origin when the request comes from an allowed
	// dashboard origin), then public (wildcard fallback for all other origins).
	// This ensures dashboard preflights get AllowCredentials: true responses
	// and widget preflights get the wildcard response, using only path-level
	// information available at preflight time.
	var pubGroup, privGroup chi.Router
	r.Route("/v1", func(r chi.Router) {
		// Public sub-group: widget-accessible endpoints.
		// Wildcard CORS — no auth, no cookies.
		// Endpoints registered here by future tasks: INFR-US5-A007 (/v1/calculators/:id/config)
		// and LEAD-US1-A002 (/v1/submissions).
		r.Group(func(r chi.Router) {
			r.Use(publicCORS())
			pubGroup = r
		})

		// Private sub-group: dashboard-only endpoints.
		// Restricted CORS — only the origins listed in cfg.DashboardOrigins.
		// Endpoints registered here by future tasks: INFR-US4 (/v1/auth/*),
		// INFR-US5 (/v1/calculators/*), BILL-US1 (/v1/billing/*).
		r.Group(func(r chi.Router) {
			r.Use(privateCORS(cfg.DashboardOrigins))
			privGroup = r
		})

		// Wildcard OPTIONS handler at the /v1 level gives chi a matching route
		// for all OPTIONS requests so they are not rejected with 405 before any
		// middleware runs. The handler applies privateCORS first (for dashboard
		// origins that need AllowCredentials: true) and falls back to publicCORS
		// (wildcard, for widget origins). go-chi/cors short-circuits preflights
		// and writes the response headers itself; the empty inner body is never
		// reached.
		privatePreflightHandler := privateCORS(cfg.DashboardOrigins)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
		publicPreflightHandler := publicCORS()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
		r.Options("/*", func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			for _, allowed := range cfg.DashboardOrigins {
				if origin == allowed {
					privatePreflightHandler.ServeHTTP(w, r)
					return
				}
			}
			publicPreflightHandler.ServeHTTP(w, r)
		})
	})

	return &Server{
		mux:          r,
		logger:       logger,
		cfg:          cfg,
		pinger:       pinger,
		publicGroup:  pubGroup,
		privateGroup: privGroup,
	}
}

// Handler returns the configured http.Handler for use with http.ListenAndServe.
func (s *Server) Handler() http.Handler {
	return s.mux
}

// Authenticated returns a sub-router of the private group with RequireAuth applied.
// Routes registered on this router require a valid session token.
// This method is called once per feature that needs protected routes (e.g., calculators, billing).
func (s *Server) Authenticated(validator TokenValidator) chi.Router {
	var r chi.Router
	s.privateGroup.Group(func(g chi.Router) {
		g.Use(RequireAuth(validator))
		r = g
	})
	return r
}
