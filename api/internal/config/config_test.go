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
	if cfg.Storage.Provider == "" {
		t.Error("Default() storage provider should be non-empty")
	}
	if cfg.Storage.S3.Endpoint == "" {
		t.Error("Default() S3 endpoint should be non-empty")
	}
	if cfg.Storage.S3.Bucket == "" {
		t.Error("Default() S3 bucket should be non-empty")
	}
	if cfg.Storage.Filesystem.BaseDir == "" {
		t.Error("Default() filesystem base dir should be non-empty")
	}
	if cfg.CDN.BaseURL == "" {
		t.Error("Default() CDN base URL should be non-empty")
	}
	if cfg.CDN.WidgetDir == "" {
		t.Error("Default() CDN widget dir should be non-empty")
	}
	if !cfg.Storage.S3.UsePathStyle {
		t.Error("Default() S3 UsePathStyle should be true")
	}
	if !cfg.CDN.ServeLocal {
		t.Error("Default() CDN ServeLocal should be true")
	}
}

func TestLoad_StorageAndCDNFields(t *testing.T) {
	content := []byte(`
api:
  port: 8080
  dashboard_origins:
    - "http://localhost:3000"
storage:
  provider: filesystem
  s3:
    endpoint: "http://localhost:9000"
    bucket: "test-bucket"
    access_key: "testkey"
    secret_key: "testsecret"
    use_path_style: true
  filesystem:
    base_dir: "/tmp/uploads"
cdn:
  base_url: "http://localhost:8080/static"
  widget_dir: "/tmp/widget/dist"
  serve_local: true
`)
	dir := t.TempDir()
	path := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(path, content, 0o600); err != nil {
		t.Fatalf("failed to write temp config file: %v", err)
	}

	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() returned unexpected error: %v", err)
	}

	if cfg.Storage.Provider != "filesystem" {
		t.Errorf("expected storage provider %q, got %q", "filesystem", cfg.Storage.Provider)
	}
	if cfg.Storage.S3.Endpoint != "http://localhost:9000" {
		t.Errorf("expected S3 endpoint %q, got %q", "http://localhost:9000", cfg.Storage.S3.Endpoint)
	}
	if cfg.Storage.S3.Bucket != "test-bucket" {
		t.Errorf("expected S3 bucket %q, got %q", "test-bucket", cfg.Storage.S3.Bucket)
	}
	if cfg.Storage.S3.AccessKey != "testkey" {
		t.Errorf("expected S3 access key %q, got %q", "testkey", cfg.Storage.S3.AccessKey)
	}
	if cfg.Storage.S3.SecretKey != "testsecret" {
		t.Errorf("expected S3 secret key %q, got %q", "testsecret", cfg.Storage.S3.SecretKey)
	}
	if !cfg.Storage.S3.UsePathStyle {
		t.Error("expected S3 use_path_style true")
	}
	if cfg.Storage.Filesystem.BaseDir != "/tmp/uploads" {
		t.Errorf("expected filesystem base dir %q, got %q", "/tmp/uploads", cfg.Storage.Filesystem.BaseDir)
	}
	if cfg.CDN.BaseURL != "http://localhost:8080/static" {
		t.Errorf("expected CDN base URL %q, got %q", "http://localhost:8080/static", cfg.CDN.BaseURL)
	}
	if cfg.CDN.WidgetDir != "/tmp/widget/dist" {
		t.Errorf("expected CDN widget dir %q, got %q", "/tmp/widget/dist", cfg.CDN.WidgetDir)
	}
	if !cfg.CDN.ServeLocal {
		t.Error("expected CDN serve_local true")
	}
}
