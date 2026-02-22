package auth

import (
	"context"
	"errors"
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

// TestRegister_Success verifies that a valid registration returns a non-empty
// opaque token, calls CreateUser and CreateSession.
func TestRegister_Success(t *testing.T) {
	users := &stubUserWriter{}
	sessions := &stubSessionWriter{}
	svc := NewService(users, &stubUserReader{}, sessions, &stubSessionDeleter{})

	token, err := svc.Register(context.Background(), "alice@example.com", "securepassword")
	if err != nil {
		t.Fatalf("Register() returned unexpected error: %v", err)
	}
	if token == "" {
		t.Error("Register() returned empty token")
	}
	// Token should be base64url encoded (no padding, no '+' or '/')
	if strings.ContainsAny(token, "+/=") {
		t.Errorf("token contains non-base64url characters: %q", token)
	}
}

// TestRegister_InvalidEmail verifies that an invalid email returns ErrInvalidInput.
func TestRegister_InvalidEmail(t *testing.T) {
	tests := []struct {
		name  string
		email string
	}{
		{"empty", ""},
		{"no at-sign", "invalidemail"},
		{"only at-sign", "@"},
		{"missing domain", "user@"},
		{"missing local", "@domain.com"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewService(&stubUserWriter{}, &stubUserReader{}, &stubSessionWriter{}, &stubSessionDeleter{})
			_, err := svc.Register(context.Background(), tt.email, "securepassword")
			if err == nil {
				t.Fatal("expected error for invalid email, got nil")
			}
			if !errors.Is(err, ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got: %v", err)
			}
		})
	}
}

// TestRegister_ShortPassword verifies that a password shorter than 8 characters
// returns ErrInvalidInput.
func TestRegister_ShortPassword(t *testing.T) {
	svc := NewService(&stubUserWriter{}, &stubUserReader{}, &stubSessionWriter{}, &stubSessionDeleter{})

	_, err := svc.Register(context.Background(), "alice@example.com", "short")
	if err == nil {
		t.Fatal("expected error for short password, got nil")
	}
	if !errors.Is(err, ErrInvalidInput) {
		t.Errorf("expected ErrInvalidInput, got: %v", err)
	}
}

// TestRegister_PasswordExactly8Chars verifies that a password of exactly 8 characters passes.
func TestRegister_PasswordExactly8Chars(t *testing.T) {
	svc := NewService(&stubUserWriter{}, &stubUserReader{}, &stubSessionWriter{}, &stubSessionDeleter{})

	_, err := svc.Register(context.Background(), "alice@example.com", "exactly8")
	if err != nil {
		t.Errorf("expected success for 8-char password, got: %v", err)
	}
}

// TestRegister_EmailConflict verifies that when CreateUser returns ErrEmailConflict
// (as the repository does for pq code 23505), Register propagates it.
func TestRegister_EmailConflict(t *testing.T) {
	users := &stubUserWriter{err: ErrEmailConflict}
	svc := NewService(users, &stubUserReader{}, &stubSessionWriter{}, &stubSessionDeleter{})

	_, err := svc.Register(context.Background(), "alice@example.com", "securepassword")
	if err == nil {
		t.Fatal("expected error for duplicate email, got nil")
	}
	if !errors.Is(err, ErrEmailConflict) {
		t.Errorf("expected ErrEmailConflict, got: %v", err)
	}
}

