package server

import (
	"encoding/json"
	"net/http"
)

// Sentinel error codes used by handlers when calling WriteError. These codes
// are included in the JSON error envelope and are safe to expose to clients.
const (
	ErrCodeInternal     = "INTERNAL_ERROR"
	ErrCodeNotFound     = "NOT_FOUND"
	ErrCodeBadRequest   = "BAD_REQUEST"
	ErrCodeUnauthorized = "UNAUTHORIZED"
	ErrCodeForbidden    = "FORBIDDEN"
	ErrCodeConflict     = "CONFLICT"
)

// fallbackErrorBody is written verbatim when json.Marshal itself fails. Using a
// hardcoded byte literal avoids any recursive call to WriteJSON or WriteError
// that could loop indefinitely.
var fallbackErrorBody = []byte(`{"data":null,"error":{"code":"INTERNAL_ERROR","message":"internal error"},"meta":{}}`)

// Meta carries pagination or other per-response metadata. It is always
// serialized as an empty JSON object {} for now, but is exported so future
// tasks can add fields without changing the call sites.
type Meta struct{}

// ErrorBody is the error section of the JSON envelope. Code is a machine-
// readable sentinel (e.g., "NOT_FOUND") and Message is a human-readable
// explanation safe to surface to API clients. Stack traces and internal details
// are never included here; they are logged server-side.
type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Envelope is the generic JSON wrapper for all API responses. Every response —
// success or error — is wrapped in this structure so clients can deserialize
// without checking the HTTP status code first.
//
// Success:  {"data": <T>, "error": null, "meta": {}}
// Error:    {"data": null, "error": {"code": "...", "message": "..."}, "meta": {}}
type Envelope[T any] struct {
	Data  T          `json:"data"`
	Error *ErrorBody `json:"error"`
	Meta  Meta       `json:"meta"`
}

// writeResponse sets the Content-Type header, writes the HTTP status code, and
// writes b as the response body. On marshal failure (b == nil), it writes the
// hardcoded 500 fallback body instead.
//
// This shared helper is called by WriteJSON and WriteError so the fallback path
// is exercised by tests without duplicating logic.
func writeResponse(w http.ResponseWriter, status int, b []byte) {
	w.Header().Set("Content-Type", "application/json")
	if b == nil {
		w.WriteHeader(http.StatusInternalServerError)
		// Ignore write errors: we are already in an error path and have no
		// further recourse. The request will be logged by RequestLogger with
		// status 500 regardless.
		_, _ = w.Write(fallbackErrorBody)
		return
	}
	w.WriteHeader(status)
	_, _ = w.Write(b)
}

// WriteJSON encodes data inside a success envelope and writes it to w with the
// given HTTP status code. The Content-Type header is always set to
// "application/json".
//
// If json.Marshal fails (e.g., data contains an unmarshalable type such as a
// channel), WriteJSON writes a hardcoded 500 fallback body rather than calling
// itself recursively, which would loop indefinitely.
func WriteJSON[T any](w http.ResponseWriter, status int, data T) {
	env := Envelope[T]{
		Data:  data,
		Error: nil,
		Meta:  Meta{},
	}

	b, err := json.Marshal(env)
	if err != nil {
		writeResponse(w, 0, nil)
		return
	}
	writeResponse(w, status, b)
}

// WriteError encodes an error body inside an error envelope and writes it to w
// with the given HTTP status code. code should be one of the ErrCode* sentinel
// constants. message is a human-readable string safe to return to clients.
//
// The envelope type used here (Envelope[any] with nil Data and a plain
// ErrorBody) is always JSON-serializable, so this function does not have a
// marshal-failure path. WriteJSON handles the marshal-failure case for
// user-supplied data types that may be unmarshalable.
func WriteError(w http.ResponseWriter, status int, code, message string) {
	env := Envelope[any]{
		Data:  nil,
		Error: &ErrorBody{Code: code, Message: message},
		Meta:  Meta{},
	}

	// The marshal of Envelope[any] with nil Data and an ErrorBody struct cannot
	// fail. Panic here would indicate a programming error (e.g., someone changed
	// the Envelope or ErrorBody types to include unmarshalable fields).
	b, _ := json.Marshal(env)
	writeResponse(w, status, b)
}
