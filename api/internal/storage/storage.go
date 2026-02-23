package storage

import (
	"context"
	"io"
)

// Storage is the interface for object storage operations.
// Implementations: S3Adapter (AWS S3 / MinIO), FilesystemAdapter (CI/tests).
type Storage interface {
	// Upload stores the content from r under the given key with the specified content type.
	Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) error

	// GetURL returns the public URL for accessing the object at the given key.
	GetURL(key string) string

	// Delete removes the object identified by key.
	Delete(ctx context.Context, key string) error
}
