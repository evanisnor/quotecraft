package server

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestMountStaticFiles_ServesFile(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "widget.js"), []byte("console.log('hello')"), 0o644); err != nil {
		t.Fatalf("setup: %v", err)
	}

	s := testServer(t)
	s.MountStaticFiles(dir)

	req := httptest.NewRequest(http.MethodGet, "/static/widget.js", nil)
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	if got := rec.Body.String(); got != "console.log('hello')" {
		t.Errorf("body = %q, want %q", got, "console.log('hello')")
	}
}

func TestMountStaticFiles_NotFoundForMissingFile(t *testing.T) {
	dir := t.TempDir()

	s := testServer(t)
	s.MountStaticFiles(dir)

	req := httptest.NewRequest(http.MethodGet, "/static/nonexistent.js", nil)
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}
}

func TestMountStaticFiles_RegistersRoute(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "test.txt"), []byte("ok"), 0o644); err != nil {
		t.Fatalf("setup: %v", err)
	}

	s := testServer(t)
	s.MountStaticFiles(dir)

	req := httptest.NewRequest(http.MethodGet, "/static/test.txt", nil)
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	// A registered route must return something other than 404 (the file exists).
	if rec.Code == http.StatusNotFound {
		t.Errorf("expected route to be registered, got 404")
	}
}
