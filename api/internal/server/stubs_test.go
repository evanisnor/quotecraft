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
