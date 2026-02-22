package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestWriteJSON_SuccessEnvelope verifies that WriteJSON writes the correct
// status code, Content-Type header, and JSON body for a successful response.
func TestWriteJSON_SuccessEnvelope(t *testing.T) {
	type payload struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}

	rec := httptest.NewRecorder()
	WriteJSON(rec, http.StatusOK, payload{ID: "abc", Name: "test"})

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", ct)
	}

	var env Envelope[payload]
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("response body is not valid JSON: %v\nbody: %s", err, rec.Body.String())
	}

	if env.Error != nil {
		t.Errorf("expected error field to be null, got %+v", env.Error)
	}

	if env.Data.ID != "abc" {
		t.Errorf("expected data.id=abc, got %q", env.Data.ID)
	}
	if env.Data.Name != "test" {
		t.Errorf("expected data.name=test, got %q", env.Data.Name)
	}
}

// TestWriteJSON_NonDefaultStatus verifies that WriteJSON correctly writes
// non-200 success status codes (e.g., 201 Created).
func TestWriteJSON_NonDefaultStatus(t *testing.T) {
	rec := httptest.NewRecorder()
	WriteJSON(rec, http.StatusCreated, map[string]string{"key": "value"})

	if rec.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d", rec.Code)
	}
}

// TestWriteJSON_MarshalError verifies that WriteJSON writes the hardcoded
// fallback 500 response when json.Marshal fails (e.g., for unmarshalable types).
func TestWriteJSON_MarshalError(t *testing.T) {
	// Channels cannot be marshaled to JSON — this forces a marshal error.
	rec := httptest.NewRecorder()
	WriteJSON(rec, http.StatusOK, make(chan int))

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500 on marshal error, got %d", rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json on fallback, got %q", ct)
	}

	body := rec.Body.String()
	if body != `{"data":null,"error":{"code":"INTERNAL_ERROR","message":"internal error"},"meta":{}}` {
		t.Errorf("unexpected fallback body: %s", body)
	}
}

// TestWriteError_ErrorEnvelope verifies that WriteError writes the correct
// status code, Content-Type header, and JSON error envelope.
func TestWriteError_ErrorEnvelope(t *testing.T) {
	rec := httptest.NewRecorder()
	WriteError(rec, http.StatusNotFound, ErrCodeNotFound, "Resource not found")

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", ct)
	}

	var env Envelope[any]
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("response body is not valid JSON: %v\nbody: %s", err, rec.Body.String())
	}

	if env.Data != nil {
		t.Errorf("expected data field to be null, got %v", env.Data)
	}

	if env.Error == nil {
		t.Fatal("expected error field to be non-null, got nil")
	}
	if env.Error.Code != ErrCodeNotFound {
		t.Errorf("expected error.code=%q, got %q", ErrCodeNotFound, env.Error.Code)
	}
	if env.Error.Message != "Resource not found" {
		t.Errorf("expected error.message=%q, got %q", "Resource not found", env.Error.Message)
	}
}

// TestWriteError_VariousStatusCodes verifies WriteError correctly sets different
// status codes for the full set of sentinel error codes.
func TestWriteError_VariousStatusCodes(t *testing.T) {
	cases := []struct {
		status  int
		code    string
		message string
	}{
		{http.StatusInternalServerError, ErrCodeInternal, "internal error"},
		{http.StatusNotFound, ErrCodeNotFound, "not found"},
		{http.StatusBadRequest, ErrCodeBadRequest, "bad request"},
		{http.StatusUnauthorized, ErrCodeUnauthorized, "unauthorized"},
		{http.StatusForbidden, ErrCodeForbidden, "forbidden"},
		{http.StatusConflict, ErrCodeConflict, "conflict"},
	}

	for _, tc := range cases {
		t.Run(tc.code, func(t *testing.T) {
			rec := httptest.NewRecorder()
			WriteError(rec, tc.status, tc.code, tc.message)

			if rec.Code != tc.status {
				t.Errorf("expected status %d, got %d", tc.status, rec.Code)
			}

			var env Envelope[any]
			if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
				t.Fatalf("response body is not valid JSON: %v", err)
			}

			if env.Error == nil {
				t.Fatal("expected non-null error field")
			}
			if env.Error.Code != tc.code {
				t.Errorf("expected code %q, got %q", tc.code, env.Error.Code)
			}
			if env.Error.Message != tc.message {
				t.Errorf("expected message %q, got %q", tc.message, env.Error.Message)
			}
		})
	}
}

