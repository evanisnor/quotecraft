package calculator

import (
	"context"
	"database/sql"
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
