package main

import (
	"context"
	"database/sql"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"strings"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// AdminUserCreator creates or updates an admin user record.
type AdminUserCreator interface {
	CreateAdminUser(ctx context.Context, email, passwordHash string) error
}

// postgresAdminUserCreator implements AdminUserCreator against a PostgreSQL database.
type postgresAdminUserCreator struct {
	db *sql.DB
}

// CreateAdminUser upserts an admin user by email and password hash. If a user
// with the given email already exists the password hash is updated.
func (c *postgresAdminUserCreator) CreateAdminUser(ctx context.Context, email, passwordHash string) error {
	_, err := c.db.ExecContext(ctx,
		`INSERT INTO users (email, password_hash) VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
		email,
		passwordHash,
	)
	if err != nil {
		return fmt.Errorf("upsert admin user %q: %w", email, err)
	}
	return nil
}

// run validates the provided credentials, hashes the password, and calls the creator.
// hasher is injected so tests can substitute a deterministic or failing implementation.
func run(ctx context.Context, creator AdminUserCreator, email, password string, hasher func([]byte, int) ([]byte, error)) error {
	if email == "" {
		return errors.New("email is required")
	}
	if strings.Count(email, "@") != 1 || strings.Index(email, "@") == 0 || strings.Index(email, "@") == len(email)-1 {
		return errors.New("email must be a valid address")
	}
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	hash, err := hasher([]byte(password), 12)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}
	if err := creator.CreateAdminUser(ctx, email, string(hash)); err != nil {
		return fmt.Errorf("create admin user: %w", err)
	}
	return nil
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("cmd", "create-admin-user")
	ctx := context.Background()

	var email string
	var password string
	flag.StringVar(&email, "email", "", "admin user email address")
	flag.StringVar(&password, "password", "", "admin user password (min 8 characters)")
	flag.Parse()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://quotecraft:quotecraft@localhost:5432/quotecraft?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		logger.Error("failed to open database", "error", err)
		os.Exit(1)
	}
	defer func() {
		if err := db.Close(); err != nil {
			logger.Error("closing database connection", "error", err)
		}
	}()

	if err := db.PingContext(ctx); err != nil {
		logger.Error("failed to ping database", "error", err)
		os.Exit(1)
	}

	creator := &postgresAdminUserCreator{db: db}

	if err := run(ctx, creator, email, password, bcrypt.GenerateFromPassword); err != nil {
		logger.Error("failed to create admin user", "error", err)
		os.Exit(1)
	}

	logger.Info("admin user created", "email", email)
}
