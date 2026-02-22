package auth

import (
	"context"
	"errors"
	"regexp"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/lib/pq"
)

// TestCreateUser_Success verifies that CreateUser executes the INSERT and
// scans the RETURNING columns into a User.
func TestCreateUser_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	now := time.Now().UTC()
	rows := sqlmock.NewRows([]string{"id", "email", "created_at"}).
		AddRow("user-123", "alice@example.com", now)

	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO users")).
		WithArgs("alice@example.com", "hashed").
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresUserRepository(db)
	user, err := repo.CreateUser(context.Background(), "alice@example.com", "hashed")
	if err != nil {
		t.Fatalf("CreateUser() returned unexpected error: %v", err)
	}
	if user.ID != "user-123" {
		t.Errorf("expected ID user-123, got %q", user.ID)
	}
	if user.Email != "alice@example.com" {
		t.Errorf("expected email alice@example.com, got %q", user.Email)
	}

	if err := db.Close(); err != nil {
		t.Errorf("closing mock db: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

// TestCreateUser_UniqueConstraintError verifies that a pq unique constraint
// violation (code 23505) is translated to ErrEmailConflict by the repository.
func TestCreateUser_UniqueConstraintError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	// pq error code 23505 is the unique_violation error class.
	pgErr := &pq.Error{Code: "23505", Message: "duplicate key value violates unique constraint"}
	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO users")).
		WithArgs("alice@example.com", "hashed").
		WillReturnError(pgErr)
	mock.ExpectClose()

	repo := NewPostgresUserRepository(db)
	_, err = repo.CreateUser(context.Background(), "alice@example.com", "hashed")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrEmailConflict) {
		t.Errorf("expected ErrEmailConflict, got: %v", err)
	}

	if err := db.Close(); err != nil {
		t.Errorf("closing mock db: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

// TestCreateUser_QueryError verifies that arbitrary query errors are propagated.
func TestCreateUser_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	wantErr := errors.New("connection refused")
	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO users")).
		WillReturnError(wantErr)
	mock.ExpectClose()

	repo := NewPostgresUserRepository(db)
	_, err = repo.CreateUser(context.Background(), "alice@example.com", "hashed")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}

	if err := db.Close(); err != nil {
		t.Errorf("closing mock db: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

// TestCreateSession_Success verifies that CreateSession executes the INSERT and
// scans the RETURNING columns into a Session.
func TestCreateSession_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	now := time.Now().UTC()
	expiresAt := now.Add(24 * time.Hour)

	rows := sqlmock.NewRows([]string{"id", "user_id", "token_hash", "created_at", "expires_at"}).
		AddRow("sess-789", "user-123", "abc123hash", now, expiresAt)

	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO sessions")).
		WithArgs("user-123", "abc123hash", sqlmock.AnyArg()).
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresSessionRepository(db)
	sess, err := repo.CreateSession(context.Background(), "user-123", "abc123hash", expiresAt)
	if err != nil {
		t.Fatalf("CreateSession() returned unexpected error: %v", err)
	}
	if sess.ID != "sess-789" {
		t.Errorf("expected ID sess-789, got %q", sess.ID)
	}
	if sess.UserID != "user-123" {
		t.Errorf("expected UserID user-123, got %q", sess.UserID)
	}
	if sess.TokenHash != "abc123hash" {
		t.Errorf("expected TokenHash abc123hash, got %q", sess.TokenHash)
	}

	if err := db.Close(); err != nil {
		t.Errorf("closing mock db: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

// TestCreateSession_QueryError verifies that errors from CreateSession are propagated.
func TestCreateSession_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	wantErr := errors.New("sessions table locked")
	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO sessions")).
		WillReturnError(wantErr)
	mock.ExpectClose()

	repo := NewPostgresSessionRepository(db)
	_, err = repo.CreateSession(context.Background(), "user-123", "hash", time.Now().Add(time.Hour))
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}

	if err := db.Close(); err != nil {
		t.Errorf("closing mock db: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}
