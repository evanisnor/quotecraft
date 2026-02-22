package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoad_Success(t *testing.T) {
	content := []byte("api:\n  port: 9090\n  dashboard_origins:\n    - \"http://example.com\"\n")
	dir := t.TempDir()
	path := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(path, content, 0o600); err != nil {
		t.Fatalf("failed to write temp config file: %v", err)
	}

	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() returned unexpected error: %v", err)
	}

	if cfg.API.Port != 9090 {
		t.Errorf("expected port 9090, got %d", cfg.API.Port)
	}
	if len(cfg.API.DashboardOrigins) != 1 || cfg.API.DashboardOrigins[0] != "http://example.com" {
		t.Errorf("expected dashboard_origins [http://example.com], got %v", cfg.API.DashboardOrigins)
	}
}

func TestLoad_FileNotFound(t *testing.T) {
	_, err := Load("/nonexistent/path/config.yaml")
	if err == nil {
		t.Fatal("Load() expected error for nonexistent file, got nil")
	}
}

func TestLoad_InvalidYAML(t *testing.T) {
	content := []byte("api: [unclosed\n")
	dir := t.TempDir()
	path := filepath.Join(dir, "bad.yaml")
	if err := os.WriteFile(path, content, 0o600); err != nil {
		t.Fatalf("failed to write temp config file: %v", err)
	}

	_, err := Load(path)
	if err == nil {
		t.Fatal("Load() expected error for invalid YAML, got nil")
	}
}

func TestDefault(t *testing.T) {
	cfg := Default()
	if cfg == nil {
		t.Fatal("Default() returned nil")
	}
	if cfg.API.Port <= 0 {
		t.Errorf("Default() port should be positive, got %d", cfg.API.Port)
	}
	if len(cfg.API.DashboardOrigins) == 0 {
		t.Error("Default() should have at least one dashboard origin")
	}
}
