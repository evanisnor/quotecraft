// Package calculator implements calculator creation and management.
package calculator

import (
	"context"
	"errors"
	"fmt"
	"time"
)

// ErrNotFound is returned when the requested calculator does not exist or has been soft-deleted.
var ErrNotFound = errors.New("calculator not found")

// ErrForbidden is returned when the authenticated user does not own the calculator.
var ErrForbidden = errors.New("access forbidden")

// Calculator represents a stored calculator definition.
type Calculator struct {
	ID            string
	UserID        string
	Config        []byte // raw JSONB stored as []byte
	ConfigVersion int
	IsDeleted     bool
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// Creator creates new calculator records.
type Creator interface {
	CreateCalculator(ctx context.Context, userID string) (*Calculator, error)
}

// Lister fetches lists of calculator records.
type Lister interface {
	ListCalculators(ctx context.Context, userID string) ([]*Calculator, error)
}

// Getter fetches a single calculator record.
type Getter interface {
	GetCalculator(ctx context.Context, id, userID string) (*Calculator, error)
}

// Updater updates the config of an existing calculator record.
type Updater interface {
	UpdateCalculator(ctx context.Context, id string, config []byte) (*Calculator, error)
}

// Service handles calculator business logic.
type Service struct {
	creator Creator
	lister  Lister
	getter  Getter
	updater Updater
}

// NewService creates a calculator Service with the given creator, lister, getter, and updater.
func NewService(creator Creator, lister Lister, getter Getter, updater Updater) *Service {
	return &Service{creator: creator, lister: lister, getter: getter, updater: updater}
}

// Create creates a new empty calculator owned by the given user.
func (s *Service) Create(ctx context.Context, userID string) (*Calculator, error) {
	calc, err := s.creator.CreateCalculator(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("creating calculator: %w", err)
	}
	return calc, nil
}

// List returns all non-deleted calculators owned by userID, ordered by updated_at descending.
func (s *Service) List(ctx context.Context, userID string) ([]*Calculator, error) {
	calcs, err := s.lister.ListCalculators(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("listing calculators: %w", err)
	}
	return calcs, nil
}

// Get returns the calculator identified by id if it is owned by userID.
// Returns ErrNotFound if the calculator does not exist or is soft-deleted.
// Returns ErrForbidden if the calculator exists but is owned by a different user.
func (s *Service) Get(ctx context.Context, id, userID string) (*Calculator, error) {
	calc, err := s.getter.GetCalculator(ctx, id, userID)
	if err != nil {
		return nil, fmt.Errorf("getting calculator: %w", err)
	}
	return calc, nil
}

// Update verifies ownership of the calculator then applies the new config.
// Returns ErrNotFound if the calculator does not exist or is soft-deleted.
// Returns ErrForbidden if the calculator exists but is owned by a different user.
func (s *Service) Update(ctx context.Context, id, userID string, config []byte) (*Calculator, error) {
	if _, err := s.getter.GetCalculator(ctx, id, userID); err != nil {
		return nil, fmt.Errorf("verifying calculator ownership: %w", err)
	}
	calc, err := s.updater.UpdateCalculator(ctx, id, config)
	if err != nil {
		return nil, fmt.Errorf("updating calculator: %w", err)
	}
	return calc, nil
}
