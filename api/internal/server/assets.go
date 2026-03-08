package server

import (
	"bytes"
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"net/http"
)

// AssetStorage is the minimal object storage interface consumed by the assets handler.
// Defined here at the consumer (server package) per the interfaces-where-consumed convention.
type AssetStorage interface {
	// Upload stores the content from r under the given key with the specified content type.
	Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) error

	// GetURL returns the public URL for the object at the given key.
	GetURL(key string) string
}

// allowedImageTypes maps detected content types to their canonical file extensions.
// Only these four image types are accepted by the upload handler.
var allowedImageTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

// maxUploadSize is the maximum accepted file size in bytes (5 MB).
const maxUploadSize = 5 * 1024 * 1024

// uploadImageResponse is the data payload returned on successful image upload.
type uploadImageResponse struct {
	URL string `json:"url"`
}

// uploadImageHandler returns an http.HandlerFunc that handles POST /v1/assets.
// It accepts a multipart form upload with field name "file", detects the content
// type from the file's magic bytes (not the client-supplied header), enforces a
// 5 MB limit, and stores a content-addressed key derived from SHA-256 of the data.
func uploadImageHandler(store AssetStorage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, "missing authentication")
			return
		}
		_ = userID // userID establishes ownership; stored as part of auth context, not the key

		// Limit the entire request body to maxUploadSize + a small buffer for form overhead
		// to prevent OOM from very large multipart headers before we even read the file.
		r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize+4096)

		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, "invalid multipart form")
			return
		}

		file, _, err := r.FormFile("file")
		if err != nil {
			WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, "missing file field")
			return
		}
		defer file.Close()

		// Read at most maxUploadSize+1 bytes. If we read more than maxUploadSize bytes
		// the file exceeds the limit and we reject it.
		limitedReader := io.LimitReader(file, maxUploadSize+1)
		data, err := io.ReadAll(limitedReader)
		if err != nil {
			LoggerFrom(r.Context()).Error("reading uploaded file", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}

		if int64(len(data)) > maxUploadSize {
			WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, "file exceeds 5 MB limit")
			return
		}

		// Detect the actual content type from the file's magic bytes.
		// http.DetectContentType inspects the first 512 bytes.
		detected := http.DetectContentType(data)

		ext, allowed := allowedImageTypes[detected]
		if !allowed {
			WriteError(w, http.StatusBadRequest, ErrCodeBadRequest, "unsupported image type")
			return
		}

		// Content-addressed key: hex(sha256(data)) + extension.
		sum := sha256.Sum256(data)
		key := fmt.Sprintf("%x%s", sum, ext)

		if err := store.Upload(r.Context(), key, bytes.NewReader(data), int64(len(data)), detected); err != nil {
			LoggerFrom(r.Context()).Error("uploading image to storage", "error", err)
			WriteError(w, http.StatusInternalServerError, ErrCodeInternal, "internal error")
			return
		}

		url := store.GetURL(key)
		WriteJSON(w, http.StatusCreated, uploadImageResponse{URL: url})
	}
}

// MountAssets registers the asset upload route on the server's authenticated private group.
func (s *Server) MountAssets(validator TokenValidator, store AssetStorage) {
	protected := s.Authenticated(validator)
	protected.Post("/assets", uploadImageHandler(store))
}
