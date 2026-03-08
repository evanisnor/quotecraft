package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestGoogleExchanger_Exchange_Success verifies that Exchange posts the correct
// form parameters to the token endpoint and returns the access token.
func TestGoogleExchanger_Exchange_Success(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if err := r.ParseForm(); err != nil {
			t.Fatalf("parsing form: %v", err)
		}
		if r.FormValue("code") != "auth-code" {
			t.Errorf("expected code=auth-code, got %q", r.FormValue("code"))
		}
		if r.FormValue("code_verifier") != "verifier-abc" {
			t.Errorf("expected code_verifier=verifier-abc, got %q", r.FormValue("code_verifier"))
		}
		if r.FormValue("redirect_uri") != "https://app.example.com/callback" {
			t.Errorf("expected redirect_uri, got %q", r.FormValue("redirect_uri"))
		}
		if r.FormValue("grant_type") != "authorization_code" {
			t.Errorf("expected grant_type=authorization_code, got %q", r.FormValue("grant_type"))
		}
		if r.FormValue("client_id") != "test-client-id" {
			t.Errorf("expected client_id=test-client-id, got %q", r.FormValue("client_id"))
		}
		if r.FormValue("client_secret") != "test-client-secret" {
			t.Errorf("expected client_secret=test-client-secret, got %q", r.FormValue("client_secret"))
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(map[string]string{"access_token": "test-token"}); err != nil {
			t.Fatalf("encoding response: %v", err)
		}
	}))
	defer srv.Close()

	exchanger := newGoogleExchangerForTest("test-client-id", "test-client-secret", srv.URL+"/token", srv.URL+"/userinfo", srv.Client())

	token, err := exchanger.Exchange(context.Background(), "auth-code", "verifier-abc", "https://app.example.com/callback")
	if err != nil {
		t.Fatalf("Exchange() returned unexpected error: %v", err)
	}
	if token != "test-token" {
		t.Errorf("expected token %q, got %q", "test-token", token)
	}
}

// TestGoogleExchanger_Exchange_HTTPError verifies that a non-200 response from
// the token endpoint is returned as an error.
func TestGoogleExchanger_Exchange_HTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer srv.Close()

	exchanger := newGoogleExchangerForTest("id", "secret", srv.URL+"/token", srv.URL+"/userinfo", srv.Client())

	_, err := exchanger.Exchange(context.Background(), "code", "verifier", "https://example.com")
	if err == nil {
		t.Fatal("expected error for HTTP 400, got nil")
	}
}

// TestGoogleExchanger_FetchUserInfo_Success verifies that FetchUserInfo calls the
// userinfo endpoint with the Bearer token and returns the sub and email.
func TestGoogleExchanger_FetchUserInfo_Success(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer my-access-token" {
			t.Errorf("expected Authorization header Bearer my-access-token, got %q", r.Header.Get("Authorization"))
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(map[string]string{
			"sub":   "google-123",
			"email": "alice@example.com",
		}); err != nil {
			t.Fatalf("encoding response: %v", err)
		}
	}))
	defer srv.Close()

	exchanger := newGoogleExchangerForTest("id", "secret", srv.URL+"/token", srv.URL+"/userinfo", srv.Client())

	providerID, email, err := exchanger.FetchUserInfo(context.Background(), "my-access-token")
	if err != nil {
		t.Fatalf("FetchUserInfo() returned unexpected error: %v", err)
	}
	if providerID != "google-123" {
		t.Errorf("expected providerID %q, got %q", "google-123", providerID)
	}
	if email != "alice@example.com" {
		t.Errorf("expected email %q, got %q", "alice@example.com", email)
	}
}

// TestGoogleExchanger_FetchUserInfo_HTTPError verifies that a non-200 response
// from the userinfo endpoint is returned as an error.
func TestGoogleExchanger_FetchUserInfo_HTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer srv.Close()

	exchanger := newGoogleExchangerForTest("id", "secret", srv.URL+"/token", srv.URL+"/userinfo", srv.Client())

	_, _, err := exchanger.FetchUserInfo(context.Background(), "expired-token")
	if err == nil {
		t.Fatal("expected error for HTTP 401, got nil")
	}
}

