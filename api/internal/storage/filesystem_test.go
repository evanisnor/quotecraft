package storage

import (
	"bytes"
	"context"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/evanisnor/quotecraft/api/internal/config"
)

func TestFilesystemAdapter_Upload_Success(t *testing.T) {
	dir := t.TempDir()
	adapter := NewFilesystemAdapter(dir, "http://localhost:8080/static")

	r := strings.NewReader("file content")
	err := adapter.Upload(context.Background(), "images/logo.png", r, int64(r.Len()), "image/png")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	got, err := os.ReadFile(filepath.Join(dir, "images", "logo.png"))
	if err != nil {
		t.Fatalf("expected file to exist, got: %v", err)
	}
	if string(got) != "file content" {
		t.Errorf("file content = %q, want %q", got, "file content")
	}
}

func TestFilesystemAdapter_Upload_MkdirAllError(t *testing.T) {
	dir := t.TempDir()

	// Place a regular file where a directory is expected so MkdirAll fails.
	blocker := filepath.Join(dir, "images")
	if err := os.WriteFile(blocker, []byte{}, 0o644); err != nil {
		t.Fatalf("setup: %v", err)
	}

	adapter := NewFilesystemAdapter(dir, "http://localhost:8080/static")
	err := adapter.Upload(context.Background(), "images/logo.png", strings.NewReader("data"), 4, "image/png")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "creating directories") {
		t.Errorf("expected mkdir error context, got: %v", err)
	}
}

func TestFilesystemAdapter_Upload_CreateError(t *testing.T) {
	dir := t.TempDir()
	if err := os.Chmod(dir, 0o555); err != nil {
		t.Skip("cannot chmod temp dir, skipping")
	}
	defer os.Chmod(dir, 0o755) //nolint:errcheck

	adapter := NewFilesystemAdapter(dir, "http://localhost:8080/static")
	err := adapter.Upload(context.Background(), "logo.png", strings.NewReader("data"), 4, "image/png")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "creating file") {
		t.Errorf("expected create error context, got: %v", err)
	}
}

func TestFilesystemAdapter_Upload_CopyError(t *testing.T) {
	dir := t.TempDir()
	adapter := NewFilesystemAdapter(dir, "http://localhost:8080/static")

	wantErr := errors.New("read failed")
	err := adapter.Upload(context.Background(), "logo.png", &failReader{err: wantErr}, 4, "image/png")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
	if !strings.Contains(err.Error(), "writing file") {
		t.Errorf("expected write error context, got: %v", err)
	}
}

func TestFilesystemAdapter_Upload_CloseError(t *testing.T) {
	dir := t.TempDir()
	adapter := NewFilesystemAdapter(dir, "http://localhost:8080/static")

	wantErr := errors.New("close failed")
	failCreate := func(_ string) (io.WriteCloser, error) {
		return &failCloseWriter{buf: &bytes.Buffer{}, err: wantErr}, nil
	}

	err := adapter.upload(context.Background(), "logo.png", strings.NewReader("data"), 4, "image/png", failCreate)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
	if !strings.Contains(err.Error(), "closing file") {
		t.Errorf("expected close error context, got: %v", err)
	}
}

func TestFilesystemAdapter_GetURL(t *testing.T) {
	adapter := NewFilesystemAdapter("/tmp", "http://localhost:8080/static")

	got := adapter.GetURL("images/logo.png")
	want := "http://localhost:8080/static/images/logo.png"
	if got != want {
		t.Errorf("GetURL() = %q, want %q", got, want)
	}
}

func TestFilesystemAdapter_Delete_Success(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "logo.png")
	if err := os.WriteFile(path, []byte("data"), 0o644); err != nil {
		t.Fatalf("setup: %v", err)
	}

	adapter := NewFilesystemAdapter(dir, "http://localhost:8080/static")
	if err := adapter.Delete(context.Background(), "logo.png"); err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Error("expected file to be deleted")
	}
}

func TestFilesystemAdapter_Delete_NotFound(t *testing.T) {
	dir := t.TempDir()
	adapter := NewFilesystemAdapter(dir, "http://localhost:8080/static")

	// Deleting a non-existent file is idempotent — no error.
	if err := adapter.Delete(context.Background(), "nonexistent.png"); err != nil {
		t.Fatalf("expected no error for missing file, got: %v", err)
	}
}

func TestFilesystemAdapter_Delete_RemoveError(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "logo.png")
	if err := os.WriteFile(path, []byte("data"), 0o644); err != nil {
		t.Fatalf("setup: %v", err)
	}

	// Make the parent directory read-only so os.Remove fails.
	if err := os.Chmod(dir, 0o555); err != nil {
		t.Skip("cannot chmod temp dir, skipping")
	}
	defer os.Chmod(dir, 0o755) //nolint:errcheck

	adapter := NewFilesystemAdapter(dir, "http://localhost:8080/static")
	err := adapter.Delete(context.Background(), "logo.png")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "deleting file") {
		t.Errorf("expected delete error context, got: %v", err)
	}
}

func TestNewFilesystemAdapterFromConfig(t *testing.T) {
	cfg := config.FilesystemStorageConfig{BaseDir: "/tmp/uploads"}
	adapter := NewFilesystemAdapterFromConfig(cfg, "http://localhost:8080/static")

	if adapter == nil {
		t.Fatal("expected non-nil adapter")
	}
	got := adapter.GetURL("widget.js")
	want := "http://localhost:8080/static/widget.js"
	if got != want {
		t.Errorf("GetURL() = %q, want %q", got, want)
	}
}

// failReader is a test double for io.Reader that always returns an error.
type failReader struct {
	err error
}

func (r *failReader) Read(_ []byte) (int, error) {
	return 0, r.err
}

// failCloseWriter is a test double for io.WriteCloser that succeeds on Write but fails on Close.
type failCloseWriter struct {
	buf *bytes.Buffer
	err error
}

func (w *failCloseWriter) Write(p []byte) (int, error) {
	return w.buf.Write(p)
}

func (w *failCloseWriter) Close() error {
	return w.err
}
