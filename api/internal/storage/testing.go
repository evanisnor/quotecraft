package storage

import (
	"context"
	"io"
)

// StubStorage is a reusable test implementation of Storage.
// Use it for tests that don't care about storage details.
type StubStorage struct {
	UploadFunc func(ctx context.Context, key string, r io.Reader, size int64, contentType string) error
	GetURLFunc func(key string) string
	DeleteFunc func(ctx context.Context, key string) error

	// Captured calls for verification.
	LastUploadKey         string
	LastUploadContentType string
	LastDeleteKey         string
}

// NewStubStorage returns a StubStorage with default no-op implementations.
func NewStubStorage() *StubStorage {
	return &StubStorage{
		UploadFunc: func(_ context.Context, _ string, _ io.Reader, _ int64, _ string) error {
			return nil
		},
		GetURLFunc: func(key string) string {
			return "http://stub/" + key
		},
		DeleteFunc: func(_ context.Context, _ string) error {
			return nil
		},
	}
}

func (s *StubStorage) Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) error {
	s.LastUploadKey = key
	s.LastUploadContentType = contentType
	return s.UploadFunc(ctx, key, r, size, contentType)
}

func (s *StubStorage) GetURL(key string) string {
	return s.GetURLFunc(key)
}

func (s *StubStorage) Delete(ctx context.Context, key string) error {
	s.LastDeleteKey = key
	return s.DeleteFunc(ctx, key)
}

// Compile-time assertion that StubStorage satisfies the Storage interface.
var _ Storage = (*StubStorage)(nil)
