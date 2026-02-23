package server

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"

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

func TestListCalculatorsHandler_Success(t *testing.T) {
	now := time.Now().UTC().Truncate(time.Second)
	calcs := []*calculator.Calculator{
		{ID: "calc-1", UserID: "user-xyz", CreatedAt: now, UpdatedAt: now},
		{ID: "calc-2", UserID: "user-xyz", CreatedAt: now, UpdatedAt: now},
	}
	svc := &stubCalculatorService{calcs: calcs}
	h := listCalculatorsHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/v1/calculators", nil)
	ctx := context.WithValue(req.Context(), authUserKey{}, "user-xyz")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	var env Envelope[[]map[string]any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error != nil {
		t.Errorf("expected no error in response, got: %+v", env.Error)
	}
	if len(env.Data) != 2 {
		t.Fatalf("expected 2 calculators, got %d", len(env.Data))
	}
	id, ok := env.Data[0]["id"].(string)
	if !ok || id != "calc-1" {
		t.Errorf("expected first id %q, got %v", "calc-1", env.Data[0]["id"])
	}
}

func TestListCalculatorsHandler_Empty(t *testing.T) {
	svc := &stubCalculatorService{calcs: []*calculator.Calculator{}}
	h := listCalculatorsHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/v1/calculators", nil)
	ctx := context.WithValue(req.Context(), authUserKey{}, "user-xyz")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	var env Envelope[[]any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Data == nil {
		t.Error("expected empty array in data, got null")
	}
	if len(env.Data) != 0 {
		t.Errorf("expected 0 items, got %d", len(env.Data))
	}
}

func TestListCalculatorsHandler_MissingAuth(t *testing.T) {
	svc := &stubCalculatorService{}
	h := listCalculatorsHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/v1/calculators", nil)
	// No user ID in context
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestListCalculatorsHandler_InternalError(t *testing.T) {
	svc := &stubCalculatorService{err: errors.New("db failure")}
	h := listCalculatorsHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/v1/calculators", nil)
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

func TestMountCalculators_RegistersListRoute(t *testing.T) {
	s := testServer(t)
	authSvc := &stubAuthService{userID: "user-xyz"}
	s.MountAuth(authSvc)

	now := time.Now().UTC()
	calcSvc := &stubCalculatorService{
		calcs: []*calculator.Calculator{
			{ID: "calc-abc", UserID: "user-xyz", CreatedAt: now, UpdatedAt: now},
		},
	}
	s.MountCalculators(authSvc, calcSvc)

	req := httptest.NewRequest(http.MethodGet, "/v1/calculators", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 from mounted list route, got %d", rec.Code)
	}
	var env Envelope[[]map[string]any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(env.Data) != 1 {
		t.Fatalf("expected 1 calculator in response, got %d", len(env.Data))
	}
	id, ok := env.Data[0]["id"].(string)
	if !ok || id != "calc-abc" {
		t.Errorf("expected id %q, got %v", "calc-abc", env.Data[0]["id"])
	}
}

// newChiRequest builds an httptest.Request with a chi route context so that
// chi.URLParam works correctly in unit tests.
func newChiRequest(method, path, paramKey, paramVal string) *http.Request {
	req := httptest.NewRequest(method, path, nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(paramKey, paramVal)
	return req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
}

func TestGetCalculatorHandler_Success(t *testing.T) {
	now := time.Now().UTC().Truncate(time.Second)
	calc := &calculator.Calculator{
		ID:            "calc-abc",
		UserID:        "user-xyz",
		Config:        []byte(`{"field":"value"}`),
		ConfigVersion: 1,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	svc := &stubCalculatorService{calc: calc}
	h := getCalculatorHandler(svc)

	req := newChiRequest(http.MethodGet, "/v1/calculators/calc-abc", "id", "calc-abc")
	ctx := context.WithValue(req.Context(), authUserKey{}, "user-xyz")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	var env Envelope[map[string]any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error != nil {
		t.Errorf("expected no error in response, got: %+v", env.Error)
	}
	id, ok := env.Data["id"].(string)
	if !ok || id != "calc-abc" {
		t.Errorf("expected id %q, got %v", "calc-abc", env.Data["id"])
	}
	if env.Data["config"] == nil {
		t.Error("expected config to be non-null in response")
	}
}

func TestGetCalculatorHandler_NotFound(t *testing.T) {
	svc := &stubCalculatorService{err: calculator.ErrNotFound}
	h := getCalculatorHandler(svc)

	req := newChiRequest(http.MethodGet, "/v1/calculators/calc-missing", "id", "calc-missing")
	ctx := context.WithValue(req.Context(), authUserKey{}, "user-xyz")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}
	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeNotFound {
		t.Errorf("expected error code %q, got %q", ErrCodeNotFound, env.Error.Code)
	}
}

func TestGetCalculatorHandler_Forbidden(t *testing.T) {
	svc := &stubCalculatorService{err: calculator.ErrForbidden}
	h := getCalculatorHandler(svc)

	req := newChiRequest(http.MethodGet, "/v1/calculators/calc-abc", "id", "calc-abc")
	ctx := context.WithValue(req.Context(), authUserKey{}, "other-user")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rec.Code)
	}
	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeForbidden {
		t.Errorf("expected error code %q, got %q", ErrCodeForbidden, env.Error.Code)
	}
}

func TestGetCalculatorHandler_MissingAuth(t *testing.T) {
	svc := &stubCalculatorService{}
	h := getCalculatorHandler(svc)

	req := newChiRequest(http.MethodGet, "/v1/calculators/calc-abc", "id", "calc-abc")
	// No user ID in context
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestGetCalculatorHandler_InternalError(t *testing.T) {
	svc := &stubCalculatorService{err: errors.New("db failure")}
	h := getCalculatorHandler(svc)

	req := newChiRequest(http.MethodGet, "/v1/calculators/calc-abc", "id", "calc-abc")
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

func TestMountCalculators_RegistersGetRoute(t *testing.T) {
	s := testServer(t)
	authSvc := &stubAuthService{userID: "user-xyz"}
	s.MountAuth(authSvc)

	now := time.Now().UTC()
	calcSvc := &stubCalculatorService{calc: &calculator.Calculator{
		ID:            "some-id",
		UserID:        "user-xyz",
		Config:        []byte(`{}`),
		ConfigVersion: 1,
		CreatedAt:     now,
		UpdatedAt:     now,
	}}
	s.MountCalculators(authSvc, calcSvc)

	req := httptest.NewRequest(http.MethodGet, "/v1/calculators/some-id", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 from mounted get route, got %d", rec.Code)
	}
	var env Envelope[map[string]any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	id, ok := env.Data["id"].(string)
	if !ok || id != "some-id" {
		t.Errorf("expected id %q, got %v", "some-id", env.Data["id"])
	}
}

func TestUpdateCalculatorHandler_Success(t *testing.T) {
	now := time.Now().UTC().Truncate(time.Second)
	calc := &calculator.Calculator{
		ID:            "calc-abc",
		UserID:        "user-xyz",
		Config:        []byte(`{"key":"value"}`),
		ConfigVersion: 2,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	svc := &stubCalculatorService{calc: calc}
	h := updateCalculatorHandler(svc)

	body := `{"config":{"key":"value"}}`
	req := httptest.NewRequest(http.MethodPut, "/v1/calculators/calc-abc", strings.NewReader(body))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "calc-abc")
	ctx := context.WithValue(req.Context(), chi.RouteCtxKey, rctx)
	ctx = context.WithValue(ctx, authUserKey{}, "user-xyz")
	req = req.WithContext(ctx)

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	var env Envelope[map[string]any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error != nil {
		t.Errorf("expected no error in response, got: %+v", env.Error)
	}
	id, ok := env.Data["id"].(string)
	if !ok || id != "calc-abc" {
		t.Errorf("expected id %q, got %v", "calc-abc", env.Data["id"])
	}
	cv, ok := env.Data["config_version"].(float64)
	if !ok || int(cv) != 2 {
		t.Errorf("expected config_version 2, got %v", env.Data["config_version"])
	}
}

func TestUpdateCalculatorHandler_MissingAuth(t *testing.T) {
	svc := &stubCalculatorService{}
	h := updateCalculatorHandler(svc)

	req := httptest.NewRequest(http.MethodPut, "/v1/calculators/calc-abc", strings.NewReader(`{"config":{}}`))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "calc-abc")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestUpdateCalculatorHandler_InvalidJSON(t *testing.T) {
	svc := &stubCalculatorService{}
	h := updateCalculatorHandler(svc)

	req := httptest.NewRequest(http.MethodPut, "/v1/calculators/calc-abc", strings.NewReader(`not-json`))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "calc-abc")
	ctx := context.WithValue(req.Context(), chi.RouteCtxKey, rctx)
	ctx = context.WithValue(ctx, authUserKey{}, "user-xyz")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeBadRequest {
		t.Errorf("expected error code %q, got %q", ErrCodeBadRequest, env.Error.Code)
	}
}

func TestUpdateCalculatorHandler_NotAJSONObject(t *testing.T) {
	svc := &stubCalculatorService{}
	h := updateCalculatorHandler(svc)

	// Valid JSON but config is an array, not an object
	req := httptest.NewRequest(http.MethodPut, "/v1/calculators/calc-abc", strings.NewReader(`{"config":[1,2,3]}`))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "calc-abc")
	ctx := context.WithValue(req.Context(), chi.RouteCtxKey, rctx)
	ctx = context.WithValue(ctx, authUserKey{}, "user-xyz")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeBadRequest {
		t.Errorf("expected error code %q, got %q", ErrCodeBadRequest, env.Error.Code)
	}
}

func TestUpdateCalculatorHandler_NullConfig(t *testing.T) {
	svc := &stubCalculatorService{}
	h := updateCalculatorHandler(svc)

	// null is valid JSON but not a JSON object — must be rejected with 400.
	req := httptest.NewRequest(http.MethodPut, "/v1/calculators/calc-abc", strings.NewReader(`{"config":null}`))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "calc-abc")
	ctx := context.WithValue(req.Context(), chi.RouteCtxKey, rctx)
	ctx = context.WithValue(ctx, authUserKey{}, "user-xyz")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeBadRequest {
		t.Errorf("expected error code %q, got %q", ErrCodeBadRequest, env.Error.Code)
	}
}

func TestUpdateCalculatorHandler_NotFound(t *testing.T) {
	svc := &stubCalculatorService{err: calculator.ErrNotFound}
	h := updateCalculatorHandler(svc)

	req := httptest.NewRequest(http.MethodPut, "/v1/calculators/calc-missing", strings.NewReader(`{"config":{}}`))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "calc-missing")
	ctx := context.WithValue(req.Context(), chi.RouteCtxKey, rctx)
	ctx = context.WithValue(ctx, authUserKey{}, "user-xyz")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}
	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeNotFound {
		t.Errorf("expected error code %q, got %q", ErrCodeNotFound, env.Error.Code)
	}
}

func TestUpdateCalculatorHandler_Forbidden(t *testing.T) {
	svc := &stubCalculatorService{err: calculator.ErrForbidden}
	h := updateCalculatorHandler(svc)

	req := httptest.NewRequest(http.MethodPut, "/v1/calculators/calc-abc", strings.NewReader(`{"config":{}}`))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "calc-abc")
	ctx := context.WithValue(req.Context(), chi.RouteCtxKey, rctx)
	ctx = context.WithValue(ctx, authUserKey{}, "other-user")
	req = req.WithContext(ctx)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rec.Code)
	}
	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeForbidden {
		t.Errorf("expected error code %q, got %q", ErrCodeForbidden, env.Error.Code)
	}
}

func TestUpdateCalculatorHandler_InternalError(t *testing.T) {
	svc := &stubCalculatorService{err: errors.New("db failure")}
	h := updateCalculatorHandler(svc)

	req := httptest.NewRequest(http.MethodPut, "/v1/calculators/calc-abc", strings.NewReader(`{"config":{}}`))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "calc-abc")
	ctx := context.WithValue(req.Context(), chi.RouteCtxKey, rctx)
	ctx = context.WithValue(ctx, authUserKey{}, "user-xyz")
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

func TestMountCalculators_RegistersPutRoute(t *testing.T) {
	s := testServer(t)
	authSvc := &stubAuthService{userID: "user-xyz"}
	s.MountAuth(authSvc)

	now := time.Now().UTC()
	calcSvc := &stubCalculatorService{calc: &calculator.Calculator{
		ID:            "some-id",
		UserID:        "user-xyz",
		Config:        []byte(`{"updated":true}`),
		ConfigVersion: 2,
		CreatedAt:     now,
		UpdatedAt:     now,
	}}
	s.MountCalculators(authSvc, calcSvc)

	req := httptest.NewRequest(http.MethodPut, "/v1/calculators/some-id", strings.NewReader(`{"config":{"updated":true}}`))
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 from mounted put route, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	var env Envelope[map[string]any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	id, ok := env.Data["id"].(string)
	if !ok || id != "some-id" {
		t.Errorf("expected id %q, got %v", "some-id", env.Data["id"])
	}
}
