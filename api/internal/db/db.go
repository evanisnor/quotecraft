package db

import (
	"context"
	"database/sql"
	"fmt"

	_ "github.com/lib/pq" // PostgreSQL driver registration
)

// sqlOpener is a function that opens a database connection. Abstracted so
// tests can inject a fake without a real database.
type sqlOpener func(driverName, dataSourceName string) (*sql.DB, error)

// dbPool is the subset of *sql.DB operations used by DB. Defined as an
// interface so tests can inject a fake that exercises all code paths without
// a real database connection.
type dbPool interface {
	PingContext(ctx context.Context) error
	Close() error
}

// DB wraps a *sql.DB and implements the server.Pinger interface.
type DB struct {
	pool  dbPool
	sqlDB *sql.DB // raw handle exposed to repositories via DB()
}

// Open opens and pings a database connection using the given driver and DSN.
// Returns an error if the connection cannot be established or pinged.
func Open(driverName, dataSourceName string) (*DB, error) {
	return openWithOpener(driverName, dataSourceName, sql.Open)
}

// openWithOpener is the internal constructor that accepts an opener for
// test injection without a real database connection.
func openWithOpener(driverName, dataSourceName string, opener sqlOpener) (*DB, error) {
	sqlDB, err := opener(driverName, dataSourceName)
	if err != nil {
		return nil, fmt.Errorf("opening database: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("pinging database: %w", err)
	}

	return &DB{pool: sqlDB, sqlDB: sqlDB}, nil
}

// newWithPool constructs a DB from an existing dbPool and raw *sql.DB.
// Used in tests to inject a fake pool.
func newWithPool(pool dbPool, sqlDB *sql.DB) *DB {
	return &DB{pool: pool, sqlDB: sqlDB}
}

// Ping verifies the database connection is still alive. Implements server.Pinger.
func (d *DB) Ping(ctx context.Context) error {
	if err := d.pool.PingContext(ctx); err != nil {
		return fmt.Errorf("pinging database: %w", err)
	}
	return nil
}

// DB returns the underlying *sql.DB for use by repositories.
func (d *DB) DB() *sql.DB {
	return d.sqlDB
}

// Close closes the database connection pool.
func (d *DB) Close() error {
	if err := d.pool.Close(); err != nil {
		return fmt.Errorf("closing database: %w", err)
	}
	return nil
}
