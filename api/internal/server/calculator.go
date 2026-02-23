package server

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

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

// CalculatorGetter gets a single calculator by ID.
type CalculatorGetter interface {
	Get(ctx context.Context, id, userID string) (*calculator.Calculator, error)
}

// CalculatorUpdater updates the config of an existing calculator.
type CalculatorUpdater interface {
	Update(ctx context.Context, id, userID string, config []byte) (*calculator.Calculator, error)
}

// CalculatorDeleter soft-deletes an existing calculator.
type CalculatorDeleter interface {
	Delete(ctx context.Context, id, userID string) error
}

// CalculatorService is the full set of calculator capabilities consumed by the server.
type CalculatorService interface {
	CalculatorCreator
	CalculatorLister
	CalculatorGetter
	CalculatorUpdater
	CalculatorDeleter
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

// calculatorResponse is the full calculator shape returned by GET /v1/calculators/:id.
type calculatorResponse struct {
	ID            string          `json:"id"`
	Config        json.RawMessage `json:"config"`
	ConfigVersion int             `json:"config_version"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

// getCalculatorHandler returns an http.HandlerFunc for GET /v1/calculators/{id}.
func getCalculatorHandler(svc CalculatorGetter) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, "missing authentication")
			return
		}
		id := chi.URLParam(r, "id")
		calc, err := svc.Get(r.Context(), id, userID)
		if err != nil {
			if errors.Is(err, calculator.ErrNotFound) {
				WriteError(w, http.StatusNotFound, ErrCodeNotFound, "calculator not found")
				return
			}
			if errors.Is(err, calculator.ErrForbidden) {
				WriteError(w, http.StatusForbidden, ErrCodeForbidden, "access forbidden")
				return
			}
			LoggerFrom(r.Context()).Error("getting calculator", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}
		WriteJSON(w, http.StatusOK, calculatorResponse{
			ID:            calc.ID,
			Config:        json.RawMessage(calc.Config),
			ConfigVersion: calc.ConfigVersion,
			CreatedAt:     calc.CreatedAt,
			UpdatedAt:     calc.UpdatedAt,
		})
	}
}

// updateCalculatorRequest is the request body for PUT /v1/calculators/{id}.
type updateCalculatorRequest struct {
	Config json.RawMessage `json:"config"`
}

// updateCalculatorHandler returns an http.HandlerFunc for PUT /v1/calculators/{id}.
func updateCalculatorHandler(svc CalculatorUpdater) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, "missing authentication")
			return
		}

		var req updateCalculatorRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, "invalid request body")
			return
		}

		// Validate: config must be a JSON object (not array, null, or primitive).
		// json.Unmarshal([]byte("null"), &obj) succeeds with a nil map, so an
		// explicit nil-check is required in addition to the error check.
		var obj map[string]json.RawMessage
		if err := json.Unmarshal(req.Config, &obj); err != nil || obj == nil {
			WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, "config must be a JSON object")
			return
		}

		id := chi.URLParam(r, "id")
		calc, err := svc.Update(r.Context(), id, userID, req.Config)
		if err != nil {
			if errors.Is(err, calculator.ErrNotFound) {
				WriteError(w, http.StatusNotFound, ErrCodeNotFound, "calculator not found")
				return
			}
			if errors.Is(err, calculator.ErrForbidden) {
				WriteError(w, http.StatusForbidden, ErrCodeForbidden, "access forbidden")
				return
			}
			LoggerFrom(r.Context()).Error("updating calculator", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}
		WriteJSON(w, http.StatusOK, calculatorResponse{
			ID:            calc.ID,
			Config:        json.RawMessage(calc.Config),
			ConfigVersion: calc.ConfigVersion,
			CreatedAt:     calc.CreatedAt,
			UpdatedAt:     calc.UpdatedAt,
		})
	}
}

// deleteCalculatorHandler returns an http.HandlerFunc for DELETE /v1/calculators/{id}.
func deleteCalculatorHandler(svc CalculatorDeleter) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, "missing authentication")
			return
		}
		id := chi.URLParam(r, "id")
		if err := svc.Delete(r.Context(), id, userID); err != nil {
			if errors.Is(err, calculator.ErrNotFound) {
				WriteError(w, http.StatusNotFound, ErrCodeNotFound, "calculator not found")
				return
			}
			if errors.Is(err, calculator.ErrForbidden) {
				WriteError(w, http.StatusForbidden, ErrCodeForbidden, "access forbidden")
				return
			}
			LoggerFrom(r.Context()).Error("deleting calculator", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

// MountCalculators registers calculator routes on the server's private authenticated group.
func (s *Server) MountCalculators(validator TokenValidator, svc CalculatorService) {
	protected := s.Authenticated(validator)
	protected.Post("/calculators", createCalculatorHandler(svc))
	protected.Get("/calculators", listCalculatorsHandler(svc))
	protected.Get("/calculators/{id}", getCalculatorHandler(svc))
	protected.Put("/calculators/{id}", updateCalculatorHandler(svc))
	protected.Delete("/calculators/{id}", deleteCalculatorHandler(svc))
}
