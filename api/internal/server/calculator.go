package server

import (
	"context"
	"net/http"
	"time"

	"github.com/evanisnor/quotecraft/api/internal/calculator"
)

// CalculatorCreator creates new calculators.
// Defined here at the consumer (server package) per the interfaces-where-consumed convention.
type CalculatorCreator interface {
	Create(ctx context.Context, userID string) (*calculator.Calculator, error)
}

// CalculatorService is the full set of calculator capabilities consumed by the server.
// Grows as additional INFR-US5 tasks are implemented.
type CalculatorService interface {
	CalculatorCreator
}

// createCalculatorResponse is the data payload returned on successful calculator creation.
type createCalculatorResponse struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// createCalculatorHandler returns an http.HandlerFunc that handles POST /v1/calculators.
func createCalculatorHandler(svc CalculatorCreator) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, "missing authentication")
			return
		}
		calc, err := svc.Create(r.Context(), userID)
		if err != nil {
			LoggerFrom(r.Context()).Error("creating calculator", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}
		WriteJSON(w, http.StatusCreated, createCalculatorResponse{
			ID:        calc.ID,
			CreatedAt: calc.CreatedAt,
			UpdatedAt: calc.UpdatedAt,
		})
	}
}

// MountCalculators registers calculator routes on the server's private authenticated group.
func (s *Server) MountCalculators(validator TokenValidator, svc CalculatorService) {
	protected := s.Authenticated(validator)
	protected.Post("/calculators", createCalculatorHandler(svc))
}
