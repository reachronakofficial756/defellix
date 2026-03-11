package service

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/saiyam0211/defellix/services/auth-service/internal/config"
	"github.com/saiyam0211/defellix/services/auth-service/internal/domain"
	"github.com/saiyam0211/defellix/services/auth-service/internal/dto"
	"github.com/saiyam0211/defellix/services/auth-service/internal/repository"
	"github.com/saiyam0211/defellix/services/auth-service/pkg/jwt"
	"github.com/saiyam0211/defellix/services/auth-service/pkg/oauth"
	"golang.org/x/crypto/bcrypt"
)

var (
	// ErrOAuthNotConfigured indicates OAuth provider is not configured
	ErrOAuthNotConfigured = errors.New("oauth provider not configured")
	// ErrInvalidState indicates invalid OAuth state token
	ErrInvalidState = errors.New("invalid oauth state")
	// ErrOAuthProviderExists indicates OAuth provider already linked
	ErrOAuthProviderExists = errors.New("oauth provider already linked")
)

// OAuthService handles OAuth authentication business logic
type OAuthService struct {
	userRepo      repository.UserRepository
	oauthRepo     repository.OAuthRepository
	jwtManager    *jwt.JWTManager
	oauthManager  *oauth.OAuthManager
	authService   *AuthService
	encryptionKey []byte // For encrypting OAuth tokens
}

// NewOAuthService creates a new OAuth service
func NewOAuthService(
	userRepo repository.UserRepository,
	oauthRepo repository.OAuthRepository,
	jwtManager *jwt.JWTManager,
	authService *AuthService,
	oauthConfig *config.OAuthConfig,
	encryptionKey string,
) *OAuthService {
	// Generate encryption key from secret (in production, use proper key management)
	key := []byte(encryptionKey)
	if len(key) != 32 {
		// Pad or hash to 32 bytes
		hashed, _ := bcrypt.GenerateFromPassword([]byte(encryptionKey), bcrypt.DefaultCost)
		key = hashed[:32]
	}

	return &OAuthService{
		userRepo:      userRepo,
		oauthRepo:     oauthRepo,
		jwtManager:    jwtManager,
		oauthManager:  oauth.NewOAuthManager(oauthConfig),
		authService:   authService,
		encryptionKey: key,
	}
}

// GetGoogleAuthURL returns Google OAuth authorization URL
func (s *OAuthService) GetGoogleAuthURL() (string, string, error) {
	return s.oauthManager.GetGoogleAuthURL()
}

// GetLinkedInAuthURL returns LinkedIn OAuth authorization URL
func (s *OAuthService) GetLinkedInAuthURL() (string, string, error) {
	return s.oauthManager.GetLinkedInAuthURL()
}

// GetGitHubAuthURL returns GitHub OAuth authorization URL
func (s *OAuthService) GetGitHubAuthURL() (string, string, error) {
	return s.oauthManager.GetGitHubAuthURL()
}

// HandleGoogleCallback handles Google OAuth callback
func (s *OAuthService) HandleGoogleCallback(ctx context.Context, code, state string) (*dto.AuthResponse, error) {
	// Validate state
	if !s.oauthManager.ValidateState(state) {
		return nil, ErrInvalidState
	}

	// Exchange code for user info
	oauthUser, _, err := s.oauthManager.ExchangeGoogleCode(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}

	// Retrieve stored role from context/state (defaults to freelancer)
	// We will pass this to AuthLoginAndRegister
	authRole := ctx.Value("oauth_role")
	roleStr := domain.RoleFreelancer
	if r, ok := authRole.(string); ok && (r == domain.RoleClient || r == domain.RoleFreelancer) {
		roleStr = r
	}

	return s.authService.OAuthLoginAndRegister(oauthUser.Email, oauthUser.Name, "google", oauthUser.ProviderID, roleStr)
}

// HandleLinkedInCallback handles LinkedIn OAuth callback
func (s *OAuthService) HandleLinkedInCallback(ctx context.Context, code, state string) (*dto.AuthResponse, error) {
	if !s.oauthManager.ValidateState(state) {
		return nil, ErrInvalidState
	}

	oauthUser, _, err := s.oauthManager.ExchangeLinkedInCode(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}

	authRole := ctx.Value("oauth_role")
	roleStr := domain.RoleFreelancer
	if r, ok := authRole.(string); ok && (r == domain.RoleClient || r == domain.RoleFreelancer) {
		roleStr = r
	}

	return s.authService.OAuthLoginAndRegister(oauthUser.Email, oauthUser.Name, "linkedin", oauthUser.ProviderID, roleStr)
}

// HandleGitHubCallback handles GitHub OAuth callback
func (s *OAuthService) HandleGitHubCallback(ctx context.Context, code, state string) (*dto.AuthResponse, error) {
	if !s.oauthManager.ValidateState(state) {
		return nil, ErrInvalidState
	}

	oauthUser, token, err := s.oauthManager.ExchangeGitHubCode(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}

	existingProvider, _ := s.oauthRepo.FindByProviderID("github", oauthUser.ProviderID)
	
	var user *domain.User
	if existingProvider != nil {
		user, err = s.userRepo.FindByID(existingProvider.UserID)
		if err != nil {
			return nil, err
		}
		existingProvider.AccessToken = s.encryptToken(token.AccessToken)
		if token.Expiry.After(time.Now()) {
			existingProvider.TokenExpiry = &token.Expiry
		}
		s.oauthRepo.Update(existingProvider)
	} else {
		user, _ = s.userRepo.FindByEmail(oauthUser.Email)
		
		if user == nil {
			user = &domain.User{
				Email:    oauthUser.Email,
				FullName: oauthUser.Name,
				Role:     domain.RoleFreelancer,
				IsActive: true,
			}
			if err := s.userRepo.Create(user); err != nil {
				return nil, err
			}
		}
		
		profileData, _ := json.Marshal(oauthUser.RawData)
		oauthProvider := &domain.OAuthProvider{
			UserID:      user.ID,
			Provider:    "github",
			ProviderID:  oauthUser.ProviderID,
			Email:       oauthUser.Email,
			AccessToken: s.encryptToken(token.AccessToken),
			ProfileData: string(profileData),
			IsVerified:  true,
		}
		if token.Expiry.After(time.Now()) {
			oauthProvider.TokenExpiry = &token.Expiry
		}
		
		if err := s.oauthRepo.Create(oauthProvider); err != nil {
			return nil, err
		}
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.jwtManager.GetAccessTokenTTL().Hours()),
	}, nil
}

// encryptToken encrypts OAuth tokens before storage
func (s *OAuthService) encryptToken(token string) string {
	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return token // Fallback to plain text if encryption fails
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return token
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return token
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(token), nil)
	return base64.StdEncoding.EncodeToString(ciphertext)
}

// decryptToken decrypts OAuth tokens
func (s *OAuthService) decryptToken(encryptedToken string) (string, error) {
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedToken)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}
