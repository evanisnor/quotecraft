package main

import (
	"context"
	"errors"
)

// stubAdminUserCreator records calls to CreateAdminUser and can return a
// configurable error.
type stubAdminUserCreator struct {
	calls []adminUserCall
	err   error
}

type adminUserCall struct {
	email        string
	passwordHash string
}

func (s *stubAdminUserCreator) CreateAdminUser(_ context.Context, email, passwordHash string) error {
	s.calls = append(s.calls, adminUserCall{email: email, passwordHash: passwordHash})
	return s.err
}

// fakeHasher is a successful hasher that returns a deterministic hash.
func fakeHasher(password []byte, _ int) ([]byte, error) {
	return []byte("hashed:" + string(password)), nil
}

// errorHasher always returns an error.
func errorHasher(_ []byte, _ int) ([]byte, error) {
	return nil, errors.New("hash failure")
}
