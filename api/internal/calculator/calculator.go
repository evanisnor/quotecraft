// Package calculator implements calculator creation and management.
package calculator

import (
	"context"
	"fmt"
	"time"
)

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

// Service handles calculator business logic.
type Service struct {
	creator Creator
	lister  Lister
}

// NewService creates a calculator Service with the given creator and lister.
func NewService(creator Creator, lister Lister) *Service {
	return &Service{creator: creator, lister: lister}
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
