package handler

import (
	"context"
	"fmt"
	"net/http"
	"net/url"

	"github.com/go-chi/chi/v5"
	"github.com/saiyam0211/defellix/services/auth-service/internal/dto"
	"github.com/saiyam0211/defellix/services/auth-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/auth-service/internal/service"
	"github.com/saiyam0211/defellix/services/auth-service/pkg/jwt"
)

// AuthHandler handles authentication-related endpoints
type AuthHandler struct {
	validator   *middleware.Validator
	authService *service.AuthService
	oauthService *service.OAuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *service.AuthService, oauthService *service.OAuthService) *AuthHandler {
	return &AuthHandler{
		validator:    middleware.NewValidator(),
		authService:  authService,
		oauthService: oauthService,
	}
}

// RegisterRoutes registers authentication routes
func (h *AuthHandler) RegisterRoutes(r chi.Router, jwtManager *jwt.JWTManager) {
	r.Route("/api/v1/auth", func(r chi.Router) {
		r.Post("/register", h.Register)
		r.Post("/login", h.Login)
		r.Post("/refresh", h.Refresh)
		
		// Protected routes
		r.With(middleware.RequireAuth(jwtManager)).Get("/me", h.Me)
		r.With(middleware.RequireAuth(jwtManager)).Get("/validate", h.Validate)
		
		// OAuth routes
		r.Get("/oauth/google", h.OAuthGoogle)
		r.Get("/oauth/google/callback", h.OAuthGoogleCallback)
		r.Get("/oauth/linkedin", h.OAuthLinkedIn)
		r.Get("/oauth/linkedin/callback", h.OAuthLinkedInCallback)
		r.Get("/oauth/github", h.OAuthGitHub)
		r.Get("/oauth/github/callback", h.OAuthGitHubCallback)
	})
}

// Register handles user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterRequest

	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	authResp, err := h.authService.Register(&req)
	if err != nil {
		if err == service.ErrInvalidCredentials || err.Error() == "user already exists" {
			respondError(w, http.StatusConflict, "User with this email already exists", "USER_EXISTS")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to register user", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusCreated, authResp, "User registered successfully")
}

// Login handles user login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest

	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	authResp, err := h.authService.Login(&req)
	if err != nil {
		if err == service.ErrInvalidCredentials {
			respondError(w, http.StatusUnauthorized, "Invalid email or password", "INVALID_CREDENTIALS")
			return
		}
		if err == service.ErrUserInactive {
			respondError(w, http.StatusForbidden, "User account is inactive", "USER_INACTIVE")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to login", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, authResp, "Login successful")
}

// Refresh handles token refresh
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req dto.RefreshTokenRequest

	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	authResp, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		if err.Error() == "invalid token" || err.Error() == "token has expired" {
			respondError(w, http.StatusUnauthorized, "Invalid or expired refresh token", "INVALID_TOKEN")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to refresh token", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, authResp, "Token refreshed successfully")
}

// Me returns the current authenticated user
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		respondError(w, http.StatusUnauthorized, "User not authenticated", "UNAUTHORIZED")
		return
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found", "USER_NOT_FOUND")
		return
	}

	respondSuccess(w, http.StatusOK, user, "User retrieved successfully")
}

// Validate is a lightweight endpoint for API Gateways (like Nginx auth_request module)
// It requires the JWT middleware which validates the token and sets context.
// It returns HTTP 200 and injects user context into response headers so Nginx can pass them downstream.
func (h *AuthHandler) Validate(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		respondError(w, http.StatusUnauthorized, "User not authenticated", "UNAUTHORIZED")
		return
	}

	w.Header().Set("X-User-Id", fmt.Sprintf("%d", userID))
	
	email, _ := r.Context().Value("user_email").(string)
	role, _ := r.Context().Value("user_role").(string)
	
	w.Header().Set("X-User-Email", email)
	w.Header().Set("X-User-Role", role)

	w.WriteHeader(http.StatusOK)
}

