package main

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"os"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// UserSeeder seeds a single user into the data store.
type UserSeeder interface {
	SeedUser(ctx context.Context, email, passwordHash string) error
}

// seedUser holds the plaintext credentials for a development user.
type seedUser struct {
	Email    string
	Password string
}

// devUsers is the set of development users seeded into the database.
var devUsers = []seedUser{
	{Email: "alice@example.com", Password: "alice-dev-password"},
	{Email: "bob@example.com", Password: "bob-dev-password"},
	{Email: "charlie@example.com", Password: "charlie-dev-password"},
}

// postgresSeeder inserts users into the PostgreSQL users table.
type postgresSeeder struct {
	db *sql.DB
}

// SeedUser inserts a user by email and password hash. Existing users are silently skipped.
func (s *postgresSeeder) SeedUser(ctx context.Context, email, passwordHash string) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`,
		email,
		passwordHash,
	)
	if err != nil {
		return fmt.Errorf("insert user %q: %w", email, err)
	}
	return nil
}

// run hashes each user's password and seeds them via the provided UserSeeder.
// hasher is injected so tests can substitute a deterministic implementation.
func run(ctx context.Context, seeder UserSeeder, users []seedUser, hasher func([]byte, int) ([]byte, error)) error {
	for _, u := range users {
		hash, err := hasher([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("hash password for %q: %w", u.Email, err)
		}
		if err := seeder.SeedUser(ctx, u.Email, string(hash)); err != nil {
			return fmt.Errorf("seed user %q: %w", u.Email, err)
		}
	}
	return nil
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("cmd", "db-seed")
	ctx := context.Background()

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

	seeder := &postgresSeeder{db: db}

	if err := run(ctx, seeder, devUsers, bcrypt.GenerateFromPassword); err != nil {
		logger.Error("seeding failed", "error", err)
		os.Exit(1)
	}

	for _, u := range devUsers {
		logger.Info("user seeded", "email", u.Email)
	}
}
