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
		SELECT id, user_id, config, config_version, is_deleted, created_at, updated_at
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
		if err := rows.Scan(&c.ID, &c.UserID, &c.Config, &c.ConfigVersion, &c.IsDeleted, &c.CreatedAt, &c.UpdatedAt); err != nil {
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
		SELECT id, user_id, config, config_version, is_deleted, created_at, updated_at
		FROM calculators
		WHERE id = $1 AND is_deleted = FALSE
	`
	var c Calculator
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&c.ID, &c.UserID, &c.Config, &c.ConfigVersion, &c.IsDeleted, &c.CreatedAt, &c.UpdatedAt,
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

// CreateCalculator inserts a new calculator row and returns the created Calculator.
// The config defaults to '{}' and config_version to 1 per the table definition.
func (r *PostgresCalculatorRepository) CreateCalculator(ctx context.Context, userID string) (*Calculator, error) {
	const query = `
		INSERT INTO calculators (user_id)
		VALUES ($1)
		RETURNING id, user_id, config, config_version, is_deleted, created_at, updated_at
	`
	var c Calculator
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&c.ID,
		&c.UserID,
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
