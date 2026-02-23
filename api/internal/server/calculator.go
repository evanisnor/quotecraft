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

// CalculatorLister lists calculators for the authenticated user.
// Defined here at the consumer (server package) per the interfaces-where-consumed convention.
type CalculatorLister interface {
	List(ctx context.Context, userID string) ([]*calculator.Calculator, error)
}

// CalculatorService is the full set of calculator capabilities consumed by the server.
// Grows as additional INFR-US5 tasks are implemented.
type CalculatorService interface {
	CalculatorCreator
	CalculatorLister
}

// createCalculatorResponse is the data payload returned on successful calculator creation.
type createCalculatorResponse struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// calculatorSummary is the per-item shape in a list response.
type calculatorSummary struct {
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

// listCalculatorsHandler returns an http.HandlerFunc that handles GET /v1/calculators.
func listCalculatorsHandler(svc CalculatorLister) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, "missing authentication")
			return
		}
		calcs, err := svc.List(r.Context(), userID)
		if err != nil {
			LoggerFrom(r.Context()).Error("listing calculators", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}
		summaries := make([]calculatorSummary, len(calcs))
		for i, c := range calcs {
			summaries[i] = calculatorSummary{
				ID:        c.ID,
				CreatedAt: c.CreatedAt,
				UpdatedAt: c.UpdatedAt,
			}
		}
		WriteJSON(w, http.StatusOK, summaries)
	}
}

// MountCalculators registers calculator routes on the server's private authenticated group.
func (s *Server) MountCalculators(validator TokenValidator, svc CalculatorService) {
	protected := s.Authenticated(validator)
	protected.Post("/calculators", createCalculatorHandler(svc))
	protected.Get("/calculators", listCalculatorsHandler(svc))
}
