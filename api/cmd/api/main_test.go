package main

import (
	"bytes"
	"log/slog"
	"testing"
)

// TestLogger verifies the structured JSON logger initializes and produces
// well-formed output. This is a compile-verified smoke test for the stub
// entrypoint; more substantive tests are added as real handlers are implemented.
func TestLogger(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))
	logger.Info("test message", "key", "value")

	if buf.Len() == 0 {
		t.Fatal("expected logger to produce output, got empty buffer")
	}

	output := buf.String()
	for _, want := range []string{`"msg"`, `"test message"`, `"key"`, `"value"`} {
		if !bytes.Contains([]byte(output), []byte(want)) {
			t.Errorf("expected log output to contain %q, got: %s", want, output)
		}
	}
}
