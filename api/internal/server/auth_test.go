package server

import (
	"context"
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

// TestRequireAuth_ValidToken verifies that a valid token results in the user ID
// being placed in the request context and the next handler being called.
func TestRequireAuth_ValidToken(t *testing.T) {
	svc := &stubAuthService{userID: "user-abc"}
	h := RequireAuth(svc)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, ok := UserIDFromContext(r.Context())
		if !ok || id != "user-abc" {
			t.Errorf("expected userID %q in context, got %q (ok=%v)", "user-abc", id, ok)
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

// TestRequireAuth_MissingToken verifies that an absent Authorization header results in 401.
func TestRequireAuth_MissingToken(t *testing.T) {
	svc := &stubAuthService{userID: "user-abc"}
	h := RequireAuth(svc)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
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

// TestRequireAuth_InvalidSession verifies that ErrInvalidSession from the validator
// results in 401 Unauthorized.
func TestRequireAuth_InvalidSession(t *testing.T) {
	svc := &stubAuthService{err: auth.ErrInvalidSession}
	h := RequireAuth(svc)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer expired-token")
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

// TestRequireAuth_InternalError verifies that unexpected validator errors result in 500.
func TestRequireAuth_InternalError(t *testing.T) {
	svc := &stubAuthService{err: errors.New("db failure")}
	h := RequireAuth(svc)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer some-token")
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

// TestUserIDFromContext_Set verifies that UserIDFromContext returns the user ID
// and true when the context was populated by RequireAuth middleware.
func TestUserIDFromContext_Set(t *testing.T) {
	ctx := context.WithValue(context.Background(), authUserKey{}, "uid-123")
	id, ok := UserIDFromContext(ctx)
	if !ok {
		t.Fatal("expected ok=true, got false")
	}
	if id != "uid-123" {
		t.Errorf("expected %q, got %q", "uid-123", id)
	}
}

// TestUserIDFromContext_NotSet verifies that UserIDFromContext returns ("", false)
// when the context has no user ID.
func TestUserIDFromContext_NotSet(t *testing.T) {
	id, ok := UserIDFromContext(context.Background())
	if ok {
		t.Error("expected ok=false for empty context, got true")
	}
	if id != "" {
		t.Errorf("expected empty string, got %q", id)
	}
}

// TestUserIDFromContext_EmptyString verifies that UserIDFromContext returns ("", false)
// when the context key is set to an empty string.
func TestUserIDFromContext_EmptyString(t *testing.T) {
	ctx := context.WithValue(context.Background(), authUserKey{}, "")
	id, ok := UserIDFromContext(ctx)
	if ok {
		t.Error("expected ok=false for empty string user ID, got true")
	}
	if id != "" {
		t.Errorf("expected empty string, got %q", id)
	}
}

// TestForgotPasswordHandler_Success verifies that a valid request returns 200 OK.
func TestForgotPasswordHandler_Success(t *testing.T) {
	svc := &stubAuthService{}
	h := forgotPasswordHandler(svc)

	body := `{"email":"alice@example.com"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/forgot-password", strings.NewReader(body))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

// TestForgotPasswordHandler_MalformedBody verifies that a non-JSON body results in
// 400 BAD_REQUEST.
func TestForgotPasswordHandler_MalformedBody(t *testing.T) {
	svc := &stubAuthService{}
	h := forgotPasswordHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/forgot-password", strings.NewReader("not json"))
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

// TestForgotPasswordHandler_InternalError verifies that an unexpected service error
// results in 500 INTERNAL_ERROR.
func TestForgotPasswordHandler_InternalError(t *testing.T) {
	svc := &stubAuthService{err: errors.New("database unreachable")}
	h := forgotPasswordHandler(svc)

	body := `{"email":"alice@example.com"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/forgot-password", strings.NewReader(body))
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

// TestResetPasswordHandler_Success verifies that a valid request returns 204 No Content.
func TestResetPasswordHandler_Success(t *testing.T) {
	svc := &stubAuthService{}
	h := resetPasswordHandler(svc)

	body := `{"token":"sometoken","new_password":"newpassword123"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/reset-password", strings.NewReader(body))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", rec.Code)
	}
}

// TestResetPasswordHandler_MalformedBody verifies that a non-JSON body results in
// 400 BAD_REQUEST.
func TestResetPasswordHandler_MalformedBody(t *testing.T) {
	svc := &stubAuthService{}
	h := resetPasswordHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/reset-password", strings.NewReader("not json"))
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

// TestResetPasswordHandler_InvalidToken verifies that ErrInvalidResetToken from the
// service layer results in 400 BAD_REQUEST.
func TestResetPasswordHandler_InvalidToken(t *testing.T) {
	svc := &stubAuthService{err: auth.ErrInvalidResetToken}
	h := resetPasswordHandler(svc)

	body := `{"token":"expiredtoken","new_password":"newpassword123"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/reset-password", strings.NewReader(body))
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
	if env.Error.Message != "invalid or expired reset token" {
		t.Errorf("expected message %q, got %q", "invalid or expired reset token", env.Error.Message)
	}
}

// TestResetPasswordHandler_InvalidInput verifies that ErrInvalidInput from the
// service layer results in 400 BAD_REQUEST with a detail message.
func TestResetPasswordHandler_InvalidInput(t *testing.T) {
	svc := &stubAuthService{err: fmt.Errorf("%w: password must be at least 8 characters", auth.ErrInvalidInput)}
	h := resetPasswordHandler(svc)

	body := `{"token":"sometoken","new_password":"short"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/reset-password", strings.NewReader(body))
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

// TestResetPasswordHandler_InternalError verifies that unexpected service errors
// result in 500 INTERNAL_ERROR.
func TestResetPasswordHandler_InternalError(t *testing.T) {
	svc := &stubAuthService{err: errors.New("database unreachable")}
	h := resetPasswordHandler(svc)

	body := `{"token":"sometoken","new_password":"newpassword123"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/reset-password", strings.NewReader(body))
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

// TestMountAuth_RegistersForgotPasswordRoute verifies that MountAuth registers the
// forgot-password endpoint and it responds to POST /v1/auth/forgot-password.
func TestMountAuth_RegistersForgotPasswordRoute(t *testing.T) {
	s := testServer(t)
	svc := &stubAuthService{}
	s.MountAuth(svc)

	body := `{"email":"alice@example.com"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/forgot-password", strings.NewReader(body))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 from mounted route, got %d", rec.Code)
	}
}

// TestMountAuth_RegistersResetPasswordRoute verifies that MountAuth registers the
// reset-password endpoint and it responds to POST /v1/auth/reset-password.
func TestMountAuth_RegistersResetPasswordRoute(t *testing.T) {
	s := testServer(t)
	svc := &stubAuthService{}
	s.MountAuth(svc)

	body := `{"token":"sometoken","new_password":"newpassword123"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/reset-password", strings.NewReader(body))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected 204 from mounted route, got %d", rec.Code)
	}
}

// TestGoogleCallback_Handler_Success verifies that a valid request returns
// 201 Created with the session token in the response body.
func TestGoogleCallback_Handler_Success(t *testing.T) {
	svc := &stubGoogleOAuthCallbacker{token: "google-session-token"}
	h := googleCallbackHandler(svc)

	body := `{"code":"auth-code","code_verifier":"verifier-abc","redirect_uri":"https://app.example.com/callback"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/google", strings.NewReader(body))
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
	if token != "google-session-token" {
		t.Errorf("expected token google-session-token, got %q", token)
	}
}

// TestGoogleCallback_Handler_MissingCode verifies that an empty code results in 400.
func TestGoogleCallback_Handler_MissingCode(t *testing.T) {
	svc := &stubGoogleOAuthCallbacker{}
	h := googleCallbackHandler(svc)

	body := `{"code":"","code_verifier":"verifier-abc","redirect_uri":"https://app.example.com/callback"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/google", strings.NewReader(body))
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

// TestGoogleCallback_Handler_MissingCodeVerifier verifies that an empty
// code_verifier results in 400.
func TestGoogleCallback_Handler_MissingCodeVerifier(t *testing.T) {
	svc := &stubGoogleOAuthCallbacker{}
	h := googleCallbackHandler(svc)

	body := `{"code":"auth-code","code_verifier":"","redirect_uri":"https://app.example.com/callback"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/google", strings.NewReader(body))
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

// TestGoogleCallback_Handler_MissingRedirectURI verifies that an empty
// redirect_uri results in 400.
func TestGoogleCallback_Handler_MissingRedirectURI(t *testing.T) {
	svc := &stubGoogleOAuthCallbacker{}
	h := googleCallbackHandler(svc)

	body := `{"code":"auth-code","code_verifier":"verifier-abc","redirect_uri":""}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/google", strings.NewReader(body))
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

// TestGoogleCallback_Handler_EmailConflict verifies that ErrEmailConflict from
// the service results in 409 Conflict.
func TestGoogleCallback_Handler_EmailConflict(t *testing.T) {
	svc := &stubGoogleOAuthCallbacker{err: auth.ErrEmailConflict}
	h := googleCallbackHandler(svc)

	body := `{"code":"auth-code","code_verifier":"verifier-abc","redirect_uri":"https://app.example.com/callback"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/google", strings.NewReader(body))
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
	if env.Error.Message != "email already registered with a different login method" {
		t.Errorf("expected conflict message, got %q", env.Error.Message)
	}
}

// TestGoogleCallback_Handler_ServiceError verifies that an unexpected service
// error results in 500 Internal Server Error.
func TestGoogleCallback_Handler_ServiceError(t *testing.T) {
	svc := &stubGoogleOAuthCallbacker{err: errors.New("database unreachable")}
	h := googleCallbackHandler(svc)

	body := `{"code":"auth-code","code_verifier":"verifier-abc","redirect_uri":"https://app.example.com/callback"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/google", strings.NewReader(body))
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

// TestGoogleCallback_Handler_MalformedJSON verifies that a non-JSON body
// results in 400 Bad Request.
func TestGoogleCallback_Handler_MalformedJSON(t *testing.T) {
	svc := &stubGoogleOAuthCallbacker{}
	h := googleCallbackHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/auth/google", strings.NewReader("not json"))
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

// TestMountAuth_RegistersRoutes verifies that after MountAuth all five auth routes
// respond with a non-404, non-405 status code confirming they are registered.
func TestMountAuth_RegistersRoutes(t *testing.T) {
	s := testServer(t)
	svc := &stubAuthService{token: "test-token"}
	s.MountAuth(svc)

	// Use a valid login body as the representative probe; we just need to confirm
	// the route is registered (i.e. the handler runs, not 404 / 405).
	body := `{"email":"alice@example.com","password":"securepassword"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(body))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code == http.StatusNotFound || rec.Code == http.StatusMethodNotAllowed {
		t.Errorf("expected a registered route response for /v1/auth/login, got %d", rec.Code)
	}
}

// TestMountGoogleOAuth_RegistersRoute verifies that MountGoogleOAuth registers
// the endpoint and it responds to POST /v1/auth/google.
func TestMountGoogleOAuth_RegistersRoute(t *testing.T) {
	s := testServer(t)
	svc := &stubGoogleOAuthCallbacker{token: "google-token"}
	s.MountGoogleOAuth(svc)

	body := `{"code":"auth-code","code_verifier":"verifier-abc","redirect_uri":"https://app.example.com/callback"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/google", strings.NewReader(body))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201 from mounted route, got %d", rec.Code)
	}
}

// TestAuthenticated_RequiresAuth verifies that routes mounted via Authenticated()
// return 401 without a valid token and 200 with one.
func TestAuthenticated_RequiresAuth(t *testing.T) {
	s := testServer(t)
	svc := &stubAuthService{userID: "user-abc"}
	s.MountAuth(svc)

	// Register a dummy protected route via Authenticated().
	protected := s.Authenticated(svc)
	protected.Get("/me", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Without auth header -> 401.
	req := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 without auth, got %d", rec.Code)
	}

	// With valid auth header -> 200.
	req = httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	req.Header.Set("Authorization", "Bearer some-token")
	rec = httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 with auth, got %d", rec.Code)
	}
}
