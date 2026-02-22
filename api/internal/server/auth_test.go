package server

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/evanisnor/quotecraft/api/internal/auth"
)

// TestRegisterHandler_Success verifies that a successful registration returns
// 201 Created with the token in the response body.
func TestRegisterHandler_Success(t *testing.T) {
	reg := &stubAuthService{token: "opaque-token-abc123"}
	h := registerHandler(reg)

	body := `{"email":"alice@example.com","password":"securepassword"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/register", strings.NewReader(body))
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
	token, ok := env.Data["token"].(string)
	if !ok || token == "" {
		t.Errorf("expected non-empty token in data, got: %+v", env.Data)
	}
	if token != "opaque-token-abc123" {
		t.Errorf("expected token opaque-token-abc123, got %q", token)
	}
}

// TestRegisterHandler_EmailConflict verifies that an ErrEmailConflict from the
// service layer results in 409 CONFLICT.
func TestRegisterHandler_EmailConflict(t *testing.T) {
	reg := &stubAuthService{err: auth.ErrEmailConflict}
	h := registerHandler(reg)

	body := `{"email":"alice@example.com","password":"securepassword"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/register", strings.NewReader(body))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusConflict {
		t.Errorf("expected 409, got %d", rec.Code)
	}

	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeConflict {
		t.Errorf("expected error code %q, got %q", ErrCodeConflict, env.Error.Code)
	}
}

// TestRegisterHandler_InvalidInput verifies that ErrInvalidInput results in
// 400 BAD_REQUEST with the detail message (prefix stripped).
func TestRegisterHandler_InvalidInput(t *testing.T) {
	// Wrap the sentinel with a detail message like the service does.
	reg := &stubAuthService{err: fmt.Errorf("%w: password must be at least 8 characters", auth.ErrInvalidInput)}
	h := registerHandler(reg)

	body := `{"email":"alice@example.com","password":"short"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/register", strings.NewReader(body))
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
	// The "invalid input: " prefix should be stripped.
	if strings.HasPrefix(env.Error.Message, "invalid input:") {
		t.Errorf("expected prefix stripped from message, got: %q", env.Error.Message)
	}
}

// TestRegisterHandler_MalformedJSON verifies that a non-JSON body results in
// 400 BAD_REQUEST.
func TestRegisterHandler_MalformedJSON(t *testing.T) {
	reg := &stubAuthService{}
	h := registerHandler(reg)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/register", strings.NewReader("not json"))
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

// TestRegisterHandler_InternalError verifies that unexpected errors from the
// service layer result in 500 INTERNAL_ERROR.
func TestRegisterHandler_InternalError(t *testing.T) {
	reg := &stubAuthService{err: errors.New("database connection refused")}
	h := registerHandler(reg)

	body := `{"email":"alice@example.com","password":"securepassword"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/register", strings.NewReader(body))
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

// TestMountAuth_RegistersRoute verifies that MountAuth registers the register
// endpoint on the server and it responds to POST /v1/auth/register.
func TestMountAuth_RegistersRoute(t *testing.T) {
	s := testServer(t)
	svc := &stubAuthService{token: "test-token"}
	s.MountAuth(svc)

	body := `{"email":"alice@example.com","password":"securepassword"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/register", strings.NewReader(body))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201 from mounted route, got %d", rec.Code)
	}
}

// TestMountAuth_RegistersLoginRoute verifies that MountAuth registers the login
// endpoint on the server and it responds to POST /v1/auth/login.
func TestMountAuth_RegistersLoginRoute(t *testing.T) {
	s := testServer(t)
	svc := &stubAuthService{token: "test-token"}
	s.MountAuth(svc)

	body := `{"email":"alice@example.com","password":"securepassword"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(body))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 from mounted route, got %d", rec.Code)
	}
}

// TestLoginHandler_Success verifies that a successful login returns 200 OK with
// the token in the response body.
func TestLoginHandler_Success(t *testing.T) {
	svc := &stubAuthService{token: "opaque-token-abc123"}
	h := loginHandler(svc)

	body := `{"email":"alice@example.com","password":"securepassword"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(body))
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
	token, ok := env.Data["token"].(string)
	if !ok || token == "" {
		t.Errorf("expected non-empty token in data, got: %+v", env.Data)
	}
	if token != "opaque-token-abc123" {
		t.Errorf("expected token opaque-token-abc123, got %q", token)
	}
}

// TestLoginHandler_MalformedJSON verifies that a non-JSON body results in
// 400 BAD_REQUEST.
func TestLoginHandler_MalformedJSON(t *testing.T) {
	svc := &stubAuthService{}
	h := loginHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader("not json"))
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

// TestLoginHandler_InvalidCredentials verifies that ErrInvalidCredentials from
// the service layer results in 401 UNAUTHORIZED.
func TestLoginHandler_InvalidCredentials(t *testing.T) {
	svc := &stubAuthService{err: auth.ErrInvalidCredentials}
	h := loginHandler(svc)

	body := `{"email":"alice@example.com","password":"wrongpassword"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(body))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}

	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeUnauthorized {
		t.Errorf("expected error code %q, got %q", ErrCodeUnauthorized, env.Error.Code)
	}
}

// TestLoginHandler_InternalError verifies that unexpected errors from the
// service layer result in 500 INTERNAL_ERROR.
func TestLoginHandler_InternalError(t *testing.T) {
	svc := &stubAuthService{err: errors.New("database connection refused")}
	h := loginHandler(svc)

	body := `{"email":"alice@example.com","password":"securepassword"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(body))
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

// TestLogoutHandler_Success verifies that a valid Bearer token results in 204 No Content.
func TestLogoutHandler_Success(t *testing.T) {
	svc := &stubAuthService{}
	h := logoutHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/logout", nil)
	req.Header.Set("Authorization", "Bearer valid-token-abc123")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", rec.Code)
	}
}

// TestLogoutHandler_MissingAuthHeader verifies that an absent Authorization header
// results in 401 Unauthorized.
func TestLogoutHandler_MissingAuthHeader(t *testing.T) {
	svc := &stubAuthService{}
	h := logoutHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/logout", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}

	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeUnauthorized {
		t.Errorf("expected error code %q, got %q", ErrCodeUnauthorized, env.Error.Code)
	}
}

// TestLogoutHandler_MalformedAuthHeader verifies that a non-Bearer Authorization
// header results in 401 Unauthorized.
func TestLogoutHandler_MalformedAuthHeader(t *testing.T) {
	svc := &stubAuthService{}
	h := logoutHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/logout", nil)
	req.Header.Set("Authorization", "notbearer token")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}

	var env Envelope[any]
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeUnauthorized {
		t.Errorf("expected error code %q, got %q", ErrCodeUnauthorized, env.Error.Code)
	}
}

// TestLogoutHandler_InternalError verifies that a Logout service error results in 500.
func TestLogoutHandler_InternalError(t *testing.T) {
	svc := &stubAuthService{err: errors.New("database unreachable")}
	h := logoutHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/logout", nil)
	req.Header.Set("Authorization", "Bearer valid-token-abc123")
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

// TestMountAuth_RegistersLogoutRoute verifies that MountAuth registers the logout
// endpoint and it responds to POST /v1/auth/logout.
func TestMountAuth_RegistersLogoutRoute(t *testing.T) {
	s := testServer(t)
	svc := &stubAuthService{}
	s.MountAuth(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/logout", nil)
	req.Header.Set("Authorization", "Bearer some-valid-token")
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected 204 from mounted route, got %d", rec.Code)
	}
}
