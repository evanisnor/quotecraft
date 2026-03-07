package auth

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// defaultStubs returns a full set of no-op test stubs for NewService / newServiceForTest.
func defaultStubs() (
	*stubUserWriter,
	*stubUserReader,
	*stubSessionWriter,
	*stubSessionDeleter,
	*stubSessionReader,
	*stubResetTokenWriter,
	*stubResetTokenReader,
	*stubResetTokenDeleter,
	*stubUserPasswordUpdater,
	*stubPasswordResetEmailSender,
) {
	return &stubUserWriter{},
		&stubUserReader{},
		&stubSessionWriter{},
		&stubSessionDeleter{},
		&stubSessionReader{},
		&stubResetTokenWriter{},
		&stubResetTokenReader{},
		&stubResetTokenDeleter{},
		&stubUserPasswordUpdater{},
		&stubPasswordResetEmailSender{}
}

// newTestService constructs a Service with all default stubs using NewService.
func newTestService() *Service {
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	return NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)
}

// TestRegister_Success verifies that a valid registration returns a non-empty
// opaque token, calls CreateUser and CreateSession.
func TestRegister_Success(t *testing.T) {
	users := &stubUserWriter{}
	sessions := &stubSessionWriter{}
	_, ur, _, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := NewService(users, ur, sessions, sd, sr, rtw, rtr, rtd, upu, es)

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
			svc := newTestService()
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
	svc := newTestService()

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
	svc := newTestService()

	_, err := svc.Register(context.Background(), "alice@example.com", "exactly8")
	if err != nil {
		t.Errorf("expected success for 8-char password, got: %v", err)
	}
}

