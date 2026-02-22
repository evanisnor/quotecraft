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
	reg := &stubRegistrar{token: "opaque-token-abc123"}
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
	reg := &stubRegistrar{err: auth.ErrEmailConflict}
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
	reg := &stubRegistrar{err: fmt.Errorf("%w: password must be at least 8 characters", auth.ErrInvalidInput)}
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
	reg := &stubRegistrar{}
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
	reg := &stubRegistrar{err: errors.New("database connection refused")}
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
	reg := &stubRegistrar{token: "test-token"}
	s.MountAuth(reg)

	body := `{"email":"alice@example.com","password":"securepassword"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/register", strings.NewReader(body))
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201 from mounted route, got %d", rec.Code)
	}
}
