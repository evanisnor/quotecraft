package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/evanisnor/quotecraft/api/internal/config"
)

// FilesystemAdapter implements Storage using the local filesystem.
// Intended for CI and test environments where S3/MinIO is not available.
type FilesystemAdapter struct {
	baseDir string
	baseURL string
}

// NewFilesystemAdapter constructs a FilesystemAdapter from a base directory and base URL.
func NewFilesystemAdapter(baseDir string, baseURL string) *FilesystemAdapter {
	return &FilesystemAdapter{
		baseDir: baseDir,
		baseURL: baseURL,
	}
}

// NewFilesystemAdapterFromConfig creates a FilesystemAdapter using the provided config.
func NewFilesystemAdapterFromConfig(cfg config.FilesystemStorageConfig, baseURL string) *FilesystemAdapter {
	return NewFilesystemAdapter(cfg.BaseDir, baseURL)
}

// fileCreator is a function that creates a writable/closeable file.
// Extracted to allow test injection of the close error path.
type fileCreator func(name string) (io.WriteCloser, error)

// upload is the internal implementation of Upload, accepting an injectable file creator.
func (a *FilesystemAdapter) upload(_ context.Context, key string, r io.Reader, _ int64, _ string, create fileCreator) error {
	dest := filepath.Join(a.baseDir, filepath.FromSlash(key))

	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return fmt.Errorf("creating directories for %q: %w", key, err)
	}

	f, err := create(dest)
	if err != nil {
		return fmt.Errorf("creating file for %q: %w", key, err)
	}
	defer f.Close() // cleanup on error-path early returns

	if _, err := io.Copy(f, r); err != nil {
		return fmt.Errorf("writing file %q: %w", key, err)
	}

	// Explicitly close to surface any flush/sync error on the success path.
	if err := f.Close(); err != nil {
		return fmt.Errorf("closing file %q: %w", key, err)
	}

	return nil
}

// Upload writes r to baseDir/key, creating parent directories as needed.
func (a *FilesystemAdapter) Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) error {
	return a.upload(ctx, key, r, size, contentType, func(name string) (io.WriteCloser, error) {
		return os.Create(name)
	})
}

// GetURL returns the public URL for the object at key.
func (a *FilesystemAdapter) GetURL(key string) string {
	return a.baseURL + "/" + key
}

// Delete removes the file at baseDir/key.
// If the file does not exist, Delete returns nil (idempotent, matching S3 semantics).
func (a *FilesystemAdapter) Delete(_ context.Context, key string) error {
	dest := filepath.Join(a.baseDir, filepath.FromSlash(key))
	if err := os.Remove(dest); err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("deleting file %q: %w", key, err)
	}
	return nil
}

// Compile-time assertion that FilesystemAdapter satisfies the Storage interface.
var _ Storage = (*FilesystemAdapter)(nil)
