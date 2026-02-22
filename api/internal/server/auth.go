package server

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/evanisnor/quotecraft/api/internal/auth"
)

// Registrar creates new user accounts and returns a session token.
// Defined here at the consumer (server package) per the interfaces-where-consumed convention.
type Registrar interface {
	Register(ctx context.Context, email, password string) (token string, err error)
}

// Authenticator validates credentials and issues a session token.
// Defined here at the consumer (server package) per the interfaces-where-consumed convention.
type Authenticator interface {
	Login(ctx context.Context, email, password string) (token string, err error)
}

// AuthService is the full set of authentication capabilities consumed by the server.
type AuthService interface {
	Registrar
	Authenticator
}

// registerRequest is the JSON body expected by POST /v1/auth/register.
type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// registerResponse is the data payload returned on successful registration.
type registerResponse struct {
	Token string `json:"token"`
}

// loginRequest is the JSON body expected by POST /v1/auth/login.
type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// loginResponse is the data payload returned on successful login.
type loginResponse struct {
	Token string `json:"token"`
}

// registerHandler returns an http.HandlerFunc that handles POST /v1/auth/register.
func registerHandler(reg Registrar) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body registerRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, "malformed request body")
			return
		}

		token, err := reg.Register(r.Context(), body.Email, body.Password)
		if err != nil {
			if errors.Is(err, auth.ErrEmailConflict) {
				WriteError(w, http.StatusConflict, ErrCodeConflict, "email already registered")
				return
			}
			if errors.Is(err, auth.ErrInvalidInput) {
				// Strip the "invalid input: " sentinel prefix from the message
				// so the client receives only the human-readable detail.
				msg := strings.TrimPrefix(err.Error(), "invalid input: ")
				WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, msg)
				return
			}
			LoggerFrom(r.Context()).Error("registering user", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}

		WriteJSON(w, http.StatusCreated, registerResponse{Token: token})
	}
}

// loginHandler returns an http.HandlerFunc that handles POST /v1/auth/login.
func loginHandler(a Authenticator) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body loginRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, "malformed request body")
			return
		}

		token, err := a.Login(r.Context(), body.Email, body.Password)
		if err != nil {
			if errors.Is(err, auth.ErrInvalidCredentials) {
				WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, "invalid credentials")
				return
			}
			LoggerFrom(r.Context()).Error("login", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}

		WriteJSON(w, http.StatusOK, loginResponse{Token: token})
	}
}

// MountAuth registers all authentication routes on the server's private route group.
func (s *Server) MountAuth(svc AuthService) {
	s.privateGroup.Post("/auth/register", registerHandler(svc))
	s.privateGroup.Post("/auth/login", loginHandler(svc))
}
