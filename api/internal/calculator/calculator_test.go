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

type stubLister struct {
	calcs []*Calculator
	err   error
}

func (s *stubLister) ListCalculators(_ context.Context, _ string) ([]*Calculator, error) {
	return s.calcs, s.err
}

type stubGetter struct {
	calc *Calculator
	err  error
}

func (s *stubGetter) GetCalculator(_ context.Context, _, _ string) (*Calculator, error) {
	return s.calc, s.err
}

func TestCreate_Success(t *testing.T) {
	want := &Calculator{ID: "calc-abc", UserID: "user-xyz", CreatedAt: time.Now()}
	svc := NewService(&stubCreator{calc: want}, &stubLister{}, &stubGetter{})
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
	svc := NewService(&stubCreator{err: wantErr}, &stubLister{}, &stubGetter{})
	_, err := svc.Create(context.Background(), "user-xyz")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

func TestList_Success(t *testing.T) {
	now := time.Now()
	want := []*Calculator{
		{ID: "calc-1", UserID: "user-xyz", CreatedAt: now, UpdatedAt: now},
		{ID: "calc-2", UserID: "user-xyz", CreatedAt: now, UpdatedAt: now},
	}
	svc := NewService(&stubCreator{}, &stubLister{calcs: want}, &stubGetter{})
	got, err := svc.List(context.Background(), "user-xyz")
	if err != nil {
		t.Fatalf("List() returned unexpected error: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("expected 2 calculators, got %d", len(got))
	}
	if got[0].ID != "calc-1" {
		t.Errorf("expected first ID %q, got %q", "calc-1", got[0].ID)
	}
	if got[1].ID != "calc-2" {
		t.Errorf("expected second ID %q, got %q", "calc-2", got[1].ID)
	}
}

func TestList_Empty(t *testing.T) {
	svc := NewService(&stubCreator{}, &stubLister{calcs: []*Calculator{}}, &stubGetter{})
	got, err := svc.List(context.Background(), "user-xyz")
	if err != nil {
		t.Fatalf("List() returned unexpected error: %v", err)
	}
	if got == nil {
		t.Fatal("expected empty slice, got nil")
	}
	if len(got) != 0 {
		t.Errorf("expected 0 calculators, got %d", len(got))
	}
}

func TestList_RepositoryError(t *testing.T) {
	wantErr := errors.New("db failure")
	svc := NewService(&stubCreator{}, &stubLister{err: wantErr}, &stubGetter{})
	_, err := svc.List(context.Background(), "user-xyz")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

func TestGet_Success(t *testing.T) {
	now := time.Now()
	want := &Calculator{
		ID:        "calc-abc",
		UserID:    "user-xyz",
		Config:    []byte(`{"field":"value"}`),
		CreatedAt: now,
		UpdatedAt: now,
	}
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{calc: want})
	got, err := svc.Get(context.Background(), "calc-abc", "user-xyz")
	if err != nil {
		t.Fatalf("Get() returned unexpected error: %v", err)
	}
	if got.ID != "calc-abc" {
		t.Errorf("expected ID %q, got %q", "calc-abc", got.ID)
	}
}

func TestGet_NotFound(t *testing.T) {
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{err: ErrNotFound})
	_, err := svc.Get(context.Background(), "calc-missing", "user-xyz")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("expected wrapped ErrNotFound, got: %v", err)
	}
}

func TestGet_Forbidden(t *testing.T) {
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{err: ErrForbidden})
	_, err := svc.Get(context.Background(), "calc-abc", "other-user")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrForbidden) {
		t.Errorf("expected wrapped ErrForbidden, got: %v", err)
	}
}

func TestGet_RepositoryError(t *testing.T) {
	wantErr := errors.New("db failure")
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{err: wantErr})
	_, err := svc.Get(context.Background(), "calc-abc", "user-xyz")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}
