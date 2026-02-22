package server

import (
	"context"
	"encoding/json"
	"net/http"
)

// Pinger is the interface used by the health handler to verify database
// connectivity. It is defined here, at the point of consumption, following the
// "interfaces where consumed" convention.
type Pinger interface {
	Ping(ctx context.Context) error
}

// healthHandler returns an http.HandlerFunc that checks database connectivity
// via pinger.Ping and writes a flat JSON health response.
//
// The response is NOT wrapped in the standard Envelope[T] — /healthz is
// consumed by infrastructure monitoring tools, not API clients.
//
// Healthy:  200 OK           {"db":"ok"}
// Degraded: 503 Unavailable  {"db":"degraded"}
func healthHandler(pinger Pinger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		status := http.StatusOK
		dbStatus := "ok"

		if err := pinger.Ping(r.Context()); err != nil {
			status = http.StatusServiceUnavailable
			dbStatus = "degraded"
		}

		body, _ := json.Marshal(map[string]string{"db": dbStatus})

		// X-Content-Type-Options and Strict-Transport-Security are set by the
		// securityHeaders middleware registered in server.go. No manual header
		// setting is needed here.
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		_, _ = w.Write(body)
	}
}
