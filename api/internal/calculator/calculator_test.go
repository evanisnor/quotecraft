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

type stubUpdater struct {
	calc *Calculator
	err  error
}

func (s *stubUpdater) UpdateCalculator(_ context.Context, _ string, _ []byte) (*Calculator, error) {
	return s.calc, s.err
}

type stubDeleter struct {
	err error
}

func (s *stubDeleter) DeleteCalculator(_ context.Context, _ string) error {
	return s.err
}

func TestCreate_Success(t *testing.T) {
	want := &Calculator{ID: "calc-abc", UserID: "user-xyz", CreatedAt: time.Now()}
	svc := NewService(&stubCreator{calc: want}, &stubLister{}, &stubGetter{}, &stubUpdater{}, &stubDeleter{})
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
	svc := NewService(&stubCreator{err: wantErr}, &stubLister{}, &stubGetter{}, &stubUpdater{}, &stubDeleter{})
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
	svc := NewService(&stubCreator{}, &stubLister{calcs: want}, &stubGetter{}, &stubUpdater{}, &stubDeleter{})
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
	svc := NewService(&stubCreator{}, &stubLister{calcs: []*Calculator{}}, &stubGetter{}, &stubUpdater{}, &stubDeleter{})
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
	svc := NewService(&stubCreator{}, &stubLister{err: wantErr}, &stubGetter{}, &stubUpdater{}, &stubDeleter{})
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
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{calc: want}, &stubUpdater{}, &stubDeleter{})
	got, err := svc.Get(context.Background(), "calc-abc", "user-xyz")
	if err != nil {
		t.Fatalf("Get() returned unexpected error: %v", err)
	}
	if got.ID != "calc-abc" {
		t.Errorf("expected ID %q, got %q", "calc-abc", got.ID)
	}
}

func TestGet_NotFound(t *testing.T) {
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{err: ErrNotFound}, &stubUpdater{}, &stubDeleter{})
	_, err := svc.Get(context.Background(), "calc-missing", "user-xyz")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("expected wrapped ErrNotFound, got: %v", err)
	}
}

func TestGet_Forbidden(t *testing.T) {
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{err: ErrForbidden}, &stubUpdater{}, &stubDeleter{})
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
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{err: wantErr}, &stubUpdater{}, &stubDeleter{})
	_, err := svc.Get(context.Background(), "calc-abc", "user-xyz")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

func TestUpdate_Success(t *testing.T) {
	now := time.Now()
	existing := &Calculator{
		ID:            "calc-abc",
		UserID:        "user-xyz",
		Config:        []byte(`{}`),
		ConfigVersion: 1,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	updated := &Calculator{
		ID:            "calc-abc",
		UserID:        "user-xyz",
		Config:        []byte(`{"key":"value"}`),
		ConfigVersion: 2,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{calc: existing}, &stubUpdater{calc: updated}, &stubDeleter{})
	got, err := svc.Update(context.Background(), "calc-abc", "user-xyz", []byte(`{"key":"value"}`))
	if err != nil {
		t.Fatalf("Update() returned unexpected error: %v", err)
	}
	if got.ID != "calc-abc" {
		t.Errorf("expected ID %q, got %q", "calc-abc", got.ID)
	}
	if got.ConfigVersion != 2 {
		t.Errorf("expected ConfigVersion 2, got %d", got.ConfigVersion)
	}
}

func TestUpdate_GetterError_NotFound(t *testing.T) {
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{err: ErrNotFound}, &stubUpdater{}, &stubDeleter{})
	_, err := svc.Update(context.Background(), "calc-missing", "user-xyz", []byte(`{}`))
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("expected wrapped ErrNotFound, got: %v", err)
	}
}

func TestUpdate_GetterError_Forbidden(t *testing.T) {
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{err: ErrForbidden}, &stubUpdater{}, &stubDeleter{})
	_, err := svc.Update(context.Background(), "calc-abc", "other-user", []byte(`{}`))
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrForbidden) {
		t.Errorf("expected wrapped ErrForbidden, got: %v", err)
	}
}

func TestUpdate_UpdaterError(t *testing.T) {
	now := time.Now()
	existing := &Calculator{ID: "calc-abc", UserID: "user-xyz", CreatedAt: now, UpdatedAt: now}
	wantErr := errors.New("db failure")
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{calc: existing}, &stubUpdater{err: wantErr}, &stubDeleter{})
	_, err := svc.Update(context.Background(), "calc-abc", "user-xyz", []byte(`{}`))
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}

func TestDelete_Success(t *testing.T) {
	now := time.Now()
	existing := &Calculator{ID: "calc-abc", UserID: "user-xyz", CreatedAt: now, UpdatedAt: now}
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{calc: existing}, &stubUpdater{}, &stubDeleter{})
	if err := svc.Delete(context.Background(), "calc-abc", "user-xyz"); err != nil {
		t.Fatalf("Delete() returned unexpected error: %v", err)
	}
}

func TestDelete_GetterError_NotFound(t *testing.T) {
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{err: ErrNotFound}, &stubUpdater{}, &stubDeleter{})
	err := svc.Delete(context.Background(), "calc-missing", "user-xyz")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("expected wrapped ErrNotFound, got: %v", err)
	}
}

func TestDelete_GetterError_Forbidden(t *testing.T) {
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{err: ErrForbidden}, &stubUpdater{}, &stubDeleter{})
	err := svc.Delete(context.Background(), "calc-abc", "other-user")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, ErrForbidden) {
		t.Errorf("expected wrapped ErrForbidden, got: %v", err)
	}
}

func TestDelete_DeleterError(t *testing.T) {
	now := time.Now()
	existing := &Calculator{ID: "calc-abc", UserID: "user-xyz", CreatedAt: now, UpdatedAt: now}
	wantErr := errors.New("db failure")
	svc := NewService(&stubCreator{}, &stubLister{}, &stubGetter{calc: existing}, &stubUpdater{}, &stubDeleter{err: wantErr})
	err := svc.Delete(context.Background(), "calc-abc", "user-xyz")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
}
