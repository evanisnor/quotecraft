package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/lib/pq"
)

// PostgresUserRepository implements UserWriter against a PostgreSQL database.
type PostgresUserRepository struct {
	db *sql.DB
}

// NewPostgresUserRepository creates a PostgresUserRepository backed by db.
func NewPostgresUserRepository(db *sql.DB) *PostgresUserRepository {
	return &PostgresUserRepository{db: db}
}

// CreateUser inserts a new user row and returns the created User.
// Returns ErrEmailConflict if the email violates the unique constraint (pq code 23505).
func (r *PostgresUserRepository) CreateUser(ctx context.Context, email, passwordHash string) (*User, error) {
	const query = `
		INSERT INTO users (email, password_hash)
		VALUES ($1, $2)
		RETURNING id, email, created_at
	`

	var u User
	err := r.db.QueryRowContext(ctx, query, email, passwordHash).Scan(
		&u.ID,
		&u.Email,
		&u.CreatedAt,
	)
	if err != nil {
		var pgErr *pq.Error
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrEmailConflict
		}
		return nil, fmt.Errorf("inserting user: %w", err)
	}

	return &u, nil
}

// GetUserByEmail fetches a user by email address.
// Returns ErrUserNotFound if no user with that email exists.
func (r *PostgresUserRepository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	const query = `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`
	var u User
	err := r.db.QueryRowContext(ctx, query, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("querying user: %w", err)
	}
	return &u, nil
}

// PostgresSessionRepository implements SessionWriter against a PostgreSQL database.
type PostgresSessionRepository struct {
	db *sql.DB
}

// NewPostgresSessionRepository creates a PostgresSessionRepository backed by db.
func NewPostgresSessionRepository(db *sql.DB) *PostgresSessionRepository {
	return &PostgresSessionRepository{db: db}
}

// DeleteSession removes the session row identified by tokenHash.
// If no row matches, no error is returned (the operation is idempotent).
func (r *PostgresSessionRepository) DeleteSession(ctx context.Context, tokenHash string) error {
	const query = `DELETE FROM sessions WHERE token_hash = $1`
	_, err := r.db.ExecContext(ctx, query, tokenHash)
	if err != nil {
		return fmt.Errorf("deleting session: %w", err)
	}
	return nil
}

// GetSession fetches the session identified by tokenHash.
// Returns ErrSessionNotFound if no row matches.
func (r *PostgresSessionRepository) GetSession(ctx context.Context, tokenHash string) (*Session, error) {
	const query = `SELECT id, user_id, token_hash, created_at, expires_at FROM sessions WHERE token_hash = $1`
	var sess Session
	err := r.db.QueryRowContext(ctx, query, tokenHash).Scan(
		&sess.ID, &sess.UserID, &sess.TokenHash, &sess.CreatedAt, &sess.ExpiresAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSessionNotFound
		}
		return nil, fmt.Errorf("querying session: %w", err)
	}
	return &sess, nil
}

// CreateSession inserts a new session row and returns the created Session.
func (r *PostgresSessionRepository) CreateSession(ctx context.Context, userID, tokenHash string, expiresAt time.Time) (*Session, error) {
	const query = `
		INSERT INTO sessions (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, token_hash, created_at, expires_at
	`

	var sess Session
	err := r.db.QueryRowContext(ctx, query, userID, tokenHash, expiresAt).Scan(
		&sess.ID,
		&sess.UserID,
		&sess.TokenHash,
		&sess.CreatedAt,
		&sess.ExpiresAt,
	)
	if err != nil {
		return nil, fmt.Errorf("inserting session: %w", err)
	}

	return &sess, nil
}
