package main

import (
	"context"
	"log/slog"
	"os"
	"path/filepath"
	"testing"
)

// capturingHandler is a slog.Handler that stores all log records for assertion in tests.
type capturingHandler struct {
	records []slog.Record
}

func (h *capturingHandler) Enabled(_ context.Context, _ slog.Level) bool { return true }
func (h *capturingHandler) Handle(_ context.Context, r slog.Record) error {
	h.records = append(h.records, r.Clone())
	return nil
}
func (h *capturingHandler) WithAttrs(_ []slog.Attr) slog.Handler { return h }
func (h *capturingHandler) WithGroup(_ string) slog.Handler      { return h }

// TestConfigCandidates_NoCONFIG_PATH verifies that when CONFIG_PATH is unset,
// only the default relative path is returned.
func TestConfigCandidates_NoCONFIG_PATH(t *testing.T) {
	if err := os.Unsetenv("CONFIG_PATH"); err != nil {
		t.Fatalf("failed to unset CONFIG_PATH: %v", err)
	}

	candidates := configCandidates()
	if len(candidates) != 1 {
		t.Fatalf("expected 1 candidate, got %d: %v", len(candidates), candidates)
	}
	if candidates[0] != "../config.yaml" {
		t.Errorf("expected ../config.yaml, got %q", candidates[0])
	}
}

// TestConfigCandidates_WithCONFIG_PATH verifies that when CONFIG_PATH is set,
// it appears first in the candidate list.
func TestConfigCandidates_WithCONFIG_PATH(t *testing.T) {
	if err := os.Setenv("CONFIG_PATH", "/custom/config.yaml"); err != nil {
		t.Fatalf("failed to set CONFIG_PATH: %v", err)
	}
	t.Cleanup(func() {
		if err := os.Unsetenv("CONFIG_PATH"); err != nil {
			t.Errorf("failed to unset CONFIG_PATH in cleanup: %v", err)
		}
	})

	candidates := configCandidates()
	if len(candidates) != 2 {
		t.Fatalf("expected 2 candidates, got %d: %v", len(candidates), candidates)
	}
	if candidates[0] != "/custom/config.yaml" {
		t.Errorf("expected CONFIG_PATH first, got %q", candidates[0])
	}
}

// TestLoadConfig_FallsBackToDefault verifies that loadConfig returns the
// built-in defaults when no config file is found, and that missing files do
// not produce a "failed to load config" warning — only the final
// "no config file found" warning is expected.
func TestLoadConfig_FallsBackToDefault(t *testing.T) {
	// Point CONFIG_PATH at a guaranteed nonexistent file.
	if err := os.Setenv("CONFIG_PATH", "/nonexistent/config.yaml"); err != nil {
		t.Fatalf("failed to set CONFIG_PATH: %v", err)
	}
	t.Cleanup(func() {
		if err := os.Unsetenv("CONFIG_PATH"); err != nil {
			t.Errorf("failed to unset CONFIG_PATH in cleanup: %v", err)
		}
	})

	h := &capturingHandler{}
	cfg := loadConfig(slog.New(h))
	if cfg == nil {
		t.Fatal("loadConfig() returned nil")
	}
	if cfg.API.Port <= 0 {
		t.Errorf("expected positive port from defaults, got %d", cfg.API.Port)
	}

	// No "failed to load config" warning should be emitted for missing files.
	for _, r := range h.records {
		if r.Level == slog.LevelWarn && r.Message == "failed to load config" {
			t.Errorf("unexpected warning for missing config file: %q", r.Message)
		}
	}
}

// TestLoadConfig_LoadsValidFile verifies that loadConfig successfully returns
// config when CONFIG_PATH points at a valid YAML file.
func TestLoadConfig_LoadsValidFile(t *testing.T) {
	dir := t.TempDir()
	validPath := filepath.Join(dir, "config.yaml")
	content := []byte("api:\n  port: 9999\n  dashboard_origins:\n    - \"http://test.example.com\"\n")
	if err := os.WriteFile(validPath, content, 0o600); err != nil {
		t.Fatalf("failed to write config file: %v", err)
	}

	if err := os.Setenv("CONFIG_PATH", validPath); err != nil {
		t.Fatalf("failed to set CONFIG_PATH: %v", err)
	}
	t.Cleanup(func() {
		if err := os.Unsetenv("CONFIG_PATH"); err != nil {
			t.Errorf("failed to unset CONFIG_PATH in cleanup: %v", err)
		}
	})

	h := &capturingHandler{}
	cfg := loadConfig(slog.New(h))
	if cfg == nil {
		t.Fatal("loadConfig() returned nil for valid config file")
	}
	if cfg.API.Port != 9999 {
		t.Errorf("expected port 9999, got %d", cfg.API.Port)
	}
}

// TestLoadConfig_LogsWarningForInvalidYAML verifies that loadConfig logs a
// warning (rather than panicking) when a config file exists but contains
// invalid YAML.
func TestLoadConfig_LogsWarningForInvalidYAML(t *testing.T) {
	dir := t.TempDir()
	badPath := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(badPath, []byte("api: [unclosed\n"), 0o600); err != nil {
		t.Fatalf("failed to write bad config file: %v", err)
	}

	if err := os.Setenv("CONFIG_PATH", badPath); err != nil {
		t.Fatalf("failed to set CONFIG_PATH: %v", err)
	}
	t.Cleanup(func() {
		if err := os.Unsetenv("CONFIG_PATH"); err != nil {
			t.Errorf("failed to unset CONFIG_PATH in cleanup: %v", err)
		}
	})

	h := &capturingHandler{}
	cfg := loadConfig(slog.New(h))
	// Should fall back to defaults after the invalid YAML warning.
	if cfg == nil {
		t.Fatal("loadConfig() returned nil after invalid YAML")
	}
	if cfg.API.Port <= 0 {
		t.Errorf("expected positive port from defaults, got %d", cfg.API.Port)
	}

	// Verify the "failed to load config" warning was emitted for the invalid file.
	warned := false
	for _, r := range h.records {
		if r.Level == slog.LevelWarn && r.Message == "failed to load config" {
			warned = true
		}
	}
	if !warned {
		t.Error("expected a 'failed to load config' warning for invalid YAML, got none")
	}
}
