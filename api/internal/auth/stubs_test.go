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
