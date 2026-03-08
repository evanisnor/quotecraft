package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/evanisnor/quotecraft/api/internal/auth"
	"github.com/evanisnor/quotecraft/api/internal/calculator"
	"github.com/evanisnor/quotecraft/api/internal/config"
	"github.com/evanisnor/quotecraft/api/internal/db"
	"github.com/evanisnor/quotecraft/api/internal/server"
	"github.com/evanisnor/quotecraft/api/internal/storage"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("service", "api")

	cfg := loadConfig(logger)

	dbConn, err := db.Open("postgres", cfg.API.DatabaseURL)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer func() {
		if err := dbConn.Close(); err != nil {
			logger.Error("closing database connection", "error", err)
		}
	}()

	userRepo := auth.NewPostgresUserRepository(dbConn.DB())
	sessionRepo := auth.NewPostgresSessionRepository(dbConn.DB())
	resetTokenRepo := auth.NewPostgresResetTokenRepository(dbConn.DB())
	emailSender := auth.NewLogPasswordResetEmailSender(logger)
	authService := auth.NewService(userRepo, userRepo, sessionRepo, sessionRepo, sessionRepo, resetTokenRepo, resetTokenRepo, resetTokenRepo, userRepo, emailSender)

	if cfg.API.GoogleOAuth.ClientID != "" {
		googleExchanger := auth.NewGoogleExchanger(cfg.API.GoogleOAuth.ClientID, cfg.API.GoogleOAuth.ClientSecret, nil)
		authService.WithGoogleOAuth(userRepo, googleExchanger, googleExchanger)
	}

	calcRepo := calculator.NewPostgresCalculatorRepository(dbConn.DB())
	calcService := calculator.NewService(calcRepo, calcRepo, calcRepo, calcRepo, calcRepo, calcRepo, calcRepo)

	storageAdapter, err := initStorage(context.Background(), logger, cfg)
	if err != nil {
		logger.Error("failed to initialize storage", "error", err)
		os.Exit(1)
	}

	srv := server.New(&cfg.API, logger, dbConn)
	srv.MountAuth(authService)
	if cfg.API.GoogleOAuth.ClientID != "" {
		srv.MountGoogleOAuth(authService)
	}
	srv.MountCalculators(authService, calcService)
	srv.MountPublicCalculators(calcService)
	srv.MountAssets(authService, storageAdapter)
	if cfg.CDN.ServeLocal {
		srv.MountStaticFiles(cfg.CDN.WidgetDir)
	}

	addr := fmt.Sprintf(":%d", cfg.API.Port)
	logger.Info("QuoteCraft API starting", "addr", addr)

	if err := http.ListenAndServe(addr, srv.Handler()); err != nil {
		logger.Error("server exited", "error", err)
		os.Exit(1)
	}
}

// initStorage selects and initialises the configured object storage adapter.
// For "s3": when cfg.Storage.S3.Endpoint is non-empty (MinIO dev mode) the base
// URL is endpoint + "/" + bucket; when the endpoint is empty (production AWS S3)
// cfg.CDN.BaseURL is used so that GetURL returns CDN-prefixed URLs.
// For "filesystem": cfg.CDN.BaseURL is used as the base URL.
// Returns an error if the provider is unrecognised or initialisation fails.
func initStorage(ctx context.Context, logger *slog.Logger, cfg *config.Config) (storage.Storage, error) {
	switch cfg.Storage.Provider {
	case "s3":
		baseURL := cfg.CDN.BaseURL
		if cfg.Storage.S3.Endpoint != "" {
			// MinIO dev mode: return direct MinIO URLs.
			baseURL = cfg.Storage.S3.Endpoint + "/" + cfg.Storage.S3.Bucket
		}
		adapter, err := storage.NewS3AdapterFromConfig(ctx, cfg.Storage.S3, baseURL)
		if err != nil {
			return nil, fmt.Errorf("initializing S3 storage: %w", err)
		}
		return adapter, nil
	case "filesystem":
		return storage.NewFilesystemAdapter(cfg.Storage.Filesystem.BaseDir, cfg.CDN.BaseURL), nil
	default:
		return nil, fmt.Errorf("unknown storage provider: %q", cfg.Storage.Provider)
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
