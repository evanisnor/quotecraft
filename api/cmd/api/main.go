package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/evanisnor/quotecraft/api/internal/config"
	"github.com/evanisnor/quotecraft/api/internal/server"
)

// noopPinger is a placeholder Pinger that always reports healthy. It is used
// until the real database connection is wired up in INFR-US4.
type noopPinger struct{}

func (noopPinger) Ping(_ context.Context) error { return nil }

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("service", "api")

	cfg := loadConfig(logger)

	srv := server.New(&cfg.API, logger, noopPinger{})

	addr := fmt.Sprintf(":%d", cfg.API.Port)
	logger.Info("QuoteCraft API starting", "addr", addr)

	if err := http.ListenAndServe(addr, srv.Handler()); err != nil {
		logger.Error("server exited", "error", err)
		os.Exit(1)
	}
}

// loadConfig resolves configuration from these sources, in order:
//  1. File path from the CONFIG_PATH environment variable.
//  2. ../config.yaml relative to the current working directory (works when
//     running from api/ via `air` or `go run ./cmd/api`).
//  3. Default in-process configuration (logs a warning).
func loadConfig(logger *slog.Logger) *config.Config {
	candidates := configCandidates()

	for _, path := range candidates {
		cfg, err := config.Load(path)
		if err == nil {
			logger.Info("loaded config", "path", path)
			return cfg
		}
		// Only log a warning if the file exists but could not be parsed.
		if !errors.Is(err, os.ErrNotExist) {
			logger.Warn("failed to load config", "path", path, "error", err)
		}
	}

	logger.Warn("no config file found; using built-in defaults")
	return config.Default()
}

// configCandidates returns the ordered list of config file paths to try.
func configCandidates() []string {
	candidates := []string{"../config.yaml"}
	if path := os.Getenv("CONFIG_PATH"); path != "" {
		candidates = append([]string{path}, candidates...)
	}
	return candidates
}
