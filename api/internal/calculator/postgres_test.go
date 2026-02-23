package calculator

import (
	"context"
	"errors"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
)

var listColumns = []string{"id", "user_id", "config", "config_version", "is_deleted", "created_at", "updated_at"}

func TestListCalculators_Empty(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	rows := sqlmock.NewRows(listColumns)
	mock.ExpectQuery(`SELECT id, user_id`).
		WithArgs("user-id").
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	calcs, err := repo.ListCalculators(context.Background(), "user-id")
	if err != nil {
		t.Fatalf("ListCalculators() returned unexpected error: %v", err)
	}
	if calcs == nil {
		t.Fatal("expected empty slice, got nil")
	}
	if len(calcs) != 0 {
		t.Errorf("expected 0 calculators, got %d", len(calcs))
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close() failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestListCalculators_Multiple(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	now := time.Now().UTC().Truncate(time.Second)
	rows := sqlmock.NewRows(listColumns).
		AddRow("calc-1", "user-id", []byte(`{}`), 1, false, now, now).
		AddRow("calc-2", "user-id", []byte(`{}`), 2, false, now, now)
	mock.ExpectQuery(`SELECT id, user_id`).
		WithArgs("user-id").
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	calcs, err := repo.ListCalculators(context.Background(), "user-id")
	if err != nil {
		t.Fatalf("ListCalculators() returned unexpected error: %v", err)
	}
	if len(calcs) != 2 {
		t.Fatalf("expected 2 calculators, got %d", len(calcs))
	}
	if calcs[0].ID != "calc-1" {
		t.Errorf("expected first ID %q, got %q", "calc-1", calcs[0].ID)
	}
	if calcs[0].UserID != "user-id" {
		t.Errorf("expected UserID %q, got %q", "user-id", calcs[0].UserID)
	}
	if calcs[1].ID != "calc-2" {
		t.Errorf("expected second ID %q, got %q", "calc-2", calcs[1].ID)
	}
	if calcs[1].ConfigVersion != 2 {
		t.Errorf("expected ConfigVersion 2, got %d", calcs[1].ConfigVersion)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close() failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestListCalculators_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	wantErr := errors.New("connection reset")
	mock.ExpectQuery(`SELECT id, user_id`).
		WithArgs("user-id").
		WillReturnError(wantErr)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	_, err = repo.ListCalculators(context.Background(), "user-id")
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

func TestListCalculators_ScanError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	// Return only one column — scan expects seven, so this triggers a scan error.
	rows := sqlmock.NewRows([]string{"id"}).AddRow("calc-id")
	mock.ExpectQuery(`SELECT id, user_id`).
		WithArgs("user-id").
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	_, err = repo.ListCalculators(context.Background(), "user-id")
	if err == nil {
		t.Fatal("expected scan error, got nil")
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close() failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestListCalculators_RowsError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	wantErr := errors.New("rows iteration failure")
	now := time.Now().UTC().Truncate(time.Second)
	rows := sqlmock.NewRows(listColumns).
		AddRow("calc-1", "user-id", []byte(`{}`), 1, false, now, now).
		RowError(0, wantErr)
	mock.ExpectQuery(`SELECT id, user_id`).
		WithArgs("user-id").
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	_, err = repo.ListCalculators(context.Background(), "user-id")
	if err == nil {
		t.Fatal("expected rows error, got nil")
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

func TestGetCalculator_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	now := time.Now().UTC().Truncate(time.Second)
	rows := sqlmock.NewRows(listColumns).
		AddRow("calc-id", "user-id", []byte(`{"field":"value"}`), 1, false, now, now)
	mock.ExpectQuery(`SELECT id, user_id`).
		WithArgs("calc-id").
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	calc, err := repo.GetCalculator(context.Background(), "calc-id", "user-id")
	if err != nil {
		t.Fatalf("GetCalculator() returned unexpected error: %v", err)
	}
	if calc.ID != "calc-id" {
		t.Errorf("expected ID %q, got %q", "calc-id", calc.ID)
	}
	if calc.UserID != "user-id" {
		t.Errorf("expected UserID %q, got %q", "user-id", calc.UserID)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close() failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestGetCalculator_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	rows := sqlmock.NewRows(listColumns)
	mock.ExpectQuery(`SELECT id, user_id`).
		WithArgs("calc-missing").
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	_, err = repo.GetCalculator(context.Background(), "calc-missing", "user-id")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("expected ErrNotFound, got: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close() failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestGetCalculator_Forbidden(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	now := time.Now().UTC().Truncate(time.Second)
	// Row belongs to "other-user", not "user-id"
	rows := sqlmock.NewRows(listColumns).
		AddRow("calc-id", "other-user", []byte(`{}`), 1, false, now, now)
	mock.ExpectQuery(`SELECT id, user_id`).
		WithArgs("calc-id").
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	_, err = repo.GetCalculator(context.Background(), "calc-id", "user-id")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrForbidden) {
		t.Errorf("expected ErrForbidden, got: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close() failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestGetCalculator_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	wantErr := errors.New("connection reset")
	mock.ExpectQuery(`SELECT id, user_id`).
		WithArgs("calc-id").
		WillReturnError(wantErr)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	_, err = repo.GetCalculator(context.Background(), "calc-id", "user-id")
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
