package server

import "net/http"

// responseWriter wraps http.ResponseWriter to capture the status code and
// number of bytes written. The default status code is 200 if WriteHeader was
// never called.
type responseWriter struct {
	http.ResponseWriter
	statusCode   int
	bytesWritten int
}

func newResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
}

// WriteHeader captures the status code and forwards it to the underlying writer.
func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// Write captures the byte count and forwards the write to the underlying writer.
func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.bytesWritten += n
	return n, err
}
