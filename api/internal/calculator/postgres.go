package calculator

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

// PostgresCalculatorRepository implements Creator against a PostgreSQL database.
type PostgresCalculatorRepository struct {
	db *sql.DB
}

// NewPostgresCalculatorRepository creates a PostgresCalculatorRepository backed by db.
func NewPostgresCalculatorRepository(db *sql.DB) *PostgresCalculatorRepository {
	return &PostgresCalculatorRepository{db: db}
}

// ListCalculators returns all non-deleted calculators owned by userID, ordered by updated_at DESC.
func (r *PostgresCalculatorRepository) ListCalculators(ctx context.Context, userID string) ([]*Calculator, error) {
	const query = `
		SELECT id, user_id, name, config, config_version, is_deleted, created_at, updated_at
		FROM calculators
		WHERE user_id = $1 AND is_deleted = FALSE
		ORDER BY updated_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("querying calculators: %w", err)
	}
	defer rows.Close()

	calcs := make([]*Calculator, 0)
	for rows.Next() {
		var c Calculator
		if err := rows.Scan(&c.ID, &c.UserID, &c.Name, &c.Config, &c.ConfigVersion, &c.IsDeleted, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning calculator: %w", err)
		}
		calcs = append(calcs, &c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating calculators: %w", err)
	}
	return calcs, nil
}

// GetCalculator fetches the calculator by id that is not soft-deleted.
// Returns ErrNotFound if no matching, non-deleted row exists.
// Returns ErrForbidden if the row exists but belongs to a different user.
//
// The query uses only the id parameter (not userID) so that the application
// can distinguish between "not found" and "forbidden" rather than returning
// ErrNotFound for both cases. The ownership check is performed in Go after
// the row is fetched.
func (r *PostgresCalculatorRepository) GetCalculator(ctx context.Context, id, userID string) (*Calculator, error) {
	const query = `
		SELECT id, user_id, name, config, config_version, is_deleted, created_at, updated_at
		FROM calculators
		WHERE id = $1 AND is_deleted = FALSE
	`
	var c Calculator
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&c.ID, &c.UserID, &c.Name, &c.Config, &c.ConfigVersion, &c.IsDeleted, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("querying calculator: %w", err)
	}
	if c.UserID != userID {
		return nil, ErrForbidden
	}
	return &c, nil
}

// GetPublicCalculatorConfig fetches the calculator by id without an ownership check.
// Returns ErrNotFound if no matching, non-deleted row exists.
func (r *PostgresCalculatorRepository) GetPublicCalculatorConfig(ctx context.Context, id string) (*Calculator, error) {
	const query = `
		SELECT id, user_id, name, config, config_version, is_deleted, created_at, updated_at
		FROM calculators
		WHERE id = $1 AND is_deleted = FALSE
	`
	var c Calculator
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&c.ID, &c.UserID, &c.Name, &c.Config, &c.ConfigVersion, &c.IsDeleted, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("querying calculator config: %w", err)
	}
	return &c, nil
}

// UpdateCalculator updates the config of the calculator identified by id and increments config_version.
// Returns ErrNotFound if no matching, non-deleted row exists.
func (r *PostgresCalculatorRepository) UpdateCalculator(ctx context.Context, id string, config []byte) (*Calculator, error) {
	const query = `
		UPDATE calculators
		SET config = $2, config_version = config_version + 1
		WHERE id = $1 AND is_deleted = FALSE
		RETURNING id, user_id, name, config, config_version, is_deleted, created_at, updated_at
	`
	var c Calculator
	err := r.db.QueryRowContext(ctx, query, id, config).Scan(
		&c.ID, &c.UserID, &c.Name, &c.Config, &c.ConfigVersion, &c.IsDeleted, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("updating calculator: %w", err)
	}
	return &c, nil
}

// DeleteCalculator soft-deletes the calculator identified by id.
// Returns ErrNotFound if no matching, non-deleted row exists.
func (r *PostgresCalculatorRepository) DeleteCalculator(ctx context.Context, id string) error {
	const query = `UPDATE calculators SET is_deleted = TRUE WHERE id = $1 AND is_deleted = FALSE`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("deleting calculator: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("checking rows affected: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// CreateCalculator inserts a new calculator row and returns the created Calculator.
// The name defaults to ”, config defaults to '{}', and config_version to 1 per the table definition.
func (r *PostgresCalculatorRepository) CreateCalculator(ctx context.Context, userID string) (*Calculator, error) {
	const query = `
		INSERT INTO calculators (user_id)
		VALUES ($1)
		RETURNING id, user_id, name, config, config_version, is_deleted, created_at, updated_at
	`
	var c Calculator
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&c.ID,
		&c.UserID,
		&c.Name,
		&c.Config,
		&c.ConfigVersion,
		&c.IsDeleted,
		&c.CreatedAt,
		&c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("inserting calculator: %w", err)
	}
	return &c, nil
}
