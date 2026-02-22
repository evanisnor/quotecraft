package calculator

import (
	"context"
	"errors"
	"testing"
	"time"
)

type stubCreator struct {
	calc *Calculator
	err  error
}

func (s *stubCreator) CreateCalculator(_ context.Context, _ string) (*Calculator, error) {
	return s.calc, s.err
}

func TestCreate_Success(t *testing.T) {
	want := &Calculator{ID: "calc-abc", UserID: "user-xyz", CreatedAt: time.Now()}
	svc := NewService(&stubCreator{calc: want})
	got, err := svc.Create(context.Background(), "user-xyz")
	if err != nil {
		t.Fatalf("Create() returned unexpected error: %v", err)
	}
	if got.ID != "calc-abc" {
		t.Errorf("expected ID %q, got %q", "calc-abc", got.ID)
	}
}

func TestCreate_RepositoryError(t *testing.T) {
	wantErr := errors.New("db failure")
	svc := NewService(&stubCreator{err: wantErr})
	_, err := svc.Create(context.Background(), "user-xyz")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}