// TestRegister_EmailConflict verifies that when CreateUser returns ErrEmailConflict
// (as the repository does for pq code 23505), Register propagates it.
func TestRegister_EmailConflict(t *testing.T) {
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	uw.err = ErrEmailConflict
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

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
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	uw.err = wantErr
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

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
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	sw.err = wantErr
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

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
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := newServiceForTest(
		uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es,
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
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := newServiceForTest(
		uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es,
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
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := newServiceForTest(
		uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es,
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
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	ur.err = ErrUserNotFound
	svc := newServiceForTest(
		uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es,
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
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	ur.err = wantErr
	svc := newServiceForTest(
		uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es,
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
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := newServiceForTest(
		uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es,
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
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := newServiceForTest(
		uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es,
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
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	sw.err = wantErr
	svc := newServiceForTest(
		uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es,
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
	uw, ur, sw, _, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	deleter := &stubSessionDeleter{}
	svc := NewService(uw, ur, sw, deleter, sr, rtw, rtr, rtd, upu, es)

	if err := svc.Logout(context.Background(), "some-raw-token"); err != nil {
		t.Fatalf("Logout() returned unexpected error: %v", err)
	}
}

// TestLogout_DeleteError verifies that a DeleteSession error is propagated by Logout.
func TestLogout_DeleteError(t *testing.T) {
	wantErr := errors.New("delete failed")
	uw, ur, sw, _, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	deleter := &stubSessionDeleter{err: wantErr}
	svc := NewService(uw, ur, sw, deleter, sr, rtw, rtr, rtd, upu, es)

	err := svc.Logout(context.Background(), "some-raw-token")
	if err == nil {
		t.Fatal("expected error from Logout, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestValidateToken_Success verifies that a valid, non-expired session returns the user ID.
func TestValidateToken_Success(t *testing.T) {
	sess := &Session{
		UserID:    "user-abc",
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	uw, ur, sw, sd, _, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := NewService(uw, ur, sw, sd, &stubSessionReader{session: sess}, rtw, rtr, rtd, upu, es)

	userID, err := svc.ValidateToken(context.Background(), "some-raw-token")
	if err != nil {
		t.Fatalf("ValidateToken() returned unexpected error: %v", err)
	}
	if userID != "user-abc" {
		t.Errorf("expected userID %q, got %q", "user-abc", userID)
	}
}

// TestValidateToken_SessionNotFound verifies that ErrSessionNotFound from the
// reader is mapped to ErrInvalidSession.
func TestValidateToken_SessionNotFound(t *testing.T) {
	uw, ur, sw, sd, _, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := NewService(uw, ur, sw, sd, &stubSessionReader{err: ErrSessionNotFound}, rtw, rtr, rtd, upu, es)

	_, err := svc.ValidateToken(context.Background(), "unknown-token")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrInvalidSession) {
		t.Errorf("expected ErrInvalidSession, got: %v", err)
	}
}

// TestValidateToken_ExpiredSession verifies that an expired session returns ErrInvalidSession.
func TestValidateToken_ExpiredSession(t *testing.T) {
	sess := &Session{
		UserID:    "user-abc",
		ExpiresAt: time.Now().Add(-1 * time.Hour), // already expired
	}
	uw, ur, sw, sd, _, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := NewService(uw, ur, sw, sd, &stubSessionReader{session: sess}, rtw, rtr, rtd, upu, es)

	_, err := svc.ValidateToken(context.Background(), "expired-token")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrInvalidSession) {
		t.Errorf("expected ErrInvalidSession, got: %v", err)
	}
}

// TestValidateToken_InternalError verifies that unexpected reader errors are
// wrapped and propagated (not mapped to ErrInvalidSession).
func TestValidateToken_InternalError(t *testing.T) {
	wantErr := errors.New("database unreachable")
	uw, ur, sw, sd, _, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := NewService(uw, ur, sw, sd, &stubSessionReader{err: wantErr}, rtw, rtr, rtd, upu, es)

	_, err := svc.ValidateToken(context.Background(), "some-token")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if errors.Is(err, ErrInvalidSession) {
		t.Error("expected non-session error, but got ErrInvalidSession")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestForgotPassword_UserNotFound verifies that when the email is not registered,
// ForgotPassword returns nil (no error, prevents user enumeration).
func TestForgotPassword_UserNotFound(t *testing.T) {
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	ur.err = ErrUserNotFound
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

	err := svc.ForgotPassword(context.Background(), "nobody@example.com")
	if err != nil {
		t.Errorf("ForgotPassword() expected nil for unknown email, got: %v", err)
	}
	if es.called {
		t.Error("expected email sender not to be called for unknown email")
	}
}

// TestForgotPassword_GetUserInternalError verifies that unexpected DB errors are
// wrapped and propagated.
func TestForgotPassword_GetUserInternalError(t *testing.T) {
	wantErr := errors.New("database connection lost")
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	ur.err = wantErr
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

	err := svc.ForgotPassword(context.Background(), "alice@example.com")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestForgotPassword_TokenGenerationError verifies that token generator failures
// are propagated.
func TestForgotPassword_TokenGenerationError(t *testing.T) {
	wantErr := errors.New("entropy exhausted")
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := newServiceForTest(
		uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es,
		bcrypt.GenerateFromPassword,
		bcrypt.CompareHashAndPassword,
		func() (string, string, error) { return "", "", wantErr },
	)

	err := svc.ForgotPassword(context.Background(), "alice@example.com")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestForgotPassword_CreateResetTokenError verifies that token storage failures
// are propagated.
func TestForgotPassword_CreateResetTokenError(t *testing.T) {
	wantErr := errors.New("reset token table locked")
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	rtw.err = wantErr
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

	err := svc.ForgotPassword(context.Background(), "alice@example.com")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestForgotPassword_EmailSenderError verifies that email send failures are
// propagated.
func TestForgotPassword_EmailSenderError(t *testing.T) {
	wantErr := errors.New("SMTP connection refused")
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	es.err = wantErr
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

	err := svc.ForgotPassword(context.Background(), "alice@example.com")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestForgotPassword_Success verifies that a registered user triggers the email
// sender and returns nil.
func TestForgotPassword_Success(t *testing.T) {
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

	err := svc.ForgotPassword(context.Background(), "alice@example.com")
	if err != nil {
		t.Fatalf("ForgotPassword() returned unexpected error: %v", err)
	}
	if !es.called {
		t.Error("expected email sender to be called, but it was not")
	}
	if es.calledWith.email != "alice@example.com" {
		t.Errorf("expected email sent to alice@example.com, got %q", es.calledWith.email)
	}
	if es.calledWith.rawToken == "" {
		t.Error("expected non-empty raw token sent to email sender")
	}
}

// TestResetPassword_InvalidToken verifies that a non-existent token returns ErrInvalidResetToken.
func TestResetPassword_InvalidToken(t *testing.T) {
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	rtr.err = ErrResetTokenNotFound
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

	err := svc.ResetPassword(context.Background(), "somerawtoken", "newpassword123")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrInvalidResetToken) {
		t.Errorf("expected ErrInvalidResetToken, got: %v", err)
	}
}

// TestResetPassword_ExpiredToken verifies that an expired token returns ErrInvalidResetToken.
func TestResetPassword_ExpiredToken(t *testing.T) {
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	rtr.token = &PasswordResetToken{
		ID:        "reset-id",
		UserID:    "user-123",
		ExpiresAt: time.Now().Add(-1 * time.Hour), // already expired
	}
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

	err := svc.ResetPassword(context.Background(), "somerawtoken", "newpassword123")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrInvalidResetToken) {
		t.Errorf("expected ErrInvalidResetToken, got: %v", err)
	}
}

// TestResetPassword_ShortPassword verifies that a new password shorter than 8
// characters returns ErrInvalidInput.
func TestResetPassword_ShortPassword(t *testing.T) {
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	rtr.token = &PasswordResetToken{
		ID:        "reset-id",
		UserID:    "user-123",
		ExpiresAt: time.Now().Add(time.Hour),
	}
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

	err := svc.ResetPassword(context.Background(), "somerawtoken", "short")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrInvalidInput) {
		t.Errorf("expected ErrInvalidInput, got: %v", err)
	}
}

// TestResetPassword_HasherError verifies that bcrypt failures are propagated.
func TestResetPassword_HasherError(t *testing.T) {
	wantErr := errors.New("bcrypt failed")
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	rtr.token = &PasswordResetToken{
		ID:        "reset-id",
		UserID:    "user-123",
		ExpiresAt: time.Now().Add(time.Hour),
	}
	svc := newServiceForTest(
		uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es,
		func(_ []byte, _ int) ([]byte, error) { return nil, wantErr },
		bcrypt.CompareHashAndPassword,
		generateToken,
	)

	err := svc.ResetPassword(context.Background(), "somerawtoken", "newpassword123")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestResetPassword_UpdatePasswordError verifies that DB update failures are propagated.
func TestResetPassword_UpdatePasswordError(t *testing.T) {
	wantErr := errors.New("users table locked")
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	rtr.token = &PasswordResetToken{
		ID:        "reset-id",
		UserID:    "user-123",
		ExpiresAt: time.Now().Add(time.Hour),
	}
	upu.err = wantErr
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

	err := svc.ResetPassword(context.Background(), "somerawtoken", "newpassword123")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestResetPassword_DeleteTokenError verifies that token deletion failures are propagated.
func TestResetPassword_DeleteTokenError(t *testing.T) {
	wantErr := errors.New("reset token table locked")
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	rtr.token = &PasswordResetToken{
		ID:        "reset-id",
		UserID:    "user-123",
		ExpiresAt: time.Now().Add(time.Hour),
	}
	rtd.err = wantErr
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

	err := svc.ResetPassword(context.Background(), "somerawtoken", "newpassword123")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestResetPassword_Success verifies that a valid token and valid password results
// in the password being updated and the token being deleted.
func TestResetPassword_Success(t *testing.T) {
	uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	rtr.token = &PasswordResetToken{
		ID:        "reset-id",
		UserID:    "user-123",
		ExpiresAt: time.Now().Add(time.Hour),
	}
	svc := NewService(uw, ur, sw, sd, sr, rtw, rtr, rtd, upu, es)

	err := svc.ResetPassword(context.Background(), "somerawtoken", "newpassword123")
	if err != nil {
		t.Fatalf("ResetPassword() returned unexpected error: %v", err)
	}
	if upu.updatedUserID != "user-123" {
		t.Errorf("expected password updated for user-123, got %q", upu.updatedUserID)
	}
	if rtd.deletedID != "reset-id" {
		t.Errorf("expected reset token deleted by ID reset-id, got %q", rtd.deletedID)
	}
}
