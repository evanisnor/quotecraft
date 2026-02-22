package db

import (
	"errors"
	"strings"
	"testing"

	"github.com/golang-migrate/migrate/v4"
)

// stubRunner is a test implementation of the runner interface.
type stubRunner struct {
	err    error
	called bool
}

func (s *stubRunner) Up() error {
	s.called = true
	return s.err
}

func TestFileMigrator_Up_success(t *testing.T) {
	stub := &stubRunner{err: nil}
	fm := newFileMigratorWithRunner(stub)

	if err := fm.Up(); err != nil {
		t.Fatalf("expected nil error, got: %v", err)
	}
	if !stub.called {
		t.Error("expected runner.Up() to be called")
	}
}

func TestFileMigrator_Up_noChange(t *testing.T) {
	stub := &stubRunner{err: migrate.ErrNoChange}
	fm := newFileMigratorWithRunner(stub)

	if err := fm.Up(); err != nil {
		t.Fatalf("expected nil error for ErrNoChange, got: %v", err)
	}
	if !stub.called {
		t.Error("expected runner.Up() to be called")
	}
}

func TestFileMigrator_Up_error(t *testing.T) {
	originalErr := errors.New("connection refused")
	stub := &stubRunner{err: originalErr}
	fm := newFileMigratorWithRunner(stub)

	err := fm.Up()
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, originalErr) {
		t.Errorf("expected wrapped originalErr, got: %v", err)
	}
	if !strings.Contains(err.Error(), "running up migrations") {
		t.Errorf("expected error to mention 'running up migrations', got: %v", err)
	}
}

func TestNewFileMigratorWithFactory_success(t *testing.T) {
	stub := &stubRunner{}
	factory := func(sourceURL, databaseURL string) (runner, error) {
		return stub, nil
	}

	fm, err := newFileMigratorWithFactory("/tmp/migrations", "postgres://localhost/test", factory)
	if err != nil {
		t.Fatalf("expected nil error, got: %v", err)
	}
	if fm == nil {
		t.Fatal("expected non-nil FileMigrator")
	}
	if fm.r != stub {
		t.Error("expected FileMigrator to hold the stub runner")
	}
}

func TestNewFileMigratorWithFactory_error(t *testing.T) {
	factoryErr := errors.New("dial tcp: connection refused")
	factory := func(sourceURL, databaseURL string) (runner, error) {
		return nil, factoryErr
	}

	_, err := newFileMigratorWithFactory("/tmp/migrations", "postgres://localhost/test", factory)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, factoryErr) {
		t.Errorf("expected wrapped factoryErr, got: %v", err)
	}
	if !strings.Contains(err.Error(), "creating file migrator") {
		t.Errorf("expected error to mention 'creating file migrator', got: %v", err)
	}
}

func TestNewFileMigrator_invalidURL(t *testing.T) {
	_, err := NewFileMigrator("/tmp/nonexistent", "invalid-scheme://not-a-valid-postgres-url")
	if err == nil {
		t.Fatal("expected error for invalid database URL, got nil")
	}
	if !strings.Contains(err.Error(), "creating file migrator") {
		t.Errorf("expected error to mention 'creating file migrator', got: %v", err)
	}
}
