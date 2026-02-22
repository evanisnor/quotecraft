// Package auth implements user registration and session management.
package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/mail"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// ErrEmailConflict is returned when the email address is already registered.
var ErrEmailConflict = errors.New("email already registered")

// ErrInvalidInput is returned when registration parameters fail validation.
var ErrInvalidInput = errors.New("invalid input")

// User represents a registered user account.
type User struct {
	ID        string
	Email     string
	CreatedAt time.Time
}

// Session represents an active user session.
type Session struct {
	ID        string
	UserID    string
	TokenHash string
	CreatedAt time.Time
	ExpiresAt time.Time
}

// UserWriter creates new user records.
type UserWriter interface {
	CreateUser(ctx context.Context, email, passwordHash string) (*User, error)
}

// SessionWriter creates new session records.
type SessionWriter interface {
	CreateSession(ctx context.Context, userID, tokenHash string, expiresAt time.Time) (*Session, error)
}

// passwordHasher hashes a plaintext password. Abstracted for testability.
type passwordHasher func(password []byte, cost int) ([]byte, error)

// tokenGenerator generates an opaque token and its SHA-256 hash.
// Abstracted for testability — allows tests to inject a failing generator.
type tokenGenerator func() (token, tokenHash string, err error)

// Service handles authentication business logic.
type Service struct {
	users    UserWriter
	sessions SessionWriter
	hasher   passwordHasher
	genToken tokenGenerator
}

// NewService creates an auth Service with the given repositories.
func NewService(users UserWriter, sessions SessionWriter) *Service {
	return &Service{
		users:    users,
		sessions: sessions,
		hasher:   bcrypt.GenerateFromPassword,
		genToken: generateToken,
	}
}

// newServiceForTest creates an auth Service with injectable dependencies.
// Used in tests to exercise specific code paths without production side-effects.
func newServiceForTest(users UserWriter, sessions SessionWriter, hasher passwordHasher, gen tokenGenerator) *Service {
	return &Service{
		users:    users,
		sessions: sessions,
		hasher:   hasher,
		genToken: gen,
	}
}

// Register creates a new user account and returns an opaque session token.
//
// Validation rules:
//   - email must be a valid RFC 5322 address
//   - password must be at least 8 characters
//
// Returns ErrInvalidInput if validation fails.
// Returns ErrEmailConflict if the email is already registered.
func (s *Service) Register(ctx context.Context, email, password string) (string, error) {
	if err := validateRegistrationInput(email, password); err != nil {
		return "", err
	}

	hash, err := s.hasher([]byte(password), 12)
	if err != nil {
		return "", fmt.Errorf("hashing password: %w", err)
	}

	user, err := s.users.CreateUser(ctx, email, string(hash))
	if err != nil {
		return "", fmt.Errorf("creating user: %w", err)
	}

	token, tokenHash, err := s.genToken()
	if err != nil {
		return "", fmt.Errorf("generating session token: %w", err)
	}

	if _, err := s.sessions.CreateSession(ctx, user.ID, tokenHash, time.Now().UTC().Add(24*time.Hour)); err != nil {
		return "", fmt.Errorf("creating session: %w", err)
	}

	return token, nil
}

// validateRegistrationInput checks email and password constraints.
func validateRegistrationInput(email, password string) error {
	if _, err := mail.ParseAddress(email); err != nil {
		return fmt.Errorf("%w: email is invalid", ErrInvalidInput)
	}
	if len(password) < 8 {
		return fmt.Errorf("%w: password must be at least 8 characters", ErrInvalidInput)
	}
	return nil
}

// generateToken generates a cryptographically random 32-byte opaque token
// (base64url encoded, no padding) and its SHA-256 hash (lowercase hex).
// Returns an error if the system entropy source fails.
func generateToken() (token, tokenHash string, err error) {
	buf := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, buf); err != nil {
		return "", "", fmt.Errorf("reading random bytes: %w", err)
	}

	token = base64.RawURLEncoding.EncodeToString(buf)

	h := sha256.Sum256([]byte(token))
	tokenHash = hex.EncodeToString(h[:])

	return token, tokenHash, nil
}
