package server

import (
	"context"

	"github.com/evanisnor/quotecraft/api/internal/calculator"
)

// stubPinger is a reusable test implementation of Pinger. It is shared across
// test files in this package (health_test.go, server_test.go).
type stubPinger struct {
	err error
}

func (s *stubPinger) Ping(_ context.Context) error {
	return s.err
}

// stubAuthService is a reusable test implementation of AuthService.
type stubAuthService struct {
	token  string
	userID string
	err    error
}

func (s *stubAuthService) Register(_ context.Context, _, _ string) (string, error) {
	return s.token, s.err
}

func (s *stubAuthService) Login(_ context.Context, _, _ string) (string, error) {
	return s.token, s.err
}

func (s *stubAuthService) Logout(_ context.Context, _ string) error {
	return s.err
}

func (s *stubAuthService) ValidateToken(_ context.Context, _ string) (string, error) {
	return s.userID, s.err
}

// stubCalculatorService is a reusable test implementation of CalculatorService.
type stubCalculatorService struct {
	calc  *calculator.Calculator
	calcs []*calculator.Calculator
	err   error
}

func (s *stubCalculatorService) Create(_ context.Context, _ string) (*calculator.Calculator, error) {
	return s.calc, s.err
}

func (s *stubCalculatorService) List(_ context.Context, _ string) ([]*calculator.Calculator, error) {
	return s.calcs, s.err
}

func (s *stubCalculatorService) Get(_ context.Context, _, _ string) (*calculator.Calculator, error) {
	return s.calc, s.err
}

func (s *stubCalculatorService) Update(_ context.Context, _, _ string, _ []byte) (*calculator.Calculator, error) {
	return s.calc, s.err
}
