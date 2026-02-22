package calculator

import (
	"context"
	"errors"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
)

func TestCreateCalculator_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	now := time.Now().UTC().Truncate(time.Second)
	rows := sqlmock.NewRows([]string{
		"id", "user_id", "config", "config_version", "is_deleted", "created_at", "updated_at",
	}).AddRow("calc-id", "user-id", []byte("{}"), 1, false, now, now)
	mock.ExpectQuery(`INSERT INTO calculators`).
		WithArgs("user-id").
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	calc, err := repo.CreateCalculator(context.Background(), "user-id")
	if err != nil {
		t.Fatalf("CreateCalculator() returned unexpected error: %v", err)
	}
	if calc.ID != "calc-id" {
		t.Errorf("expected ID %q, got %q", "calc-id", calc.ID)
	}
	if calc.UserID != "user-id" {
		t.Errorf("expected UserID %q, got %q", "user-id", calc.UserID)
	}
	if calc.ConfigVersion != 1 {
		t.Errorf("expected ConfigVersion 1, got %d", calc.ConfigVersion)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close() failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestCreateCalculator_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	wantErr := errors.New("constraint violation")
	mock.ExpectQuery(`INSERT INTO calculators`).
		WithArgs("user-id").
		WillReturnError(wantErr)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	_, err = repo.CreateCalculator(context.Background(), "user-id")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close() failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}