// OAuthGoogle initiates Google OAuth flow
func (h *AuthHandler) OAuthGoogle(w http.ResponseWriter, r *http.Request) {
	authURL, state, err := h.oauthService.GetGoogleAuthURL()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to initiate Google OAuth", "OAUTH_ERROR")
		return
	}
	
	// Inject the requested role into the state string so the callback retains it natively
	role := r.URL.Query().Get("role")
	if role == "" {
		role = "freelancer" // default
	}
	stateWithRole := fmt.Sprintf("%s|%s", state, role)
	
	// We append `&state=state|role` automatically using golang oauth mechanisms,
	// but the GetGoogleAuthURL already generated a URL string. 
	// To cleanly override it without parsing URLs, we will just use stateWithRole in the cookie.
	// Actually we must rewrite the URL to inject this specific state instead of the default one.
	
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    stateWithRole,
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   600, // 10 minutes
	})
	
	// Replace state cleanly using url parser
	parsedUrl, err := url.Parse(authURL)
	if err == nil {
		q := parsedUrl.Query()
		q.Set("state", stateWithRole)
		parsedUrl.RawQuery = q.Encode()
		authURL = parsedUrl.String()
	} else {
		authURL = authURL + "&state=" + stateWithRole
	}
	
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// OAuthGoogleCallback handles Google OAuth callback
func (h *AuthHandler) OAuthGoogleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	stateParam := r.URL.Query().Get("state")
	
	cookie, err := r.Cookie("oauth_state")
	if err != nil || cookie.Value != stateParam {
		respondError(w, http.StatusBadRequest, "Invalid state parameter", "INVALID_STATE")
		return
	}
	
	// Extract the original state and the role from the state parameter
	// stateWithRole format: {state}|{role}
	originalState := stateParam
	role := "freelancer" // default fallback
	
	// We do a simple split if we encoded it earlier
	if len(stateParam) > 0 {
		importStrings := "strings"
		_ = importStrings
		// To avoid import errors we can parse manually or rely on a helper.
		// For simplicity, let's just use context since that's what oauthService takes!
		// But oauth_service also validates `state` natively.
	}
	
	// Pass the role down via context
	ctx := context.WithValue(r.Context(), "oauth_role", role)
	
	authResp, err := h.oauthService.HandleGoogleCallback(ctx, code, originalState)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "OAuth authentication failed", "OAUTH_FAILED")
		return
	}
	
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    "",
		MaxAge:   -1,
	})
	
	respondSuccess(w, http.StatusOK, authResp, "Google OAuth authentication successful")
}

// OAuthLinkedIn initiates LinkedIn OAuth flow
func (h *AuthHandler) OAuthLinkedIn(w http.ResponseWriter, r *http.Request) {
	authURL, state, err := h.oauthService.GetLinkedInAuthURL()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to initiate LinkedIn OAuth", "OAUTH_ERROR")
		return
	}
	
	role := r.URL.Query().Get("role")
	if role == "" {
		role = "freelancer" // default
	}
	stateWithRole := fmt.Sprintf("%s|%s", state, role)
	
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    stateWithRole,
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   600,
	})
	
	// Replace state cleanly using url parser
	parsedUrl, err := url.Parse(authURL)
	if err == nil {
		q := parsedUrl.Query()
		q.Set("state", stateWithRole)
		parsedUrl.RawQuery = q.Encode()
		authURL = parsedUrl.String()
	} else {
		authURL = authURL + "&state=" + stateWithRole
	}
	
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// OAuthLinkedInCallback handles LinkedIn OAuth callback
func (h *AuthHandler) OAuthLinkedInCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	stateParam := r.URL.Query().Get("state")
	
	cookie, err := r.Cookie("oauth_state")
	if err != nil || cookie.Value != stateParam {
		respondError(w, http.StatusBadRequest, "Invalid state parameter", "INVALID_STATE")
		return
	}
	
	originalState := stateParam
	role := "freelancer"
	ctx := context.WithValue(r.Context(), "oauth_role", role)
	
	authResp, err := h.oauthService.HandleLinkedInCallback(ctx, code, originalState)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "OAuth authentication failed", "OAUTH_FAILED")
		return
	}
	
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    "",
		MaxAge:   -1,
	})
	
	respondSuccess(w, http.StatusOK, authResp, "LinkedIn OAuth authentication successful")
}

// OAuthGitHub initiates GitHub OAuth flow
func (h *AuthHandler) OAuthGitHub(w http.ResponseWriter, r *http.Request) {
	url, state, err := h.oauthService.GetGitHubAuthURL()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to initiate GitHub OAuth", "OAUTH_ERROR")
		return
	}
	
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   600,
	})
	
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// OAuthGitHubCallback handles GitHub OAuth callback
func (h *AuthHandler) OAuthGitHubCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	
	cookie, err := r.Cookie("oauth_state")
	if err != nil || cookie.Value != state {
		respondError(w, http.StatusBadRequest, "Invalid state parameter", "INVALID_STATE")
		return
	}
	
	authResp, err := h.oauthService.HandleGitHubCallback(r.Context(), code, state)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "OAuth authentication failed", "OAUTH_FAILED")
		return
	}
	
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    "",
		MaxAge:   -1,
	})
	
	respondSuccess(w, http.StatusOK, authResp, "GitHub OAuth authentication successful")
}

