package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResponseWriter_DefaultStatusCode(t *testing.T) {
	rec := httptest.NewRecorder()
	rw := newResponseWriter(rec)

	if rw.statusCode != http.StatusOK {
		t.Errorf("expected default status code 200, got %d", rw.statusCode)
	}
}

func TestResponseWriter_WriteHeader(t *testing.T) {
	rec := httptest.NewRecorder()
	rw := newResponseWriter(rec)

	rw.WriteHeader(http.StatusNotFound)

	if rw.statusCode != http.StatusNotFound {
		t.Errorf("expected status code 404, got %d", rw.statusCode)
	}
	if rec.Code != http.StatusNotFound {
		t.Errorf("expected underlying recorder code 404, got %d", rec.Code)
	}
}

func TestResponseWriter_Write(t *testing.T) {
	rec := httptest.NewRecorder()
	rw := newResponseWriter(rec)

	body := []byte("hello")
	n, err := rw.Write(body)
	if err != nil {
		t.Fatalf("Write() returned unexpected error: %v", err)
	}
	if n != len(body) {
		t.Errorf("Write() returned n=%d, want %d", n, len(body))
	}
	if rw.bytesWritten != len(body) {
		t.Errorf("bytesWritten=%d, want %d", rw.bytesWritten, len(body))
	}
	if rec.Body.String() != string(body) {
		t.Errorf("underlying body=%q, want %q", rec.Body.String(), string(body))
	}
}

func TestResponseWriter_MultipleWrites(t *testing.T) {
	rec := httptest.NewRecorder()
	rw := newResponseWriter(rec)

	first := []byte("foo")
	second := []byte("bar")

	if _, err := rw.Write(first); err != nil {
		t.Fatalf("first Write() returned unexpected error: %v", err)
	}
	if _, err := rw.Write(second); err != nil {
		t.Fatalf("second Write() returned unexpected error: %v", err)
	}

	want := len(first) + len(second)
	if rw.bytesWritten != want {
		t.Errorf("bytesWritten=%d, want %d", rw.bytesWritten, want)
	}
}
