package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// Config holds all application configuration loaded from config.yaml.
type Config struct {
	API APIConfig `yaml:"api"`
}

// APIConfig holds configuration for the HTTP API server.
type APIConfig struct {
	// Port is the TCP port the server listens on.
	Port int `yaml:"port"`

	// DashboardOrigins lists the allowed CORS origins for authenticated
	// (dashboard) endpoints. Public endpoints use a wildcard origin.
	DashboardOrigins []string `yaml:"dashboard_origins"`
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
		},
	}
}
