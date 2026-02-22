package server

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/evanisnor/quotecraft/api/internal/calculator"
)

func TestCreateCalculatorHandler_Success(t *testing.T) {
	now := time.Now().UTC().Truncate(time.Second)
	calc := &calculator.Calculator{
		ID:        "calc-abc123",
		UserID:    "user-xyz",
		CreatedAt: now,
		UpdatedAt: now,
	}
	svc := &stubCalculatorService{calc: calc}
	h := createCalculatorHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/calculators", nil)
	// Inject user ID into context (simulating RequireAuth middleware)
	ctx := context.WithValue(req.Context(), authUserKey{}, "user-xyz")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", rec.Code)
	}
	var env Envelope[map[string]any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error != nil {
		t.Errorf("expected no error in response, got: %+v", env.Error)
	}
	id, ok := env.Data["id"].(string)
	if !ok || id != "calc-abc123" {
		t.Errorf("expected id %q, got %v", "calc-abc123", env.Data["id"])
	}
}

func TestCreateCalculatorHandler_MissingAuth(t *testing.T) {
	svc := &stubCalculatorService{}
	h := createCalculatorHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/calculators", nil)
	// No user ID in context
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestCreateCalculatorHandler_InternalError(t *testing.T) {
	svc := &stubCalculatorService{err: errors.New("db failure")}
	h := createCalculatorHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/calculators", nil)
	ctx := context.WithValue(req.Context(), authUserKey{}, "user-xyz")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeInternal {
		t.Errorf("expected error code %q, got %q", ErrCodeInternal, env.Error.Code)
	}
}

func TestMountCalculators_RegistersRoute(t *testing.T) {
	s := testServer(t)
	authSvc := &stubAuthService{userID: "user-xyz"}
	s.MountAuth(authSvc)

	now := time.Now().UTC()
	calcSvc := &stubCalculatorService{calc: &calculator.Calculator{
		ID:        "calc-abc",
		UserID:    "user-xyz",
		CreatedAt: now,
		UpdatedAt: now,
	}}
	s.MountCalculators(authSvc, calcSvc)

	req := httptest.NewRequest(http.MethodPost, "/v1/calculators", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201 from mounted route, got %d", rec.Code)
	}
}

func TestMountCalculators_RequiresAuth(t *testing.T) {
	s := testServer(t)
	authSvc := &stubAuthService{userID: "user-xyz"}
	s.MountAuth(authSvc)
	s.MountCalculators(authSvc, &stubCalculatorService{})

	req := httptest.NewRequest(http.MethodPost, "/v1/calculators", nil)
	// No Authorization header
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 without auth, got %d", rec.Code)
	}
}