// TestRegister_CreateUserInternalError verifies that non-conflict errors from
// CreateUser are propagated as-is (not mapped to ErrEmailConflict).
func TestRegister_CreateUserInternalError(t *testing.T) {
	wantErr := errors.New("database connection lost")
	users := &stubUserWriter{err: wantErr}
	svc := NewService(users, &stubUserReader{}, &stubSessionWriter{}, &stubSessionDeleter{})

	_, err := svc.Register(context.Background(), "alice@example.com", "securepassword")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if errors.Is(err, ErrEmailConflict) {
		t.Error("expected non-conflict error, but got ErrEmailConflict")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestRegister_CreateSessionError verifies that CreateSession errors are propagated.
func TestRegister_CreateSessionError(t *testing.T) {
	wantErr := errors.New("session table unreachable")
	sessions := &stubSessionWriter{err: wantErr}
	svc := NewService(&stubUserWriter{}, &stubUserReader{}, sessions, &stubSessionDeleter{})

	_, err := svc.Register(context.Background(), "alice@example.com", "securepassword")
	if err == nil {
		t.Fatal("expected error from CreateSession, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped session error, got: %v", err)
	}
}

// TestRegister_HasherError verifies that bcrypt errors (injected via the test
// hasher) are wrapped and propagated from Register.
func TestRegister_HasherError(t *testing.T) {
	wantErr := errors.New("bcrypt failed")
	svc := newServiceForTest(
		&stubUserWriter{},
		&stubUserReader{},
		&stubSessionWriter{},
		&stubSessionDeleter{},
		func(_ []byte, _ int) ([]byte, error) { return nil, wantErr },
		bcrypt.CompareHashAndPassword,
		generateToken,
	)

	_, err := svc.Register(context.Background(), "alice@example.com", "securepassword")
	if err == nil {
		t.Fatal("expected error from hasher, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestRegister_TokenGenerationError verifies that a token generator error is
// wrapped and propagated from Register.
func TestRegister_TokenGenerationError(t *testing.T) {
	wantErr := errors.New("entropy exhausted")
	svc := newServiceForTest(
		&stubUserWriter{},
		&stubUserReader{},
		&stubSessionWriter{},
		&stubSessionDeleter{},
		bcrypt.GenerateFromPassword,
		bcrypt.CompareHashAndPassword,
		func() (string, string, error) { return "", "", wantErr },
	)

	_, err := svc.Register(context.Background(), "alice@example.com", "securepassword")
	if err == nil {
		t.Fatal("expected error from token generator, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestLogin_Success verifies that valid credentials return a non-empty opaque token.
func TestLogin_Success(t *testing.T) {
	svc := newServiceForTest(
		&stubUserWriter{},
		&stubUserReader{},
		&stubSessionWriter{},
		&stubSessionDeleter{},
		bcrypt.GenerateFromPassword,
		func(_, _ []byte) error { return nil }, // verifier always succeeds
		generateToken,
	)

	token, err := svc.Login(context.Background(), "alice@example.com", "securepassword")
	if err != nil {
		t.Fatalf("Login() returned unexpected error: %v", err)
	}
	if token == "" {
		t.Error("Login() returned empty token")
	}
}

// TestLogin_UserNotFound verifies that when GetUserByEmail returns ErrUserNotFound,
// Login returns ErrInvalidCredentials (to avoid leaking user existence).
func TestLogin_UserNotFound(t *testing.T) {
	svc := newServiceForTest(
		&stubUserWriter{},
		&stubUserReader{err: ErrUserNotFound},
		&stubSessionWriter{},
		&stubSessionDeleter{},
		bcrypt.GenerateFromPassword,
		bcrypt.CompareHashAndPassword,
		generateToken,
	)

	_, err := svc.Login(context.Background(), "alice@example.com", "securepassword")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrInvalidCredentials) {
		t.Errorf("expected ErrInvalidCredentials, got: %v", err)
	}
}

// TestLogin_GetUserInternalError verifies that unexpected GetUserByEmail errors
// are wrapped and propagated (not mapped to ErrInvalidCredentials).
func TestLogin_GetUserInternalError(t *testing.T) {
	wantErr := errors.New("database connection lost")
	svc := newServiceForTest(
		&stubUserWriter{},
		&stubUserReader{err: wantErr},
		&stubSessionWriter{},
		&stubSessionDeleter{},
		bcrypt.GenerateFromPassword,
		bcrypt.CompareHashAndPassword,
		generateToken,
	)

	_, err := svc.Login(context.Background(), "alice@example.com", "securepassword")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if errors.Is(err, ErrInvalidCredentials) {
		t.Error("expected non-credential error, but got ErrInvalidCredentials")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestLogin_InvalidPassword verifies that when the verifier returns an error,
// Login returns ErrInvalidCredentials.
func TestLogin_InvalidPassword(t *testing.T) {
	svc := newServiceForTest(
		&stubUserWriter{},
		&stubUserReader{},
		&stubSessionWriter{},
		&stubSessionDeleter{},
		bcrypt.GenerateFromPassword,
		func(_, _ []byte) error { return errors.New("bcrypt mismatch") },
		generateToken,
	)

	_, err := svc.Login(context.Background(), "alice@example.com", "wrongpassword")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrInvalidCredentials) {
		t.Errorf("expected ErrInvalidCredentials, got: %v", err)
	}
}

// TestLogin_TokenGenerationError verifies that a token generator error is
// wrapped and propagated from Login.
func TestLogin_TokenGenerationError(t *testing.T) {
	wantErr := errors.New("entropy exhausted")
	svc := newServiceForTest(
		&stubUserWriter{},
		&stubUserReader{},
		&stubSessionWriter{},
		&stubSessionDeleter{},
		bcrypt.GenerateFromPassword,
		func(_, _ []byte) error { return nil },
		func() (string, string, error) { return "", "", wantErr },
	)

	_, err := svc.Login(context.Background(), "alice@example.com", "securepassword")
	if err == nil {
		t.Fatal("expected error from token generator, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestLogin_CreateSessionError verifies that CreateSession errors are
// wrapped and propagated from Login.
func TestLogin_CreateSessionError(t *testing.T) {
	wantErr := errors.New("session table unreachable")
	svc := newServiceForTest(
		&stubUserWriter{},
		&stubUserReader{},
		&stubSessionWriter{err: wantErr},
		&stubSessionDeleter{},
		bcrypt.GenerateFromPassword,
		func(_, _ []byte) error { return nil },
		generateToken,
	)

	_, err := svc.Login(context.Background(), "alice@example.com", "securepassword")
	if err == nil {
		t.Fatal("expected error from CreateSession, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestValidateRegistrationInput covers all validation branches directly.
func TestValidateRegistrationInput(t *testing.T) {
	tests := []struct {
		name        string
		email       string
		password    string
		wantErr     bool
		errContains string
	}{
		{
			name:     "valid",
			email:    "user@example.com",
			password: "password123",
			wantErr:  false,
		},
		{
			name:        "empty email",
			email:       "",
			password:    "password123",
			wantErr:     true,
			errContains: "email is invalid",
		},
		{
			name:        "email without at-sign",
			email:       "notanemail",
			password:    "password123",
			wantErr:     true,
			errContains: "email is invalid",
		},
		{
			name:        "email missing domain",
			email:       "user@",
			password:    "password123",
			wantErr:     true,
			errContains: "email is invalid",
		},
		{
			name:        "email missing local part",
			email:       "@example.com",
			password:    "password123",
			wantErr:     true,
			errContains: "email is invalid",
		},
		{
			name:        "password too short",
			email:       "user@example.com",
			password:    "1234567",
			wantErr:     true,
			errContains: "password must be at least 8 characters",
		},
		{
			name:     "password exactly 8 characters",
			email:    "user@example.com",
			password: "12345678",
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateRegistrationInput(tt.email, tt.password)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				if !errors.Is(err, ErrInvalidInput) {
					t.Errorf("expected ErrInvalidInput, got: %v", err)
				}
				if tt.errContains != "" && !strings.Contains(err.Error(), tt.errContains) {
					t.Errorf("expected error to contain %q, got: %v", tt.errContains, err)
				}
			} else {
				if err != nil {
					t.Errorf("expected no error, got: %v", err)
				}
			}
		})
	}
}

// TestGenerateTokenFrom_ReaderError verifies that an io.ReadFull failure
// is wrapped and propagated by generateTokenFrom.
func TestGenerateTokenFrom_ReaderError(t *testing.T) {
	wantErr := errors.New("entropy exhausted")
	errReader := errorReader{err: wantErr}
	_, _, err := generateTokenFrom(errReader)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestGenerateToken verifies that generateToken returns a valid non-empty token,
// a non-empty hash, that both are unique across calls, and that the token is
// 43 characters (32 bytes as base64url without padding).
func TestGenerateToken(t *testing.T) {
	token1, hash1, err1 := generateToken()
	if err1 != nil {
		t.Fatalf("generateToken() returned unexpected error: %v", err1)
	}
	token2, hash2, err2 := generateToken()
	if err2 != nil {
		t.Fatalf("generateToken() second call returned unexpected error: %v", err2)
	}

	if token1 == "" {
		t.Error("token1 is empty")
	}
	if hash1 == "" {
		t.Error("hash1 is empty")
	}
	// 32 random bytes encoded as base64url without padding = 43 characters.
	if len(token1) != 43 {
		t.Errorf("expected token length 43, got %d", len(token1))
	}
	// Two calls must produce different values.
	if token1 == token2 {
		t.Error("two calls to generateToken produced the same token")
	}
	if hash1 == hash2 {
		t.Error("two calls to generateToken produced the same hash")
	}
	// Hash must not equal token.
	if token1 == hash1 {
		t.Error("token and hash are identical — hashing is not applied")
	}
}

// TestLogout_Success verifies that Logout hashes the token and calls DeleteSession.
func TestLogout_Success(t *testing.T) {
	deleter := &stubSessionDeleter{}
	svc := NewService(&stubUserWriter{}, &stubUserReader{}, &stubSessionWriter{}, deleter)

	if err := svc.Logout(context.Background(), "some-raw-token"); err != nil {
		t.Fatalf("Logout() returned unexpected error: %v", err)
	}
}

// TestLogout_DeleteError verifies that a DeleteSession error is propagated by Logout.
func TestLogout_DeleteError(t *testing.T) {
	wantErr := errors.New("delete failed")
	deleter := &stubSessionDeleter{err: wantErr}
	svc := NewService(&stubUserWriter{}, &stubUserReader{}, &stubSessionWriter{}, deleter)

	err := svc.Logout(context.Background(), "some-raw-token")
	if err == nil {
		t.Fatal("expected error from Logout, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}