// TestNewGoogleExchanger_NilHTTPClient verifies that a nil httpClient falls back
// to http.DefaultClient.
func TestNewGoogleExchanger_NilHTTPClient(t *testing.T) {
	g := NewGoogleExchanger("id", "secret", nil)
	if g.httpClient != http.DefaultClient {
		t.Error("expected httpClient to be http.DefaultClient when nil is passed")
	}
}

// TestGoogleExchanger_Exchange_InvalidURL verifies that an invalid token endpoint URL
// causes Exchange to return an error from http.NewRequestWithContext.
func TestGoogleExchanger_Exchange_InvalidURL(t *testing.T) {
	exchanger := newGoogleExchangerForTest("id", "secret", ":\x00invalid", "", http.DefaultClient)
	_, err := exchanger.Exchange(context.Background(), "code", "verifier", "https://example.com")
	if err == nil {
		t.Fatal("expected error for invalid token URL, got nil")
	}
}

// TestGoogleExchanger_Exchange_InvalidJSON verifies that a non-JSON 200 response
// from the token endpoint causes Exchange to return a decode error.
func TestGoogleExchanger_Exchange_InvalidJSON(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("not json"))
	}))
	defer srv.Close()

	exchanger := newGoogleExchangerForTest("id", "secret", srv.URL+"/token", srv.URL+"/userinfo", srv.Client())
	_, err := exchanger.Exchange(context.Background(), "code", "verifier", "https://example.com")
	if err == nil {
		t.Fatal("expected error for invalid JSON response, got nil")
	}
}

// TestGoogleExchanger_Exchange_NetworkError verifies that a network failure in
// httpClient.Do causes Exchange to return an error.
func TestGoogleExchanger_Exchange_NetworkError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {}))
	srv.Close() // Close immediately so all requests fail.

	exchanger := newGoogleExchangerForTest("id", "secret", srv.URL+"/token", srv.URL+"/userinfo", srv.Client())
	_, err := exchanger.Exchange(context.Background(), "code", "verifier", "https://example.com")
	if err == nil {
		t.Fatal("expected error for network failure, got nil")
	}
}

// TestGoogleExchanger_FetchUserInfo_InvalidURL verifies that an invalid userinfo
// endpoint URL causes FetchUserInfo to return an error from http.NewRequestWithContext.
func TestGoogleExchanger_FetchUserInfo_InvalidURL(t *testing.T) {
	exchanger := newGoogleExchangerForTest("id", "secret", "", ":\x00invalid", http.DefaultClient)
	_, _, err := exchanger.FetchUserInfo(context.Background(), "token")
	if err == nil {
		t.Fatal("expected error for invalid userinfo URL, got nil")
	}
}

// TestGoogleExchanger_FetchUserInfo_InvalidJSON verifies that a non-JSON 200 response
// from the userinfo endpoint causes FetchUserInfo to return a decode error.
func TestGoogleExchanger_FetchUserInfo_InvalidJSON(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("not json"))
	}))
	defer srv.Close()

	exchanger := newGoogleExchangerForTest("id", "secret", srv.URL+"/token", srv.URL+"/userinfo", srv.Client())
	_, _, err := exchanger.FetchUserInfo(context.Background(), "token")
	if err == nil {
		t.Fatal("expected error for invalid JSON response, got nil")
	}
}

// TestGoogleExchanger_FetchUserInfo_NetworkError verifies that a network failure
// in httpClient.Do causes FetchUserInfo to return an error.
func TestGoogleExchanger_FetchUserInfo_NetworkError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {}))
	srv.Close() // Close immediately so all requests fail.

	exchanger := newGoogleExchangerForTest("id", "secret", srv.URL+"/token", srv.URL+"/userinfo", srv.Client())
	_, _, err := exchanger.FetchUserInfo(context.Background(), "token")
	if err == nil {
		t.Fatal("expected error for network failure, got nil")
	}
}

// newGoogleExchangerForTest creates a GoogleExchanger with overridden endpoint URLs
// for use in unit tests against httptest servers.
func newGoogleExchangerForTest(clientID, clientSecret, tokenURL, userInfoURL string, httpClient *http.Client) *GoogleExchanger {
	return &GoogleExchanger{
		clientID:     clientID,
		clientSecret: clientSecret,
		httpClient:   httpClient,
		tokenURL:     tokenURL,
		userInfoURL:  userInfoURL,
	}
}
