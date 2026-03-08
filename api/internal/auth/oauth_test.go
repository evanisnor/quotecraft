package auth

import (
	"context"
	"errors"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

// TestWithGoogleOAuth verifies that WithGoogleOAuth sets the OAuth fields and
// returns the same Service pointer.
func TestWithGoogleOAuth(t *testing.T) {
	svc := newTestService()
	exchanger := &stubCodeExchanger{}
	fetcher := &stubUserInfoFetcher{}
	manager := &stubOAuthUserManager{}

	result := svc.WithGoogleOAuth(manager, exchanger, fetcher)

	if result != svc {
		t.Error("WithGoogleOAuth() should return the same Service pointer")
	}
	if svc.codeExchanger != exchanger {
		t.Error("WithGoogleOAuth() did not set codeExchanger")
	}
	if svc.userInfoFetcher != fetcher {
		t.Error("WithGoogleOAuth() did not set userInfoFetcher")
	}
	if svc.oauthUserManager != manager {
		t.Error("WithGoogleOAuth() did not set oauthUserManager")
	}
}

// newOAuthTestService creates a Service configured for OAuth testing with the
// given OAuth dependencies, while using the default no-op stubs for all other
// dependencies.
func newOAuthTestService(
	exchanger CodeExchanger,
	fetcher UserInfoFetcher,
	oauthManager OAuthUserManager,
	sessions SessionWriter,
	gen tokenGenerator,
) *Service {
	uw, ur, _, sd, sr, rtw, rtr, rtd, upu, es := defaultStubs()
	svc := newServiceForTest(
		uw, ur, sessions, sd, sr, rtw, rtr, rtd, upu, es,
		bcrypt.GenerateFromPassword,
		bcrypt.CompareHashAndPassword,
		gen,
	)
	svc.codeExchanger = exchanger
	svc.userInfoFetcher = fetcher
	svc.oauthUserManager = oauthManager
	return svc
}

// TestGoogleCallback_Success verifies that a complete happy path through
// GoogleCallback returns a non-empty session token.
func TestGoogleCallback_Success(t *testing.T) {
	svc := newOAuthTestService(
		&stubCodeExchanger{token: "access-token"},
		&stubUserInfoFetcher{providerID: "google-123", email: "alice@example.com"},
		&stubOAuthUserManager{},
		&stubSessionWriter{},
		generateToken,
	)

	token, err := svc.GoogleCallback(context.Background(), "code", "verifier", "https://example.com")
	if err != nil {
		t.Fatalf("GoogleCallback() returned unexpected error: %v", err)
	}
	if token == "" {
		t.Error("GoogleCallback() returned empty token")
	}
}

// TestGoogleCallback_ExchangeError verifies that a CodeExchanger error is
// wrapped with the expected prefix.
func TestGoogleCallback_ExchangeError(t *testing.T) {
	wantErr := errors.New("token endpoint unavailable")
	svc := newOAuthTestService(
		&stubCodeExchanger{err: wantErr},
		&stubUserInfoFetcher{},
		&stubOAuthUserManager{},
		&stubSessionWriter{},
		generateToken,
	)

	_, err := svc.GoogleCallback(context.Background(), "code", "verifier", "https://example.com")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestGoogleCallback_UserInfoError verifies that a UserInfoFetcher error is
// wrapped with the expected prefix.
func TestGoogleCallback_UserInfoError(t *testing.T) {
	wantErr := errors.New("userinfo unavailable")
	svc := newOAuthTestService(
		&stubCodeExchanger{token: "access-token"},
		&stubUserInfoFetcher{err: wantErr},
		&stubOAuthUserManager{},
		&stubSessionWriter{},
		generateToken,
	)

	_, err := svc.GoogleCallback(context.Background(), "code", "verifier", "https://example.com")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestGoogleCallback_EmailConflict verifies that ErrEmailConflict returned by
// GetOrCreateOAuthUser is returned unwrapped so callers can map it to 409.
func TestGoogleCallback_EmailConflict(t *testing.T) {
	svc := newOAuthTestService(
		&stubCodeExchanger{token: "access-token"},
		&stubUserInfoFetcher{providerID: "google-123", email: "alice@example.com"},
		&stubOAuthUserManager{err: ErrEmailConflict},
		&stubSessionWriter{},
		generateToken,
	)

	_, err := svc.GoogleCallback(context.Background(), "code", "verifier", "https://example.com")
	if err == nil {
		t.Fatal("expected ErrEmailConflict, got nil")
	}
	if !errors.Is(err, ErrEmailConflict) {
		t.Errorf("expected ErrEmailConflict, got: %v", err)
	}
}

// TestGoogleCallback_OAuthUserError verifies that a non-conflict error from
// GetOrCreateOAuthUser is wrapped with the expected prefix.
func TestGoogleCallback_OAuthUserError(t *testing.T) {
	wantErr := errors.New("users table locked")
	svc := newOAuthTestService(
		&stubCodeExchanger{token: "access-token"},
		&stubUserInfoFetcher{providerID: "google-123", email: "alice@example.com"},
		&stubOAuthUserManager{err: wantErr},
		&stubSessionWriter{},
		generateToken,
	)

	_, err := svc.GoogleCallback(context.Background(), "code", "verifier", "https://example.com")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if errors.Is(err, ErrEmailConflict) {
		t.Error("expected non-conflict error, got ErrEmailConflict")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestGoogleCallback_TokenGenError verifies that a token generator error is
// wrapped with the expected prefix.
func TestGoogleCallback_TokenGenError(t *testing.T) {
	wantErr := errors.New("entropy exhausted")
	svc := newOAuthTestService(
		&stubCodeExchanger{token: "access-token"},
		&stubUserInfoFetcher{providerID: "google-123", email: "alice@example.com"},
		&stubOAuthUserManager{},
		&stubSessionWriter{},
		func() (string, string, error) { return "", "", wantErr },
	)

	_, err := svc.GoogleCallback(context.Background(), "code", "verifier", "https://example.com")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

// TestGoogleCallback_SessionError verifies that a CreateSession error is wrapped
// with the expected prefix.
func TestGoogleCallback_SessionError(t *testing.T) {
	wantErr := errors.New("sessions table unreachable")
	svc := newOAuthTestService(
		&stubCodeExchanger{token: "access-token"},
		&stubUserInfoFetcher{providerID: "google-123", email: "alice@example.com"},
		&stubOAuthUserManager{},
		&stubSessionWriter{err: wantErr},
		generateToken,
	)

	_, err := svc.GoogleCallback(context.Background(), "code", "verifier", "https://example.com")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}
