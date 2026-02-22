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

// ErrSessionNotFound is returned by SessionReader when no session matches the token hash.
var ErrSessionNotFound = errors.New("session not found")

// ErrInvalidSession is returned by ValidateToken when the token is missing, expired, or unknown.
var ErrInvalidSession = errors.New("invalid session")

// dummyHash is a pre-computed bcrypt hash (cost 12) used to perform a constant-time
// comparison when a user is not found, preventing timing-based user enumeration.
// The plaintext is irrelevant — no valid password will ever match it.
var dummyHash = []byte("$2a$12$mCUnvq4OCM9ToWDg0VnHYeC30hMe9sgpRL2QFPBq4TwJSKEO946lK")

// ErrInvalidInput is returned when registration parameters fail validation.
var ErrInvalidInput = errors.New("invalid input")

// ErrInvalidCredentials is returned when login credentials do not match any account.
var ErrInvalidCredentials = errors.New("invalid credentials")

// ErrUserNotFound is returned by UserReader when no user matches the query.
var ErrUserNotFound = errors.New("user not found")

// User represents a registered user account.
type User struct {
	ID           string
	Email        string
	PasswordHash string
	CreatedAt    time.Time
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

// UserReader fetches existing user records.
type UserReader interface {
	GetUserByEmail(ctx context.Context, email string) (*User, error)
}

// SessionWriter creates new session records.
type SessionWriter interface {
	CreateSession(ctx context.Context, userID, tokenHash string, expiresAt time.Time) (*Session, error)
}

// SessionDeleter deletes session records.
type SessionDeleter interface {
	DeleteSession(ctx context.Context, tokenHash string) error
}

// SessionReader fetches session records.
type SessionReader interface {
	GetSession(ctx context.Context, tokenHash string) (*Session, error)
}

// passwordHasher hashes a plaintext password. Abstracted for testability.
type passwordHasher func(password []byte, cost int) ([]byte, error)

// passwordVerifier compares a bcrypt hash against a plaintext password.
// Abstracted for testability — allows tests to inject a stub verifier.
type passwordVerifier func(hash, password []byte) error

// tokenGenerator generates an opaque token and its SHA-256 hash.
// Abstracted for testability — allows tests to inject a failing generator.
type tokenGenerator func() (token, tokenHash string, err error)

// Service handles authentication business logic.
type Service struct {
	users          UserWriter
	userReader     UserReader
	sessions       SessionWriter
	sessionDeleter SessionDeleter
	sessionReader  SessionReader
	hasher         passwordHasher
	verifier       passwordVerifier
	genToken       tokenGenerator
}

// NewService creates an auth Service with the given repositories.
func NewService(users UserWriter, userReader UserReader, sessions SessionWriter, sessionDeleter SessionDeleter, sessionReader SessionReader) *Service {
	return &Service{
		users:          users,
		userReader:     userReader,
		sessions:       sessions,
		sessionDeleter: sessionDeleter,
		sessionReader:  sessionReader,
		hasher:         bcrypt.GenerateFromPassword,
		verifier:       bcrypt.CompareHashAndPassword,
		genToken:       generateToken,
	}
}

// newServiceForTest creates an auth Service with injectable dependencies.
// Used in tests to exercise specific code paths without production side-effects.
func newServiceForTest(users UserWriter, userReader UserReader, sessions SessionWriter, sessionDeleter SessionDeleter, sessionReader SessionReader, hasher passwordHasher, verifier passwordVerifier, gen tokenGenerator) *Service {
	return &Service{
		users:          users,
		userReader:     userReader,
		sessions:       sessions,
		sessionDeleter: sessionDeleter,
		sessionReader:  sessionReader,
		hasher:         hasher,
		verifier:       verifier,
		genToken:       gen,
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

// Login validates the given credentials and, on success, creates a new session
// and returns an opaque token.
//
// Returns ErrInvalidCredentials if the email is not registered or the password
// does not match, so callers cannot distinguish which field was wrong.
func (s *Service) Login(ctx context.Context, email, password string) (string, error) {
	user, err := s.userReader.GetUserByEmail(ctx, email)
	notFound := errors.Is(err, ErrUserNotFound)
	if err != nil && !notFound {
		return "", fmt.Errorf("looking up user: %w", err)
	}

	// Always run bcrypt to prevent timing-based user enumeration.
	// If the user was not found, compare against a pre-computed dummy hash.
	hashToVerify := dummyHash
	if !notFound {
		hashToVerify = []byte(user.PasswordHash)
	}
	verifyErr := s.verifier(hashToVerify, []byte(password))
	if notFound || verifyErr != nil {
		return "", ErrInvalidCredentials
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

// Logout invalidates the session associated with the given raw token by deleting
// it from the session store. If the session does not exist, no error is returned
// (the operation is idempotent).
func (s *Service) Logout(ctx context.Context, token string) error {
	h := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(h[:])
	return s.sessionDeleter.DeleteSession(ctx, tokenHash)
}

// ValidateToken hashes the raw token, looks up the corresponding session,
// and checks that it has not expired. Returns the session's user ID on success.
//
// Returns ErrInvalidSession if the token is not found, the session has expired,
// or any other validation failure. Returns a wrapped error for unexpected
// repository failures.
func (s *Service) ValidateToken(ctx context.Context, rawToken string) (string, error) {
	h := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(h[:])

	sess, err := s.sessionReader.GetSession(ctx, tokenHash)
	if errors.Is(err, ErrSessionNotFound) {
		return "", ErrInvalidSession
	}
	if err != nil {
		return "", fmt.Errorf("looking up session: %w", err)
	}
	if sess.ExpiresAt.Before(time.Now().UTC()) {
		return "", ErrInvalidSession
	}
	return sess.UserID, nil
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
	return generateTokenFrom(rand.Reader)
}

// generateTokenFrom generates a token using the provided reader.
// Separated from generateToken to allow tests to inject a failing reader.
func generateTokenFrom(r io.Reader) (token, tokenHash string, err error) {
	buf := make([]byte, 32)
	if _, err := io.ReadFull(r, buf); err != nil {
		return "", "", fmt.Errorf("reading random bytes: %w", err)
	}

	token = base64.RawURLEncoding.EncodeToString(buf)

	h := sha256.Sum256([]byte(token))
	tokenHash = hex.EncodeToString(h[:])

	return token, tokenHash, nil
}
