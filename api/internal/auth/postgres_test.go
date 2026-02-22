package auth

import (
	"context"
	"database/sql"
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

// TestGetUserByEmail_Success verifies that GetUserByEmail executes the SELECT and
// scans the result columns into a User.
func TestGetUserByEmail_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	now := time.Now().UTC()
	rows := sqlmock.NewRows([]string{"id", "email", "password_hash", "created_at"}).
		AddRow("user-123", "alice@example.com", "$2a$12$somehash", now)

	mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, password_hash, created_at FROM users WHERE email = $1")).
		WithArgs("alice@example.com").
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresUserRepository(db)
	user, err := repo.GetUserByEmail(context.Background(), "alice@example.com")
	if err != nil {
		t.Fatalf("GetUserByEmail() returned unexpected error: %v", err)
	}
	if user.ID != "user-123" {
		t.Errorf("expected ID user-123, got %q", user.ID)
	}
	if user.Email != "alice@example.com" {
		t.Errorf("expected email alice@example.com, got %q", user.Email)
	}
	if user.PasswordHash != "$2a$12$somehash" {
		t.Errorf("expected password hash, got %q", user.PasswordHash)
	}

	if err := db.Close(); err != nil {
		t.Errorf("closing mock db: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

// TestGetUserByEmail_NotFound verifies that sql.ErrNoRows is translated to
// ErrUserNotFound by the repository.
func TestGetUserByEmail_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, password_hash, created_at FROM users WHERE email = $1")).
		WithArgs("nobody@example.com").
		WillReturnError(sql.ErrNoRows)
	mock.ExpectClose()

	repo := NewPostgresUserRepository(db)
	_, err = repo.GetUserByEmail(context.Background(), "nobody@example.com")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got: %v", err)
	}

	if err := db.Close(); err != nil {
		t.Errorf("closing mock db: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

// TestGetUserByEmail_QueryError verifies that arbitrary query errors are propagated.
func TestGetUserByEmail_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	wantErr := errors.New("connection refused")
	mock.ExpectQuery(regexp.QuoteMeta("SELECT id, email, password_hash, created_at FROM users WHERE email = $1")).
		WithArgs("alice@example.com").
		WillReturnError(wantErr)
	mock.ExpectClose()

	repo := NewPostgresUserRepository(db)
	_, err = repo.GetUserByEmail(context.Background(), "alice@example.com")
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

// TestDeleteSession_Success verifies that DeleteSession executes the DELETE
// statement with the correct token hash and returns no error when a row is matched.
func TestDeleteSession_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	mock.ExpectExec(regexp.QuoteMeta("DELETE FROM sessions WHERE token_hash = $1")).
		WithArgs("abc123hash").
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectClose()

	repo := NewPostgresSessionRepository(db)
	if err := repo.DeleteSession(context.Background(), "abc123hash"); err != nil {
		t.Fatalf("DeleteSession() returned unexpected error: %v", err)
	}

	if err := db.Close(); err != nil {
		t.Errorf("closing mock db: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

// TestDeleteSession_NoRows verifies that DeleteSession returns no error when
// the DELETE affects zero rows (idempotent — session already gone).
func TestDeleteSession_NoRows(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	mock.ExpectExec(regexp.QuoteMeta("DELETE FROM sessions WHERE token_hash = $1")).
		WithArgs("nonexistent-hash").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectClose()

	repo := NewPostgresSessionRepository(db)
	if err := repo.DeleteSession(context.Background(), "nonexistent-hash"); err != nil {
		t.Fatalf("DeleteSession() returned unexpected error for zero rows affected: %v", err)
	}

	if err := db.Close(); err != nil {
		t.Errorf("closing mock db: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

// TestDeleteSession_QueryError verifies that ExecContext errors are wrapped and propagated.
func TestDeleteSession_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	wantErr := errors.New("connection refused")
	mock.ExpectExec(regexp.QuoteMeta("DELETE FROM sessions WHERE token_hash = $1")).
		WithArgs("abc123hash").
		WillReturnError(wantErr)
	mock.ExpectClose()

	repo := NewPostgresSessionRepository(db)
	err = repo.DeleteSession(context.Background(), "abc123hash")
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

// TestGetSession_Success verifies that GetSession executes the SELECT and
// scans the result columns into a Session.
func TestGetSession_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	now := time.Now().UTC().Truncate(time.Second)
	expiresAt := now.Add(24 * time.Hour)

	rows := sqlmock.NewRows([]string{"id", "user_id", "token_hash", "created_at", "expires_at"}).
		AddRow("sess-id", "user-id", "hash-abc", now, expiresAt)

	mock.ExpectQuery(regexp.QuoteMeta("SELECT id, user_id, token_hash, created_at, expires_at FROM sessions WHERE token_hash = $1")).
		WithArgs("hash-abc").
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresSessionRepository(db)
	sess, err := repo.GetSession(context.Background(), "hash-abc")
	if err != nil {
		t.Fatalf("GetSession() returned unexpected error: %v", err)
	}
	if sess.ID != "sess-id" {
		t.Errorf("expected ID sess-id, got %q", sess.ID)
	}
	if sess.UserID != "user-id" {
		t.Errorf("expected UserID user-id, got %q", sess.UserID)
	}
	if sess.TokenHash != "hash-abc" {
		t.Errorf("expected TokenHash hash-abc, got %q", sess.TokenHash)
	}
	if !sess.ExpiresAt.Equal(expiresAt) {
		t.Errorf("expected ExpiresAt %v, got %v", expiresAt, sess.ExpiresAt)
	}

	if err := db.Close(); err != nil {
		t.Errorf("closing mock db: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

// TestGetSession_NotFound verifies that sql.ErrNoRows is translated to
// ErrSessionNotFound by the repository.
func TestGetSession_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	mock.ExpectQuery(regexp.QuoteMeta("SELECT id, user_id, token_hash, created_at, expires_at FROM sessions WHERE token_hash = $1")).
		WithArgs("nonexistent-hash").
		WillReturnError(sql.ErrNoRows)
	mock.ExpectClose()

	repo := NewPostgresSessionRepository(db)
	_, err = repo.GetSession(context.Background(), "nonexistent-hash")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrSessionNotFound) {
		t.Errorf("expected ErrSessionNotFound, got: %v", err)
	}

	if err := db.Close(); err != nil {
		t.Errorf("closing mock db: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

// TestGetSession_QueryError verifies that arbitrary query errors are wrapped and propagated.
func TestGetSession_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("creating sqlmock: %v", err)
	}

	wantErr := errors.New("conn reset")
	mock.ExpectQuery(regexp.QuoteMeta("SELECT id, user_id, token_hash, created_at, expires_at FROM sessions WHERE token_hash = $1")).
		WithArgs("some-hash").
		WillReturnError(wantErr)
	mock.ExpectClose()

	repo := NewPostgresSessionRepository(db)
	_, err = repo.GetSession(context.Background(), "some-hash")
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
