package main

import (
	"log/slog"
	"net/http"
	"os"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	// TODO [INFR-US3-A001]: Read addr from config instead of hardcoding.
	addr := ":8080"
	logger.Info("QuoteCraft API starting", "addr", addr)

	// TODO [INFR-US3-A001]: Replace nil handler with the real router when the
	// server skeleton is implemented. nil routes to http.DefaultServeMux (global
	// mutable state) and is only acceptable as a compile-verified stub.
	if err := http.ListenAndServe(addr, nil); err != nil {
		logger.Error("server exited", "error", err)
		os.Exit(1)
	}
}
