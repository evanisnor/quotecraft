package auth

import (
	"context"
	"time"
)

// stubUserWriter is a reusable test double for UserWriter.
type stubUserWriter struct {
	user *User
	err  error
}

func (s *stubUserWriter) CreateUser(_ context.Context, email, _ string) (*User, error) {
	if s.err != nil {
		return nil, s.err
	}
	if s.user != nil {
		return s.user, nil
	}
	return &User{ID: "user-123", Email: email, CreatedAt: time.Now()}, nil
}

// stubUserReader is a reusable test double for UserReader.
type stubUserReader struct {
	user *User
	err  error
}

func (s *stubUserReader) GetUserByEmail(_ context.Context, _ string) (*User, error) {
	if s.err != nil {
		return nil, s.err
	}
	if s.user != nil {
		return s.user, nil
	}
	return &User{ID: "user-123", Email: "alice@example.com", PasswordHash: "$2a$12$somehashvalue"}, nil
}

// stubSessionWriter is a reusable test double for SessionWriter.
type stubSessionWriter struct {
	session *Session
	err     error
}

func (s *stubSessionWriter) CreateSession(_ context.Context, userID, tokenHash string, expiresAt time.Time) (*Session, error) {
	if s.err != nil {
		return nil, s.err
	}
	if s.session != nil {
		return s.session, nil
	}
	return &Session{
		ID:        "sess-456",
		UserID:    userID,
		TokenHash: tokenHash,
		CreatedAt: time.Now(),
		ExpiresAt: expiresAt,
	}, nil
}

// stubSessionDeleter is a reusable test double for SessionDeleter.
type stubSessionDeleter struct {
	err error
}

func (s *stubSessionDeleter) DeleteSession(_ context.Context, _ string) error {
	return s.err
}

// stubSessionReader is a reusable test double for SessionReader.
type stubSessionReader struct {
	session *Session
	err     error
}

func (s *stubSessionReader) GetSession(_ context.Context, _ string) (*Session, error) {
	return s.session, s.err
}

// stubResetTokenWriter is a reusable test double for ResetTokenWriter.
type stubResetTokenWriter struct {
	token *PasswordResetToken
	err   error
}

func (s *stubResetTokenWriter) CreateResetToken(_ context.Context, userID, tokenHash string, expiresAt time.Time) (*PasswordResetToken, error) {
	if s.err != nil {
		return nil, s.err
	}
	if s.token != nil {
		return s.token, nil
	}
	return &PasswordResetToken{
		ID:        "reset-token-789",
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}, nil
}

// stubResetTokenReader is a reusable test double for ResetTokenReader.
type stubResetTokenReader struct {
	token *PasswordResetToken
	err   error
}

func (s *stubResetTokenReader) GetResetTokenByHash(_ context.Context, _ string) (*PasswordResetToken, error) {
	return s.token, s.err
}

// stubResetTokenDeleter is a reusable test double for ResetTokenDeleter.
type stubResetTokenDeleter struct {
	deletedID string
	err       error
}

func (s *stubResetTokenDeleter) DeleteResetToken(_ context.Context, id string) error {
	s.deletedID = id
	return s.err
}

// stubUserPasswordUpdater is a reusable test double for UserPasswordUpdater.
type stubUserPasswordUpdater struct {
	updatedUserID string
	err           error
}

func (s *stubUserPasswordUpdater) UpdateUserPassword(_ context.Context, userID, _ string) error {
	s.updatedUserID = userID
	return s.err
}

// stubPasswordResetEmailSender is a reusable test double for PasswordResetEmailSender.
type stubPasswordResetEmailSender struct {
	calledWith struct {
		email    string
		rawToken string
	}
	called bool
	err    error
}

func (s *stubPasswordResetEmailSender) SendPasswordResetEmail(_ context.Context, toEmail, rawToken string) error {
	s.called = true
	s.calledWith.email = toEmail
	s.calledWith.rawToken = rawToken
	return s.err
}

// errorReader is an io.Reader that always returns an error.
type errorReader struct{ err error }

func (e errorReader) Read(_ []byte) (int, error) { return 0, e.err }

// stubCodeExchanger is a reusable test double for CodeExchanger.
type stubCodeExchanger struct {
	token string
	err   error
}

func (s *stubCodeExchanger) Exchange(_ context.Context, _, _, _ string) (string, error) {
	return s.token, s.err
}

// stubUserInfoFetcher is a reusable test double for UserInfoFetcher.
type stubUserInfoFetcher struct {
	providerID string
	email      string
	err        error
}

func (s *stubUserInfoFetcher) FetchUserInfo(_ context.Context, _ string) (string, string, error) {
	return s.providerID, s.email, s.err
}

// stubOAuthUserManager is a reusable test double for OAuthUserManager.
type stubOAuthUserManager struct {
	user *User
	err  error
}

func (s *stubOAuthUserManager) GetOrCreateOAuthUser(_ context.Context, _, _, _ string) (*User, error) {
	if s.err != nil {
		return nil, s.err
	}
	if s.user != nil {
		return s.user, nil
	}
	return &User{ID: "user-oauth-123", Email: "alice@example.com"}, nil
}
