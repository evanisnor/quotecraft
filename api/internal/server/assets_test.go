package server

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/evanisnor/quotecraft/api/internal/storage"
)

// jpegMagicBytes returns a minimal byte slice whose first bytes are the JPEG SOI marker.
// http.DetectContentType uses the first 512 bytes for detection; the JPEG magic bytes
// are FF D8 FF followed by a marker byte.
func jpegMagicBytes() []byte {
	data := make([]byte, 512)
	data[0] = 0xFF
	data[1] = 0xD8
	data[2] = 0xFF
	data[3] = 0xE0
	return data
}

// pngMagicBytes returns a minimal byte slice that passes PNG detection.
// PNG signature: 89 50 4E 47 0D 0A 1A 0A
func pngMagicBytes() []byte {
	data := make([]byte, 512)
	data[0] = 0x89
	data[1] = 0x50
	data[2] = 0x4E
	data[3] = 0x47
	data[4] = 0x0D
	data[5] = 0x0A
	data[6] = 0x1A
	data[7] = 0x0A
	return data
}

// gifMagicBytes returns a minimal byte slice that passes GIF detection.
// GIF signature: "GIF87a" or "GIF89a"
func gifMagicBytes() []byte {
	data := make([]byte, 512)
	copy(data, []byte("GIF89a"))
	return data
}

