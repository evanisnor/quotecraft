package db

import (
	"errors"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// Migrator runs database schema migrations.
type Migrator interface {
	Up() error
}

// runner is the subset of *migrate.Migrate used by FileMigrator. Defined here
// to allow injection of a stub in tests.
type runner interface {
	Up() error
}

// migrateFactory creates a runner from a source URL and database URL. Exists
// as a field so tests can substitute a fake without a real database.
type migrateFactory func(sourceURL, databaseURL string) (runner, error)

// defaultFactory delegates to the real golang-migrate constructor.
func defaultFactory(sourceURL, databaseURL string) (runner, error) {
	return migrate.New(sourceURL, databaseURL)
}

// FileMigrator applies migrations from the filesystem using golang-migrate.
type FileMigrator struct {
	r runner
}

// NewFileMigrator creates a FileMigrator backed by golang-migrate using the
// file source and the postgres driver.
//
// migrationsPath is the local directory containing the migration files.
// databaseURL is a standard postgres connection URL.
func NewFileMigrator(migrationsPath, databaseURL string) (*FileMigrator, error) {
	return newFileMigratorWithFactory(migrationsPath, databaseURL, defaultFactory)
}

// newFileMigratorWithFactory creates a FileMigrator using the provided factory
// to construct the underlying runner. Used in tests to avoid real database
// connections.
func newFileMigratorWithFactory(migrationsPath, databaseURL string, factory migrateFactory) (*FileMigrator, error) {
	r, err := factory("file://"+migrationsPath, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("creating file migrator: %w", err)
	}
	return &FileMigrator{r: r}, nil
}

// newFileMigratorWithRunner creates a FileMigrator backed by an arbitrary
// runner. Used in tests to avoid real database connections.
func newFileMigratorWithRunner(r runner) *FileMigrator {
	return &FileMigrator{r: r}
}

// Up applies all pending up migrations. ErrNoChange is treated as success.
func (fm *FileMigrator) Up() error {
	err := fm.r.Up()
	if err == nil || errors.Is(err, migrate.ErrNoChange) {
		return nil
	}
	return fmt.Errorf("running up migrations: %w", err)
}
