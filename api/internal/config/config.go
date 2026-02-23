package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// Config holds all application configuration loaded from config.yaml.
type Config struct {
	API     APIConfig     `yaml:"api"`
	Storage StorageConfig `yaml:"storage"`
	CDN     CDNConfig     `yaml:"cdn"`
}

// APIConfig holds configuration for the HTTP API server.
type APIConfig struct {
	// Port is the TCP port the server listens on.
	Port int `yaml:"port"`

	// DashboardOrigins lists the allowed CORS origins for authenticated
	// (dashboard) endpoints. Public endpoints use a wildcard origin.
	DashboardOrigins []string `yaml:"dashboard_origins"`

	// DatabaseURL is the PostgreSQL connection string used by the API server.
	DatabaseURL string `yaml:"database_url"`
}

// StorageConfig holds configuration for the object storage backend.
type StorageConfig struct {
	// Provider selects the storage backend. Valid values: "s3" (for AWS S3 and MinIO),
	// "filesystem" (for CI and test environments).
	Provider string `yaml:"provider"`

	// S3 holds configuration for the S3-compatible storage adapter.
	S3 S3Config `yaml:"s3"`

	// Filesystem holds configuration for the filesystem storage adapter.
	Filesystem FilesystemStorageConfig `yaml:"filesystem"`
}

// S3Config holds configuration for the S3-compatible storage adapter.
type S3Config struct {
	// Endpoint is the S3 API endpoint URL. Leave empty for AWS S3 defaults;
	// set to the MinIO endpoint URL (e.g., "http://localhost:9000") for local development.
	Endpoint string `yaml:"endpoint"`

	// Bucket is the S3 bucket name.
	Bucket string `yaml:"bucket"`

	// AccessKey is the S3 access key ID.
	AccessKey string `yaml:"access_key"`

	// SecretKey is the S3 secret access key.
	SecretKey string `yaml:"secret_key"`

	// UsePathStyle enables path-style S3 URLs, which is required for MinIO.
	UsePathStyle bool `yaml:"use_path_style"`
}

// FilesystemStorageConfig holds configuration for the filesystem storage adapter.
type FilesystemStorageConfig struct {
	// BaseDir is the local directory where uploaded files are stored.
	BaseDir string `yaml:"base_dir"`
}

// CDNConfig holds configuration for static asset delivery and dev-mode serving.
type CDNConfig struct {
	// BaseURL is the base URL for serving static assets and uploaded content.
	// In production this is the CDN URL (e.g., "https://cdn.quotecraft.io").
	// In local development it defaults to "http://localhost:8080/static".
	BaseURL string `yaml:"base_url"`

	// WidgetDir is the local path to the built widget bundle directory.
	// Used by the dev-mode /static/* handler to serve the widget.
	WidgetDir string `yaml:"widget_dir"`

	// ServeLocal enables the /static/* route on the API server for local development.
	// Set to false in production where all static assets are served by the CDN.
	ServeLocal bool `yaml:"serve_local"`
}

// Load reads and parses the YAML configuration file at the given path.
// It returns a wrapped error if the file cannot be read or is not valid YAML.
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading config file %q: %w", path, err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parsing config file %q: %w", path, err)
	}

	return &cfg, nil
}

// Default returns a Config with sensible local development defaults.
// It is used when no config file is found.
func Default() *Config {
	return &Config{
		API: APIConfig{
			Port:             8080,
			DashboardOrigins: []string{"http://localhost:3000"},
			DatabaseURL:      "postgres://quotecraft:quotecraft@localhost:5432/quotecraft?sslmode=disable",
		},
		Storage: StorageConfig{
			Provider: "s3",
			S3: S3Config{
				Endpoint:     "http://localhost:9000",
				Bucket:       "quotecraft-assets",
				AccessKey:    "minioadmin",
				SecretKey:    "minioadmin",
				UsePathStyle: true,
			},
			Filesystem: FilesystemStorageConfig{
				BaseDir: "./uploads",
			},
		},
		CDN: CDNConfig{
			BaseURL:    "http://localhost:8080/static",
			WidgetDir:  "../widget/dist",
			ServeLocal: true,
		},
	}
}
