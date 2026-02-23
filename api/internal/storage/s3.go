package storage

import (
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/evanisnor/quotecraft/api/internal/config"
)

// s3API is the subset of the AWS S3 client API used by S3Adapter.
// Defined here to allow test doubles.
type s3API interface {
	PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
	DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
}

// S3Adapter implements Storage using an S3-compatible backend (AWS S3 or MinIO).
type S3Adapter struct {
	client  s3API
	bucket  string
	baseURL string
}

// NewS3Adapter constructs an S3Adapter from an s3API client, bucket name, and base URL.
func NewS3Adapter(client s3API, bucket string, baseURL string) *S3Adapter {
	return &S3Adapter{
		client:  client,
		bucket:  bucket,
		baseURL: baseURL,
	}
}

// configLoader is the function signature for loading AWS configuration.
// Extracted to allow test injection.
type configLoader func(ctx context.Context, optFns ...func(*awsconfig.LoadOptions) error) (aws.Config, error)

// newS3AdapterWithLoader builds an S3Adapter using the provided config loader.
func newS3AdapterWithLoader(ctx context.Context, cfg config.S3Config, baseURL string, loader configLoader) (*S3Adapter, error) {
	opts := []func(*awsconfig.LoadOptions) error{}

	if cfg.AccessKey != "" && cfg.SecretKey != "" {
		opts = append(opts, awsconfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(cfg.AccessKey, cfg.SecretKey, ""),
		))
	}

	// Use a fixed region for MinIO compatibility (MinIO doesn't care about region).
	opts = append(opts, awsconfig.WithRegion("us-east-1"))

	awsCfg, err := loader(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("loading AWS config: %w", err)
	}

	s3Opts := []func(*s3.Options){}
	if cfg.Endpoint != "" {
		s3Opts = append(s3Opts, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
		})
	}
	if cfg.UsePathStyle {
		s3Opts = append(s3Opts, func(o *s3.Options) {
			o.UsePathStyle = true
		})
	}

	client := s3.NewFromConfig(awsCfg, s3Opts...)
	return &S3Adapter{client: client, bucket: cfg.Bucket, baseURL: baseURL}, nil
}

// NewS3AdapterFromConfig creates an S3Adapter using the provided S3Config and base URL.
// If cfg.Endpoint is non-empty, a custom endpoint resolver is used (for MinIO compatibility).
// If cfg.AccessKey and cfg.SecretKey are non-empty, static credentials are used.
// If cfg.UsePathStyle is true, path-style S3 URLs are enabled (required for MinIO).
func NewS3AdapterFromConfig(ctx context.Context, cfg config.S3Config, baseURL string) (*S3Adapter, error) {
	return newS3AdapterWithLoader(ctx, cfg, baseURL, awsconfig.LoadDefaultConfig)
}

// Upload stores the content from r under the given key with the specified content type.
func (a *S3Adapter) Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) error {
	_, err := a.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(a.bucket),
		Key:           aws.String(key),
		Body:          r,
		ContentLength: aws.Int64(size),
		ContentType:   aws.String(contentType),
	})
	if err != nil {
		return fmt.Errorf("uploading object %q: %w", key, err)
	}
	return nil
}

// GetURL returns the public URL for accessing the object at the given key.
func (a *S3Adapter) GetURL(key string) string {
	return a.baseURL + "/" + key
}

// Delete removes the object identified by key.
func (a *S3Adapter) Delete(ctx context.Context, key string) error {
	_, err := a.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(a.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("deleting object %q: %w", key, err)
	}
	return nil
}
