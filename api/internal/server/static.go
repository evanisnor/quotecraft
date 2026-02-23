package server

import (
	"net/http"
)

// MountStaticFiles registers a /static/* route that serves files from the given directory.
// This is only intended for local development — in production, static assets are served by the CDN.
// Call this method only when cdn.serve_local is true in the configuration.
func (s *Server) MountStaticFiles(dir string) {
	s.mux.Handle("/static/*", http.StripPrefix("/static", http.FileServer(http.Dir(dir))))
}
