package server

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/evanisnor/quotecraft/api/internal/auth"
)

// TokenValidator validates a raw session token and returns the authenticated user's ID.
// Defined here at the consumer (server package) per the interfaces-where-consumed convention.
type TokenValidator interface {
	ValidateToken(ctx context.Context, rawToken string) (string, error)
}

// authUserKey is an unexported context key type for the authenticated user ID.
type authUserKey struct{}

// UserIDFromContext returns the authenticated user ID stored in the context by
// RequireAuth middleware. Returns ("", false) if not set.
func UserIDFromContext(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(authUserKey{}).(string)
	return id, ok && id != ""
}

// RequireAuth returns middleware that validates the Bearer token in the Authorization
// header and stores the authenticated user ID in the request context.
//
// Responds with 401 Unauthorized if the header is missing, malformed, or the token
// is invalid/expired (auth.ErrInvalidSession). Returns 500 Internal Server Error for
// unexpected service errors.
func RequireAuth(v TokenValidator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractBearerToken(r)
			if token == "" {
				WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, "missing or invalid authorization header")
				return
			}
			userID, err := v.ValidateToken(r.Context(), token)
			if err != nil {
				if errors.Is(err, auth.ErrInvalidSession) {
					WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, "invalid or expired session")
					return
				}
				LoggerFrom(r.Context()).Error("validating session token", "error", err)
				WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
				return
			}
			ctx := context.WithValue(r.Context(), authUserKey{}, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

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

// Logouter invalidates an existing session by raw token.
// Defined here at the consumer (server package) per the interfaces-where-consumed convention.
type Logouter interface {
	Logout(ctx context.Context, token string) error
}

// PasswordForgetter initiates a password reset for an email address.
// Defined here at the consumer (server package) per the interfaces-where-consumed convention.
type PasswordForgetter interface {
	ForgotPassword(ctx context.Context, email string) error
}

// PasswordResetter completes a password reset using a raw reset token.
// Defined here at the consumer (server package) per the interfaces-where-consumed convention.
type PasswordResetter interface {
	ResetPassword(ctx context.Context, rawToken, newPassword string) error
}

// AuthService is the full set of authentication capabilities consumed by the server.
type AuthService interface {
	Registrar
	Authenticator
	Logouter
	TokenValidator
	PasswordForgetter
	PasswordResetter
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

// forgotPasswordRequest is the JSON body expected by POST /v1/auth/forgot-password.
type forgotPasswordRequest struct {
	Email string `json:"email"`
}

// resetPasswordRequest is the JSON body expected by POST /v1/auth/reset-password.
type resetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
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

// extractBearerToken parses the Authorization header and returns the raw token.
// Returns an empty string if the header is absent or does not start with "Bearer ".
func extractBearerToken(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return ""
	}
	return strings.TrimPrefix(h, "Bearer ")
}

// logoutHandler returns an http.HandlerFunc that handles POST /v1/auth/logout.
func logoutHandler(auth Logouter) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := extractBearerToken(r)
		if token == "" {
			WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, "missing or invalid authorization header")
			return
		}
		if err := auth.Logout(r.Context(), token); err != nil {
			LoggerFrom(r.Context()).Error("logout", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

// forgotPasswordHandler returns an http.HandlerFunc that handles POST /v1/auth/forgot-password.
// Always responds 200 OK to prevent user enumeration — the caller cannot determine
// whether the email address is registered.
func forgotPasswordHandler(fp PasswordForgetter) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body forgotPasswordRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, "malformed request body")
			return
		}

		if err := fp.ForgotPassword(r.Context(), body.Email); err != nil {
			LoggerFrom(r.Context()).Error("forgot password", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

// resetPasswordHandler returns an http.HandlerFunc that handles POST /v1/auth/reset-password.
func resetPasswordHandler(rp PasswordResetter) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body resetPasswordRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, "malformed request body")
			return
		}

		if err := rp.ResetPassword(r.Context(), body.Token, body.NewPassword); err != nil {
			if errors.Is(err, auth.ErrInvalidResetToken) {
				WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, "invalid or expired reset token")
				return
			}
			if errors.Is(err, auth.ErrInvalidInput) {
				msg := strings.TrimPrefix(err.Error(), "invalid input: ")
				WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, msg)
				return
			}
			LoggerFrom(r.Context()).Error("reset password", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// MountAuth registers all authentication routes on the server's private route group.
func (s *Server) MountAuth(svc AuthService) {
	s.privateGroup.Post("/auth/register", registerHandler(svc))
	s.privateGroup.Post("/auth/login", loginHandler(svc))
	s.privateGroup.Post("/auth/logout", logoutHandler(svc))
	s.privateGroup.Post("/auth/forgot-password", forgotPasswordHandler(svc))
	s.privateGroup.Post("/auth/reset-password", resetPasswordHandler(svc))
}