// buildMultipartRequest constructs an http.Request with a multipart/form-data body
// containing a single "file" field with the given content. The returned request
// has the correct Content-Type header set.
func buildMultipartRequest(t *testing.T, fieldName string, filename string, content []byte) *http.Request {
	t.Helper()
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile(fieldName, filename)
	if err != nil {
		t.Fatalf("creating form file: %v", err)
	}
	if _, err := fw.Write(content); err != nil {
		t.Fatalf("writing form file content: %v", err)
	}
	if err := mw.Close(); err != nil {
		t.Fatalf("closing multipart writer: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/v1/assets", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	return req
}

// withUserID returns a copy of req with the authenticated user ID injected into context,
// simulating the effect of the RequireAuth middleware.
func withUserID(req *http.Request, userID string) *http.Request {
	ctx := context.WithValue(req.Context(), authUserKey{}, userID)
	return req.WithContext(ctx)
}

func TestUploadImageHandler_Success_JPEG(t *testing.T) {
	stub := storage.NewStubStorage()
	stub.GetURLFunc = func(key string) string {
		return "http://cdn.example.com/" + key
	}
	h := uploadImageHandler(stub)

	req := buildMultipartRequest(t, "file", "photo.jpg", jpegMagicBytes())
	req = withUserID(req, "user-xyz")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d (body: %s)", rec.Code, rec.Body.String())
	}

	var env Envelope[uploadImageResponse]
	if err := decodeEnvelope(rec, &env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error != nil {
		t.Errorf("expected no error in response, got: %+v", env.Error)
	}
	if !strings.HasPrefix(env.Data.URL, "http://cdn.example.com/") {
		t.Errorf("expected URL to start with cdn prefix, got %q", env.Data.URL)
	}
	if !strings.HasSuffix(env.Data.URL, ".jpg") {
		t.Errorf("expected URL to end with .jpg, got %q", env.Data.URL)
	}
	if stub.LastUploadContentType != "image/jpeg" {
		t.Errorf("expected upload content type %q, got %q", "image/jpeg", stub.LastUploadContentType)
	}
	if stub.LastUploadKey == "" {
		t.Error("expected upload key to be set")
	}
}

func TestUploadImageHandler_Success_PNG(t *testing.T) {
	stub := storage.NewStubStorage()
	h := uploadImageHandler(stub)

	req := buildMultipartRequest(t, "file", "image.png", pngMagicBytes())
	req = withUserID(req, "user-xyz")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	if stub.LastUploadContentType != "image/png" {
		t.Errorf("expected upload content type %q, got %q", "image/png", stub.LastUploadContentType)
	}
	if !strings.HasSuffix(stub.LastUploadKey, ".png") {
		t.Errorf("expected upload key to end with .png, got %q", stub.LastUploadKey)
	}
}

// webpMagicBytes returns a minimal byte slice that passes WebP detection.
// WebP signature: "RIFF" + 4-byte size + "WEBP" + VP8 chunk type.
func webpMagicBytes() []byte {
	return []byte{
		0x52, 0x49, 0x46, 0x46, // RIFF
		0x00, 0x00, 0x00, 0x00, // file size (placeholder)
		0x57, 0x45, 0x42, 0x50, // WEBP
		0x56, 0x50, 0x38, 0x20, // VP8 (lossy)
	}
}

func TestUploadImageHandler_Success_WebP(t *testing.T) {
	stub := storage.NewStubStorage()
	h := uploadImageHandler(stub)

	req := buildMultipartRequest(t, "file", "photo.webp", webpMagicBytes())
	req = withUserID(req, "user-xyz")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d (body: %s)", rec.Code, rec.Body.String())
	}

	var env Envelope[uploadImageResponse]
	if err := decodeEnvelope(rec, &env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error != nil {
		t.Errorf("expected no error in response, got: %+v", env.Error)
	}
	if !strings.HasPrefix(env.Data.URL, "http://stub/") {
		t.Errorf("expected URL to start with stub prefix, got %q", env.Data.URL)
	}
	if !strings.HasSuffix(env.Data.URL, ".webp") {
		t.Errorf("expected URL to end with .webp, got %q", env.Data.URL)
	}
	if stub.LastUploadContentType != "image/webp" {
		t.Errorf("expected upload content type %q, got %q", "image/webp", stub.LastUploadContentType)
	}
	if !strings.HasSuffix(stub.LastUploadKey, ".webp") {
		t.Errorf("expected upload key to end with .webp, got %q", stub.LastUploadKey)
	}
}

func TestUploadImageHandler_Success_GIF(t *testing.T) {
	stub := storage.NewStubStorage()
	h := uploadImageHandler(stub)

	req := buildMultipartRequest(t, "file", "anim.gif", gifMagicBytes())
	req = withUserID(req, "user-xyz")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	if stub.LastUploadContentType != "image/gif" {
		t.Errorf("expected upload content type %q, got %q", "image/gif", stub.LastUploadContentType)
	}
	if !strings.HasSuffix(stub.LastUploadKey, ".gif") {
		t.Errorf("expected upload key to end with .gif, got %q", stub.LastUploadKey)
	}
}

func TestUploadImageHandler_ContentAddressedKey(t *testing.T) {
	// Two uploads of identical content must produce the same key.
	stub := storage.NewStubStorage()
	h := uploadImageHandler(stub)

	data := jpegMagicBytes()

	req1 := buildMultipartRequest(t, "file", "a.jpg", data)
	req1 = withUserID(req1, "user-xyz")
	rec1 := httptest.NewRecorder()
	h.ServeHTTP(rec1, req1)

	if rec1.Code != http.StatusCreated {
		t.Fatalf("first upload expected 201, got %d", rec1.Code)
	}
	key1 := stub.LastUploadKey

	req2 := buildMultipartRequest(t, "file", "b.jpg", data)
	req2 = withUserID(req2, "user-xyz")
	rec2 := httptest.NewRecorder()
	h.ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusCreated {
		t.Fatalf("second upload expected 201, got %d", rec2.Code)
	}
	key2 := stub.LastUploadKey

	if key1 != key2 {
		t.Errorf("expected identical content to produce identical keys: key1=%q key2=%q", key1, key2)
	}
}

func TestUploadImageHandler_Unauthorized_NoUserID(t *testing.T) {
	stub := storage.NewStubStorage()
	h := uploadImageHandler(stub)

	req := buildMultipartRequest(t, "file", "photo.jpg", jpegMagicBytes())
	// No user ID in context — no withUserID call.
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
	var env Envelope[any]
	if err := decodeEnvelope(rec, &env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeUnauthorized {
		t.Errorf("expected error code %q, got %q", ErrCodeUnauthorized, env.Error.Code)
	}
}

func TestUploadImageHandler_UnsupportedContentType(t *testing.T) {
	stub := storage.NewStubStorage()
	h := uploadImageHandler(stub)

	// Plain text content — http.DetectContentType will return text/plain.
	req := buildMultipartRequest(t, "file", "file.txt", []byte("hello world, this is just text"))
	req = withUserID(req, "user-xyz")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	var env Envelope[any]
	if err := decodeEnvelope(rec, &env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeBadRequest {
		t.Errorf("expected error code %q, got %q", ErrCodeBadRequest, env.Error.Code)
	}
	if env.Error.Message != "unsupported image type" {
		t.Errorf("expected message %q, got %q", "unsupported image type", env.Error.Message)
	}
}

func TestUploadImageHandler_FileTooLarge(t *testing.T) {
	stub := storage.NewStubStorage()
	h := uploadImageHandler(stub)

	// Create a payload that is maxUploadSize+1 bytes but starts with valid JPEG magic bytes.
	data := make([]byte, maxUploadSize+1)
	// Embed JPEG magic bytes so that if content type detection were reached, it would pass.
	data[0] = 0xFF
	data[1] = 0xD8
	data[2] = 0xFF
	data[3] = 0xE0

	req := buildMultipartRequest(t, "file", "huge.jpg", data)
	req = withUserID(req, "user-xyz")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	var env Envelope[any]
	if err := decodeEnvelope(rec, &env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeBadRequest {
		t.Errorf("expected error code %q, got %q", ErrCodeBadRequest, env.Error.Code)
	}
	if env.Error.Message != "file exceeds 5 MB limit" {
		t.Errorf("expected message %q, got %q", "file exceeds 5 MB limit", env.Error.Message)
	}
}

func TestUploadImageHandler_BadMultipart(t *testing.T) {
	stub := storage.NewStubStorage()
	h := uploadImageHandler(stub)

	// Send a request with Content-Type claiming multipart but a malformed body.
	req := httptest.NewRequest(http.MethodPost, "/v1/assets", strings.NewReader("this is not multipart"))
	req.Header.Set("Content-Type", "multipart/form-data; boundary=XBOUNDARY")
	req = withUserID(req, "user-xyz")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	var env Envelope[any]
	if err := decodeEnvelope(rec, &env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeBadRequest {
		t.Errorf("expected error code %q, got %q", ErrCodeBadRequest, env.Error.Code)
	}
}

func TestUploadImageHandler_MissingFileField(t *testing.T) {
	stub := storage.NewStubStorage()
	h := uploadImageHandler(stub)

	// Build a valid multipart request but with a different field name (not "file").
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, err := mw.CreateFormFile("image", "photo.jpg")
	if err != nil {
		t.Fatalf("creating form file: %v", err)
	}
	if _, err := fw.Write(jpegMagicBytes()); err != nil {
		t.Fatalf("writing content: %v", err)
	}
	if err := mw.Close(); err != nil {
		t.Fatalf("closing writer: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/v1/assets", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req = withUserID(req, "user-xyz")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	var env Envelope[any]
	if err := decodeEnvelope(rec, &env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeBadRequest {
		t.Errorf("expected error code %q, got %q", ErrCodeBadRequest, env.Error.Code)
	}
}

func TestUploadImageHandler_StorageError(t *testing.T) {
	stub := storage.NewStubStorage()
	stub.UploadFunc = func(_ context.Context, _ string, _ io.Reader, _ int64, _ string) error {
		return errors.New("storage backend unavailable")
	}
	h := uploadImageHandler(stub)

	req := buildMultipartRequest(t, "file", "photo.jpg", jpegMagicBytes())
	req = withUserID(req, "user-xyz")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d (body: %s)", rec.Code, rec.Body.String())
	}
	var env Envelope[any]
	if err := decodeEnvelope(rec, &env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if env.Error == nil {
		t.Fatal("expected error in response, got nil")
	}
	if env.Error.Code != ErrCodeInternal {
		t.Errorf("expected error code %q, got %q", ErrCodeInternal, env.Error.Code)
	}
}

func TestMountAssets_RegistersRoute(t *testing.T) {
	s := testServer(t)
	authSvc := &stubAuthService{userID: "user-xyz"}
	s.MountAuth(authSvc)

	stub := storage.NewStubStorage()
	s.MountAssets(authSvc, stub)

	req := buildMultipartRequest(t, "file", "photo.jpg", jpegMagicBytes())
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201 from mounted assets route, got %d (body: %s)", rec.Code, rec.Body.String())
	}
}

func TestMountAssets_RequiresAuth(t *testing.T) {
	s := testServer(t)
	authSvc := &stubAuthService{userID: "user-xyz"}
	s.MountAuth(authSvc)

	stub := storage.NewStubStorage()
	s.MountAssets(authSvc, stub)

	req := buildMultipartRequest(t, "file", "photo.jpg", jpegMagicBytes())
	// No Authorization header.
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 without auth, got %d", rec.Code)
	}
}

// decodeEnvelope is a helper that JSON-decodes a recorder body into the given value.
func decodeEnvelope[T any](rec *httptest.ResponseRecorder, v *Envelope[T]) error {
	if err := json.NewDecoder(rec.Body).Decode(v); err != nil {
		return fmt.Errorf("decoding envelope: %w", err)
	}
	return nil
}
