package main

import (
	"context"
	"errors"
	"strings"
	"testing"
)

// TestRun_CreatesAdminUser verifies that run calls the creator with the correct
// email and a non-empty hash when given valid credentials.
func TestRun_CreatesAdminUser(t *testing.T) {
	creator := &stubAdminUserCreator{}
	ctx := context.Background()

	err := run(ctx, creator, "admin@example.com", "securepassword", fakeHasher)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if len(creator.calls) != 1 {
		t.Fatalf("expected 1 CreateAdminUser call, got %d", len(creator.calls))
	}
	if creator.calls[0].email != "admin@example.com" {
		t.Errorf("expected email %q, got %q", "admin@example.com", creator.calls[0].email)
	}
	if creator.calls[0].passwordHash == "" {
		t.Error("expected non-empty password hash")
	}
}

// TestRun_EmptyEmail verifies that run returns an error when email is empty
// and does not call the creator.
func TestRun_EmptyEmail(t *testing.T) {
	creator := &stubAdminUserCreator{}
	ctx := context.Background()

	err := run(ctx, creator, "", "securepassword", fakeHasher)
	if err == nil {
		t.Fatal("expected error for empty email, got nil")
	}
	if !strings.Contains(err.Error(), "email is required") {
		t.Errorf("expected 'email is required' error, got: %v", err)
	}
	if len(creator.calls) != 0 {
		t.Errorf("expected no CreateAdminUser calls, got %d", len(creator.calls))
	}
}

// TestRun_ShortPassword verifies that run returns an error when the password is
// fewer than 8 characters and does not call the creator.
func TestRun_ShortPassword(t *testing.T) {
	creator := &stubAdminUserCreator{}
	ctx := context.Background()

	err := run(ctx, creator, "admin@example.com", "short", fakeHasher)
	if err == nil {
		t.Fatal("expected error for short password, got nil")
	}
	if !strings.Contains(err.Error(), "password must be at least 8 characters") {
		t.Errorf("expected password length error, got: %v", err)
	}
	if len(creator.calls) != 0 {
		t.Errorf("expected no CreateAdminUser calls, got %d", len(creator.calls))
	}
}

// TestRun_HasherError verifies that run propagates hasher errors and does not
// call the creator.
func TestRun_HasherError(t *testing.T) {
	creator := &stubAdminUserCreator{}
	ctx := context.Background()

	err := run(ctx, creator, "admin@example.com", "securepassword", errorHasher)
	if err == nil {
		t.Fatal("expected error from hasher, got nil")
	}
	if !strings.Contains(err.Error(), "hash failure") {
		t.Errorf("expected error to contain 'hash failure', got: %v", err)
	}
	if len(creator.calls) != 0 {
		t.Errorf("expected no CreateAdminUser calls when hasher fails, got %d", len(creator.calls))
	}
}

// TestRun_CreatorError verifies that run propagates errors returned by the creator.
func TestRun_CreatorError(t *testing.T) {
	creator := &stubAdminUserCreator{err: errors.New("database unavailable")}
	ctx := context.Background()

	err := run(ctx, creator, "admin@example.com", "securepassword", fakeHasher)
	if err == nil {
		t.Fatal("expected error from creator, got nil")
	}
	if !strings.Contains(err.Error(), "database unavailable") {
		t.Errorf("expected error to contain 'database unavailable', got: %v", err)
	}
}

// TestRun_UpdatesExistingUser verifies that run calls the creator exactly once
// for an existing email (the upsert is handled at the SQL level; run itself does
// not distinguish insert from update).
func TestRun_UpdatesExistingUser(t *testing.T) {
	creator := &stubAdminUserCreator{}
	ctx := context.Background()

	// First call — initial creation.
	if err := run(ctx, creator, "admin@example.com", "securepassword", fakeHasher); err != nil {
		t.Fatalf("first run failed: %v", err)
	}
	// Second call with same email — simulates a password update via upsert.
	if err := run(ctx, creator, "admin@example.com", "newpassword123", fakeHasher); err != nil {
		t.Fatalf("second run failed: %v", err)
	}

	if len(creator.calls) != 2 {
		t.Fatalf("expected 2 CreateAdminUser calls, got %d", len(creator.calls))
	}
	// Both calls must target the same email.
	for i, call := range creator.calls {
		if call.email != "admin@example.com" {
			t.Errorf("call %d: expected email %q, got %q", i, "admin@example.com", call.email)
		}
	}
}

// TestRun_PasswordBoundary_SevenChars verifies that a 7-character password is rejected.
func TestRun_PasswordBoundary_SevenChars(t *testing.T) {
	creator := &stubAdminUserCreator{}
	ctx := context.Background()

	err := run(ctx, creator, "admin@example.com", "1234567", fakeHasher)
	if err == nil {
		t.Fatal("expected error for 7-char password, got nil")
	}
	if len(creator.calls) != 0 {
		t.Errorf("expected no creator calls for invalid password, got %d", len(creator.calls))
	}
}

// TestRun_PasswordBoundary_EightChars verifies that an 8-character password is accepted.
func TestRun_PasswordBoundary_EightChars(t *testing.T) {
	creator := &stubAdminUserCreator{}
	ctx := context.Background()

	err := run(ctx, creator, "admin@example.com", "12345678", fakeHasher)
	if err != nil {
		t.Fatalf("expected no error for 8-char password, got: %v", err)
	}
	if len(creator.calls) != 1 {
		t.Errorf("expected 1 creator call, got %d", len(creator.calls))
	}
}

// TestRun_InvalidEmailFormat verifies that a malformed email address is rejected.
func TestRun_InvalidEmailFormat(t *testing.T) {
	creator := &stubAdminUserCreator{}
	ctx := context.Background()

	for _, invalid := range []string{"notanemail", "@nodomain", "noat.com", "double@@at.com", "user@"} {
		err := run(ctx, creator, invalid, "validpass123", fakeHasher)
		if err == nil {
			t.Errorf("expected error for email %q, got nil", invalid)
		}
		if len(creator.calls) != 0 {
			t.Errorf("expected no creator calls for invalid email %q, got %d", invalid, len(creator.calls))
		}
	}
}
