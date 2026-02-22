package server

import "context"

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
	token string
	err   error
}

func (s *stubAuthService) Register(_ context.Context, _, _ string) (string, error) {
	return s.token, s.err
}

func (s *stubAuthService) Login(_ context.Context, _, _ string) (string, error) {
	return s.token, s.err
}
