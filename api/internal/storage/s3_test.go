package storage

import (
	"context"
	"errors"
	"io"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/evanisnor/quotecraft/api/internal/config"
)

// stubS3API is a test double for s3API.
type stubS3API struct {
	putErr    error
	deleteErr error
}

func (s *stubS3API) PutObject(_ context.Context, _ *s3.PutObjectInput, _ ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	return &s3.PutObjectOutput{}, s.putErr
}

func (s *stubS3API) DeleteObject(_ context.Context, _ *s3.DeleteObjectInput, _ ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
	return &s3.DeleteObjectOutput{}, s.deleteErr
}

func TestS3Adapter_Upload_Success(t *testing.T) {
	stub := &stubS3API{}
	adapter := NewS3Adapter(stub, "test-bucket", "http://localhost:9000/test-bucket")

	r := strings.NewReader("file content")
	err := adapter.Upload(context.Background(), "images/logo.png", r, int64(r.Len()), "image/png")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestS3Adapter_Upload_Error(t *testing.T) {
	stub := &stubS3API{putErr: errors.New("connection refused")}
	adapter := NewS3Adapter(stub, "test-bucket", "http://localhost:9000/test-bucket")

	r := strings.NewReader("file content")
	err := adapter.Upload(context.Background(), "images/logo.png", r, int64(r.Len()), "image/png")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, stub.putErr) {
		t.Errorf("expected wrapped putErr, got: %v", err)
	}
	if !strings.Contains(err.Error(), `uploading object "images/logo.png"`) {
		t.Errorf("expected error to contain key context, got: %v", err)
	}
}

func TestS3Adapter_GetURL(t *testing.T) {
	adapter := NewS3Adapter(&stubS3API{}, "test-bucket", "http://localhost:9000/test-bucket")

	got := adapter.GetURL("images/logo.png")
	want := "http://localhost:9000/test-bucket/images/logo.png"
	if got != want {
		t.Errorf("GetURL() = %q, want %q", got, want)
	}
}

func TestS3Adapter_Delete_Success(t *testing.T) {
	stub := &stubS3API{}
	adapter := NewS3Adapter(stub, "test-bucket", "http://localhost:9000/test-bucket")

	err := adapter.Delete(context.Background(), "images/logo.png")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
}

func TestS3Adapter_Delete_Error(t *testing.T) {
	stub := &stubS3API{deleteErr: errors.New("bucket not found")}
	adapter := NewS3Adapter(stub, "test-bucket", "http://localhost:9000/test-bucket")

	err := adapter.Delete(context.Background(), "images/logo.png")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, stub.deleteErr) {
		t.Errorf("expected wrapped deleteErr, got: %v", err)
	}
	if !strings.Contains(err.Error(), `deleting object "images/logo.png"`) {
		t.Errorf("expected error to contain key context, got: %v", err)
	}
}

func TestNewS3AdapterFromConfig_Success(t *testing.T) {
	cfg := config.S3Config{
		Endpoint:     "http://localhost:9000",
		Bucket:       "test",
		AccessKey:    "minioadmin",
		SecretKey:    "minioadmin",
		UsePathStyle: true,
	}

	adapter, err := NewS3AdapterFromConfig(context.Background(), cfg, "http://localhost:9000/test")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if adapter == nil {
		t.Fatal("expected non-nil adapter, got nil")
	}

	// Verify the adapter is usable by checking GetURL behaviour.
	got := adapter.GetURL("some/key")
	want := "http://localhost:9000/test/some/key"
	if got != want {
		t.Errorf("GetURL() = %q, want %q", got, want)
	}
}

func TestNewS3AdapterFromConfig_LoadError(t *testing.T) {
	wantErr := errors.New("config load failed")
	failLoader := func(_ context.Context, _ ...func(*awsconfig.LoadOptions) error) (aws.Config, error) {
		return aws.Config{}, wantErr
	}

	adapter, err := newS3AdapterWithLoader(context.Background(), config.S3Config{}, "", failLoader)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wrapped wantErr, got: %v", err)
	}
	if adapter != nil {
		t.Error("expected nil adapter on error")
	}
}

func TestStubStorage_Upload(t *testing.T) {
	stub := NewStubStorage()
	r := strings.NewReader("data")

	err := stub.Upload(context.Background(), "key/file.png", r, int64(r.Len()), "image/png")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if stub.LastUploadKey != "key/file.png" {
		t.Errorf("LastUploadKey = %q, want %q", stub.LastUploadKey, "key/file.png")
	}
	if stub.LastUploadContentType != "image/png" {
		t.Errorf("LastUploadContentType = %q, want %q", stub.LastUploadContentType, "image/png")
	}
}

func TestStubStorage_Upload_Error(t *testing.T) {
	stub := NewStubStorage()
	wantErr := errors.New("upload failed")
	stub.UploadFunc = func(_ context.Context, _ string, _ io.Reader, _ int64, _ string) error {
		return wantErr
	}

	err := stub.Upload(context.Background(), "key/file.png", strings.NewReader("data"), 4, "image/png")
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wantErr, got: %v", err)
	}
}

func TestStubStorage_GetURL(t *testing.T) {
	stub := NewStubStorage()

	got := stub.GetURL("key/file.png")
	want := "http://stub/key/file.png"
	if got != want {
		t.Errorf("GetURL() = %q, want %q", got, want)
	}
}

func TestStubStorage_Delete(t *testing.T) {
	stub := NewStubStorage()

	err := stub.Delete(context.Background(), "key/file.png")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if stub.LastDeleteKey != "key/file.png" {
		t.Errorf("LastDeleteKey = %q, want %q", stub.LastDeleteKey, "key/file.png")
	}
}

func TestStubStorage_Delete_Error(t *testing.T) {
	stub := NewStubStorage()
	wantErr := errors.New("delete failed")
	stub.DeleteFunc = func(_ context.Context, _ string) error {
		return wantErr
	}

	err := stub.Delete(context.Background(), "key/file.png")
	if !errors.Is(err, wantErr) {
		t.Errorf("expected wantErr, got: %v", err)
	}
}

// Compile-time assertion that S3Adapter satisfies the Storage interface.
var _ Storage = (*S3Adapter)(nil)

// Compile-time assertion that stubS3API satisfies the s3API interface.
var _ s3API = (*stubS3API)(nil)
