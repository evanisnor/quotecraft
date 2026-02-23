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

func TestUpdateCalculator_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	now := time.Now().UTC().Truncate(time.Second)
	newConfig := []byte(`{"key":"value"}`)
	rows := sqlmock.NewRows(listColumns).
		AddRow("calc-id", "user-id", newConfig, 2, false, now, now)
	mock.ExpectQuery(`UPDATE calculators`).
		WithArgs("calc-id", newConfig).
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	calc, err := repo.UpdateCalculator(context.Background(), "calc-id", newConfig)
	if err != nil {
		t.Fatalf("UpdateCalculator() returned unexpected error: %v", err)
	}
	if calc.ID != "calc-id" {
		t.Errorf("expected ID %q, got %q", "calc-id", calc.ID)
	}
	if calc.ConfigVersion != 2 {
		t.Errorf("expected ConfigVersion 2, got %d", calc.ConfigVersion)
	}
	if string(calc.Config) != string(newConfig) {
		t.Errorf("expected Config %q, got %q", string(newConfig), string(calc.Config))
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close() failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestUpdateCalculator_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	rows := sqlmock.NewRows(listColumns)
	mock.ExpectQuery(`UPDATE calculators`).
		WithArgs("calc-missing", []byte(`{}`)).
		WillReturnRows(rows)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	_, err = repo.UpdateCalculator(context.Background(), "calc-missing", []byte(`{}`))
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

func TestUpdateCalculator_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	wantErr := errors.New("connection reset")
	mock.ExpectQuery(`UPDATE calculators`).
		WithArgs("calc-id", []byte(`{}`)).
		WillReturnError(wantErr)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	_, err = repo.UpdateCalculator(context.Background(), "calc-id", []byte(`{}`))
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

func TestDeleteCalculator_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	mock.ExpectExec(`UPDATE calculators`).
		WithArgs("calc-id").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	if err := repo.DeleteCalculator(context.Background(), "calc-id"); err != nil {
		t.Fatalf("DeleteCalculator() returned unexpected error: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close() failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestDeleteCalculator_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	mock.ExpectExec(`UPDATE calculators`).
		WithArgs("calc-missing").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	err = repo.DeleteCalculator(context.Background(), "calc-missing")
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

func TestDeleteCalculator_QueryError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	wantErr := errors.New("connection reset")
	mock.ExpectExec(`UPDATE calculators`).
		WithArgs("calc-id").
		WillReturnError(wantErr)
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	err = repo.DeleteCalculator(context.Background(), "calc-id")
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

func TestGetPublicCalculatorConfig_Success(t *testing.T) {
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
	calc, err := repo.GetPublicCalculatorConfig(context.Background(), "calc-id")
	if err != nil {
		t.Fatalf("GetPublicCalculatorConfig() returned unexpected error: %v", err)
	}
	if calc.ID != "calc-id" {
		t.Errorf("expected ID %q, got %q", "calc-id", calc.ID)
	}
	if calc.ConfigVersion != 1 {
		t.Errorf("expected ConfigVersion 1, got %d", calc.ConfigVersion)
	}
	if string(calc.Config) != `{"field":"value"}` {
		t.Errorf("expected Config %q, got %q", `{"field":"value"}`, string(calc.Config))
	}
	if err := db.Close(); err != nil {
		t.Fatalf("Close() failed: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unmet expectations: %v", err)
	}
}

func TestGetPublicCalculatorConfig_NotFound(t *testing.T) {
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
	_, err = repo.GetPublicCalculatorConfig(context.Background(), "calc-missing")
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

func TestGetPublicCalculatorConfig_QueryError(t *testing.T) {
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
	_, err = repo.GetPublicCalculatorConfig(context.Background(), "calc-id")
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

func TestDeleteCalculator_RowsAffectedError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New() failed: %v", err)
	}

	wantErr := errors.New("rows affected not supported")
	mock.ExpectExec(`UPDATE calculators`).
		WithArgs("calc-id").
		WillReturnResult(sqlmock.NewErrorResult(wantErr))
	mock.ExpectClose()

	repo := NewPostgresCalculatorRepository(db)
	err = repo.DeleteCalculator(context.Background(), "calc-id")
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
