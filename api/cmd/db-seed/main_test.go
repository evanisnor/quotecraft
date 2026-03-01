package main

import (
	"context"
	"errors"
	"strings"
	"testing"
)

// stubSeeder records calls to SeedUser and can return a configurable error.
type stubSeeder struct {
	calls     []seedCall
	errOnCall int // 1-based index of the call that should return an error; 0 means never
	err       error
}

type seedCall struct {
	email        string
	passwordHash string
}

func (s *stubSeeder) SeedUser(_ context.Context, email, passwordHash string) error {
	s.calls = append(s.calls, seedCall{email: email, passwordHash: passwordHash})
	if s.errOnCall > 0 && len(s.calls) == s.errOnCall {
		return s.err
	}
	return nil
}

// fakeHasher is a successful hasher that returns a deterministic hash.
func fakeHasher(password []byte, _ int) ([]byte, error) {
	return []byte("hashed:" + string(password)), nil
}

// errorHasher always returns an error.
func errorHasher(_ []byte, _ int) ([]byte, error) {
	return nil, errors.New("hash failure")
}

// TestRun_AllUsersSeeded verifies that run seeds all three dev users with no error.
func TestRun_AllUsersSeeded(t *testing.T) {
	seeder := &stubSeeder{}
	ctx := context.Background()

	err := run(ctx, seeder, devUsers, fakeHasher)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(seeder.calls) != len(devUsers) {
		t.Fatalf("expected %d SeedUser calls, got %d", len(devUsers), len(seeder.calls))
	}
	for i, u := range devUsers {
		if seeder.calls[i].email != u.Email {
			t.Errorf("call %d: expected email %q, got %q", i, u.Email, seeder.calls[i].email)
		}
		expectedHash := "hashed:" + u.Password
		if seeder.calls[i].passwordHash != expectedHash {
			t.Errorf("call %d: expected hash %q, got %q", i, expectedHash, seeder.calls[i].passwordHash)
		}
	}
}

// TestRun_HasherError verifies that run returns a wrapped error and does not
// call the seeder when the hasher fails.
func TestRun_HasherError(t *testing.T) {
	seeder := &stubSeeder{}
	ctx := context.Background()

	err := run(ctx, seeder, devUsers, errorHasher)
	if err == nil {
		t.Fatal("expected error from hasher, got nil")
	}
	if !strings.Contains(err.Error(), "hash failure") {
		t.Errorf("expected error to contain 'hash failure', got: %v", err)
	}
	if len(seeder.calls) != 0 {
		t.Errorf("expected no SeedUser calls when hasher fails, got %d", len(seeder.calls))
	}
}

// TestRun_SeedUserError verifies that run returns a wrapped error when SeedUser
// fails on the second user.
func TestRun_SeedUserError(t *testing.T) {
	seeder := &stubSeeder{
		errOnCall: 2,
		err:       errors.New("duplicate key"),
	}
	ctx := context.Background()

	err := run(ctx, seeder, devUsers, fakeHasher)
	if err == nil {
		t.Fatal("expected error from SeedUser, got nil")
	}
	if !strings.Contains(err.Error(), "duplicate key") {
		t.Errorf("expected error to contain 'duplicate key', got: %v", err)
	}
	// Only the first call succeeds; the second fails.
	if len(seeder.calls) != 2 {
		t.Errorf("expected 2 SeedUser calls (1 success + 1 failure), got %d", len(seeder.calls))
	}
}

// TestRun_EmptyUsers verifies that run with no users succeeds without calling the seeder.
func TestRun_EmptyUsers(t *testing.T) {
	seeder := &stubSeeder{}
	ctx := context.Background()

	err := run(ctx, seeder, []seedUser{}, fakeHasher)
	if err != nil {
		t.Fatalf("expected no error for empty users, got: %v", err)
	}
	if len(seeder.calls) != 0 {
		t.Errorf("expected no SeedUser calls for empty users, got %d", len(seeder.calls))
	}
}
