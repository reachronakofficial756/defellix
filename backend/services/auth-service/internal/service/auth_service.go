package service

import (
	"errors"

	"github.com/saiyam0211/defellix/services/auth-service/internal/domain"
	"github.com/saiyam0211/defellix/services/auth-service/internal/dto"
	"github.com/saiyam0211/defellix/services/auth-service/internal/repository"
	"github.com/saiyam0211/defellix/services/auth-service/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
)

var (
	// ErrInvalidCredentials indicates invalid login credentials
	ErrInvalidCredentials = errors.New("invalid email or password")
	// ErrUserInactive indicates user account is inactive
	ErrUserInactive = errors.New("user account is inactive")
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo   repository.UserRepository
	jwtManager *jwt.JWTManager
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo repository.UserRepository, jwtManager *jwt.JWTManager) *AuthService {
	return &AuthService{
		userRepo:   userRepo,
		jwtManager: jwtManager,
	}
}

// Register registers a new user
func (s *AuthService) Register(req *dto.RegisterRequest) (*dto.AuthResponse, error) {
	// Check if user already exists
	existingUser, _ := s.userRepo.FindByEmail(req.Email)
	if existingUser != nil {
		return nil, repository.ErrUserExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &domain.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		FullName: req.FullName,
		Role:     domain.RoleFreelancer,
		IsActive: true,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Generate tokens
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

// Login authenticates a user and returns tokens
func (s *AuthService) Login(req *dto.LoginRequest) (*dto.AuthResponse, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	// Check if user is active
	if !user.IsActive {
		return nil, ErrUserInactive
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	// Generate tokens
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

// RefreshToken generates new tokens from a refresh token
func (s *AuthService) RefreshToken(refreshToken string) (*dto.AuthResponse, error) {
	// Validate refresh token
	claims, err := s.jwtManager.ValidateToken(refreshToken)
	if err != nil {
		return nil, err
	}

	// Find user
	user, err := s.userRepo.FindByID(claims.UserID)
	if err != nil {
		return nil, err
	}

	// Check if user is active
	if !user.IsActive {
		return nil, ErrUserInactive
	}

	// Generate new tokens
	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, err
	}

	newRefreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.jwtManager.GetAccessTokenTTL().Hours() * 3600), // Convert hours to seconds
	}, nil
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(userID uint) (*domain.User, error) {
	return s.userRepo.FindByID(userID)
}

// OAuthLoginAndRegister handles users returning from Google or LinkedIn callbacks
func (s *AuthService) OAuthLoginAndRegister(email, fullName, provider, providerID string, defaultRole string) (*dto.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil && !errors.Is(err, repository.ErrUserNotFound) {
		return nil, err
	}

	if user == nil {
		// Auto-Register the new user
		user = &domain.User{
			Email:        email,
			FullName:     fullName,
			Role:         defaultRole,
			IsActive:     true,
			AuthProvider: provider,
			ProviderID:   providerID,
		}
		if err := s.userRepo.Create(user); err != nil {
			return nil, err
		}
	} else if user.AuthProvider == "local" {
		// User previously registered manually, link the OAuth provider
		user.AuthProvider = provider
		user.ProviderID = providerID
		if err := s.userRepo.Update(user); err != nil {
			return nil, err
		}
	}

	if !user.IsActive {
		return nil, ErrUserInactive
	}

	// Sign the standard system JWTs
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
		ExpiresIn:    int(s.jwtManager.GetAccessTokenTTL().Hours() * 3600),
	}, nil
}