// TestErrCodes_NonEmpty verifies that all sentinel error code constants are
// non-empty strings.
func TestErrCodes_NonEmpty(t *testing.T) {
	codes := []struct {
		name  string
		value string
	}{
		{"ErrCodeInternal", ErrCodeInternal},
		{"ErrCodeNotFound", ErrCodeNotFound},
		{"ErrCodeBadRequest", ErrCodeBadRequest},
		{"ErrCodeUnauthorized", ErrCodeUnauthorized},
		{"ErrCodeForbidden", ErrCodeForbidden},
		{"ErrCodeConflict", ErrCodeConflict},
	}

	for _, c := range codes {
		t.Run(c.name, func(t *testing.T) {
			if c.value == "" {
				t.Errorf("expected %s to be non-empty", c.name)
			}
		})
	}
}

// TestWriteJSON_MetaIsEmptyObject verifies that the meta field is serialized
// as an empty JSON object {} and not null or omitted.
func TestWriteJSON_MetaIsEmptyObject(t *testing.T) {
	rec := httptest.NewRecorder()
	WriteJSON(rec, http.StatusOK, "hello")

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(rec.Body.Bytes(), &raw); err != nil {
		t.Fatalf("response body is not valid JSON: %v", err)
	}

	metaRaw, ok := raw["meta"]
	if !ok {
		t.Fatal("expected meta field in response")
	}
	if string(metaRaw) != "{}" {
		t.Errorf("expected meta={}, got %s", string(metaRaw))
	}
}

// TestWriteError_MetaIsEmptyObject verifies that WriteError also produces
// a meta field serialized as an empty JSON object {}.
func TestWriteError_MetaIsEmptyObject(t *testing.T) {
	rec := httptest.NewRecorder()
	WriteError(rec, http.StatusBadRequest, ErrCodeBadRequest, "bad input")

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(rec.Body.Bytes(), &raw); err != nil {
		t.Fatalf("response body is not valid JSON: %v", err)
	}

	metaRaw, ok := raw["meta"]
	if !ok {
		t.Fatal("expected meta field in response")
	}
	if string(metaRaw) != "{}" {
		t.Errorf("expected meta={}, got %s", string(metaRaw))
	}
}

// TestWriteError_DataIsNull verifies that WriteError serializes the data
// field as JSON null.
func TestWriteError_DataIsNull(t *testing.T) {
	rec := httptest.NewRecorder()
	WriteError(rec, http.StatusUnauthorized, ErrCodeUnauthorized, "unauthorized")

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(rec.Body.Bytes(), &raw); err != nil {
		t.Fatalf("response body is not valid JSON: %v", err)
	}

	dataRaw, ok := raw["data"]
	if !ok {
		t.Fatal("expected data field in response")
	}
	if string(dataRaw) != "null" {
		t.Errorf("expected data=null, got %s", string(dataRaw))
	}
}

// TestWriteJSON_ErrorIsNull verifies that WriteJSON serializes the error
// field as JSON null.
func TestWriteJSON_ErrorIsNull(t *testing.T) {
	rec := httptest.NewRecorder()
	WriteJSON(rec, http.StatusOK, "success")

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(rec.Body.Bytes(), &raw); err != nil {
		t.Fatalf("response body is not valid JSON: %v", err)
	}

	errRaw, ok := raw["error"]
	if !ok {
		t.Fatal("expected error field in response")
	}
	if string(errRaw) != "null" {
		t.Errorf("expected error=null, got %s", string(errRaw))
	}
}

// TestWriteResponse_FallbackOnNilBody verifies that writeResponse writes the
// hardcoded 500 fallback body when called with nil bytes (representing a
// marshal failure). This covers the fallback branch shared by WriteJSON and
// WriteError.
func TestWriteResponse_FallbackOnNilBody(t *testing.T) {
	rec := httptest.NewRecorder()
	writeResponse(rec, http.StatusOK, nil)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500 on nil body, got %d", rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json on fallback, got %q", ct)
	}

	body := rec.Body.String()
	if body != `{"data":null,"error":{"code":"INTERNAL_ERROR","message":"internal error"},"meta":{}}` {
		t.Errorf("unexpected fallback body: %s", body)
	}
}

// TestWriteResponse_WritesBodyAndStatus verifies the normal (non-fallback) path
// of writeResponse: sets Content-Type, writes the given status code, and writes
// the given body.
func TestWriteResponse_WritesBodyAndStatus(t *testing.T) {
	rec := httptest.NewRecorder()
	body := []byte(`{"data":"ok","error":null,"meta":{}}`)
	writeResponse(rec, http.StatusAccepted, body)

	if rec.Code != http.StatusAccepted {
		t.Errorf("expected status 202, got %d", rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", ct)
	}

	if rec.Body.String() != string(body) {
		t.Errorf("expected body %q, got %q", string(body), rec.Body.String())
	}
}
