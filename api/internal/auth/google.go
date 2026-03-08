package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

// CodeExchanger exchanges an OAuth authorization code for an access token.
type CodeExchanger interface {
	Exchange(ctx context.Context, code, codeVerifier, redirectURI string) (accessToken string, err error)
}

// UserInfoFetcher fetches the authenticated user's info from the provider.
type UserInfoFetcher interface {
	FetchUserInfo(ctx context.Context, accessToken string) (providerID, email string, err error)
}

const (
	googleTokenURL    = "https://oauth2.googleapis.com/token"
	googleUserInfoURL = "https://www.googleapis.com/oauth2/v3/userinfo"
)

// GoogleExchanger implements CodeExchanger and UserInfoFetcher using the
// Google OAuth 2.0 and userinfo APIs over raw net/http.
type GoogleExchanger struct {
	clientID     string
	clientSecret string
	httpClient   *http.Client
	tokenURL     string
	userInfoURL  string
}

// NewGoogleExchanger creates a GoogleExchanger with the given OAuth credentials.
// If httpClient is nil, http.DefaultClient is used.
func NewGoogleExchanger(clientID, clientSecret string, httpClient *http.Client) *GoogleExchanger {
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	return &GoogleExchanger{
		clientID:     clientID,
		clientSecret: clientSecret,
		httpClient:   httpClient,
		tokenURL:     googleTokenURL,
		userInfoURL:  googleUserInfoURL,
	}
}

// googleTokenResponse is the JSON response from the Google token endpoint.
type googleTokenResponse struct {
	AccessToken string `json:"access_token"`
}

// Exchange posts the authorization code to the Google token endpoint and
// returns the access token. Returns an error if the HTTP status is not 200.
func (g *GoogleExchanger) Exchange(ctx context.Context, code, codeVerifier, redirectURI string) (string, error) {
	params := url.Values{}
	params.Set("code", code)
	params.Set("code_verifier", codeVerifier)
	params.Set("client_id", g.clientID)
	params.Set("client_secret", g.clientSecret)
	params.Set("redirect_uri", redirectURI)
	params.Set("grant_type", "authorization_code")

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, g.tokenURL, strings.NewReader(params.Encode()))
	if err != nil {
		return "", fmt.Errorf("creating token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("posting to token endpoint: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("token endpoint returned status %d", resp.StatusCode)
	}

	var body googleTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return "", fmt.Errorf("decoding token response: %w", err)
	}

	return body.AccessToken, nil
}

// googleUserInfoResponse is the JSON response from the Google userinfo endpoint.
type googleUserInfoResponse struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
}

// FetchUserInfo calls the Google userinfo endpoint with the given access token
// and returns the provider-assigned user ID (sub) and email address.
// Returns an error if the HTTP status is not 200.
func (g *GoogleExchanger) FetchUserInfo(ctx context.Context, accessToken string) (string, string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, g.userInfoURL, nil)
	if err != nil {
		return "", "", fmt.Errorf("creating userinfo request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("fetching userinfo: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("userinfo endpoint returned status %d", resp.StatusCode)
	}

	var body googleUserInfoResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return "", "", fmt.Errorf("decoding userinfo response: %w", err)
	}

	return body.Sub, body.Email, nil
}
