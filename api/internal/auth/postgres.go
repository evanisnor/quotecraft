package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/lib/pq"
)

// PostgresUserRepository implements UserWriter, UserReader, and UserPasswordUpdater
// against a PostgreSQL database.
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

// GetOrCreateOAuthUser finds a user by OAuth provider and ID, or inserts a new
// user if none exists. Returns ErrEmailConflict if the email is already
// associated with a different account (pq code 23505 on the email column).
func (r *PostgresUserRepository) GetOrCreateOAuthUser(ctx context.Context, provider, oauthID, email string) (*User, error) {
	const insertQuery = `
		INSERT INTO users (oauth_provider, oauth_id, email)
		VALUES ($1, $2, $3)
		ON CONFLICT (oauth_provider, oauth_id) WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL
		DO NOTHING
		RETURNING id, email, created_at
	`

	var u User
	err := r.db.QueryRowContext(ctx, insertQuery, provider, oauthID, email).Scan(
		&u.ID,
		&u.Email,
		&u.CreatedAt,
	)
	if err == nil {
		return &u, nil
	}

	// INSERT returned no rows: the ON CONFLICT DO NOTHING clause fired because
	// the (oauth_provider, oauth_id) pair already exists. Fetch the existing row.
	if errors.Is(err, sql.ErrNoRows) {
		const selectQuery = `SELECT id, email, created_at FROM users WHERE oauth_provider = $1 AND oauth_id = $2`
		var existing User
		if err := r.db.QueryRowContext(ctx, selectQuery, provider, oauthID).Scan(
			&existing.ID,
			&existing.Email,
			&existing.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("fetching existing oauth user: %w", err)
		}
		return &existing, nil
	}

	// INSERT failed with a unique constraint violation on the email column:
	// the email is already registered to a different account.
	var pgErr *pq.Error
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return nil, ErrEmailConflict
	}

	return nil, fmt.Errorf("inserting oauth user: %w", err)
}

// UpdateUserPassword updates the password_hash for the user with the given ID.
func (r *PostgresUserRepository) UpdateUserPassword(ctx context.Context, userID, passwordHash string) error {
	const query = `UPDATE users SET password_hash = $1 WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, passwordHash, userID)
	if err != nil {
		return fmt.Errorf("updating password: %w", err)
	}
	return nil
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

// PostgresResetTokenRepository implements ResetTokenWriter, ResetTokenReader,
// and ResetTokenDeleter against a PostgreSQL database.
type PostgresResetTokenRepository struct {
	db *sql.DB
}

// NewPostgresResetTokenRepository creates a PostgresResetTokenRepository backed by db.
func NewPostgresResetTokenRepository(db *sql.DB) *PostgresResetTokenRepository {
	return &PostgresResetTokenRepository{db: db}
}

// CreateResetToken inserts a new password reset token row and returns the created record.
func (r *PostgresResetTokenRepository) CreateResetToken(ctx context.Context, userID, tokenHash string, expiresAt time.Time) (*PasswordResetToken, error) {
	const query = `
		INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, token_hash, expires_at, created_at
	`

	var t PasswordResetToken
	err := r.db.QueryRowContext(ctx, query, userID, tokenHash, expiresAt).Scan(
		&t.ID,
		&t.UserID,
		&t.TokenHash,
		&t.ExpiresAt,
		&t.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("inserting reset token: %w", err)
	}

	return &t, nil
}

// GetResetTokenByHash fetches the password reset token identified by tokenHash.
// Returns ErrResetTokenNotFound if no row matches.
func (r *PostgresResetTokenRepository) GetResetTokenByHash(ctx context.Context, tokenHash string) (*PasswordResetToken, error) {
	const query = `SELECT id, user_id, token_hash, expires_at, created_at FROM password_reset_tokens WHERE token_hash = $1`

	var t PasswordResetToken
	err := r.db.QueryRowContext(ctx, query, tokenHash).Scan(
		&t.ID,
		&t.UserID,
		&t.TokenHash,
		&t.ExpiresAt,
		&t.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrResetTokenNotFound
		}
		return nil, fmt.Errorf("querying reset token: %w", err)
	}

	return &t, nil
}

// DeleteResetToken removes the password reset token row identified by id.
// If no row matches, no error is returned (the operation is idempotent).
func (r *PostgresResetTokenRepository) DeleteResetToken(ctx context.Context, id string) error {
	const query = `DELETE FROM password_reset_tokens WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("deleting reset token: %w", err)
	}
	return nil
}
