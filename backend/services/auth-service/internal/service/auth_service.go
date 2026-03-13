package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/saiyam0211/defellix/services/auth-service/internal/domain"
	"github.com/saiyam0211/defellix/services/auth-service/internal/dto"
	"github.com/saiyam0211/defellix/services/auth-service/internal/notification"
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
	notifier   notification.AuthNotifier
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo repository.UserRepository, jwtManager *jwt.JWTManager, notifier notification.AuthNotifier) *AuthService {
	return &AuthService{
		userRepo:   userRepo,
		jwtManager: jwtManager,
		notifier:   notifier,
	}
}

// Register registers a new user
func (s *AuthService) Register(req *dto.RegisterRequest) (*dto.AuthResponse, error) {
	// Check if user already exists
	existingUser, err := s.userRepo.FindByEmail(req.Email)
	if err != nil && !errors.Is(err, repository.ErrUserNotFound) {
		return nil, err // DB crashed, bubble it up instead of ignoring it
	}
	if existingUser != nil {
		return nil, repository.ErrUserExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Generate 6-digit OTP
	max := big.NewInt(1000000)
	n, _ := rand.Int(rand.Reader, max)
	otp := fmt.Sprintf("%06d", n.Int64())
	expiresAt := time.Now().Add(10 * time.Minute)

	// Create pending registration
	pr := &domain.PendingRegistration{
		Email:     req.Email,
		Password:  string(hashedPassword),
		FullName:  req.FullName,
		OTP:       otp,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}

	if err := s.userRepo.CreatePendingRegistration(pr); err != nil {
		return nil, err
	}

	// Send OTP asynchronously
	s.notifier.SendRegistrationOTP(context.Background(), pr.Email, otp, pr.FullName)

	return &dto.AuthResponse{
		Message: "Verification email sent. Please verify your OTP to complete registration.",
	}, nil
}

// VerifyEmail validates the OTP and activates the account, returning JWTs.
func (s *AuthService) VerifyEmail(req *dto.VerifyEmailRequest) (*dto.AuthResponse, error) {
	pr, err := s.userRepo.FindPendingRegistrationByEmail(req.Email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, errors.New("invalid email or OTP") // generic error for security
		}
		return nil, err
	}

	if pr.OTP != req.OTP {
		return nil, errors.New("invalid OTP")
	}

	if time.Now().After(pr.ExpiresAt) {
		return nil, errors.New("OTP has expired, please request a new one")
	}

	// OTP is valid. Create the actual user account.
	user := &domain.User{
		Email:      pr.Email,
		Password:   pr.Password,
		FullName:   pr.FullName,
		Role:       domain.RoleFreelancer,
		IsActive:   true,
		IsVerified: true,
	}

	if err := s.userRepo.Create(user); err != nil {
		// Just in case the user was somehow verified concurrently or natively
		if err == repository.ErrUserExists {
			s.userRepo.DeletePendingRegistration(pr.Email)
			return nil, errors.New("user is already verified")
		}
		return nil, err
	}

	// Clean up pending registration
	if err := s.userRepo.DeletePendingRegistration(pr.Email); err != nil {
		// Log error but don't fail the verification since the user is already created
		fmt.Printf("Warning: failed to delete pending registration for %s: %v\n", pr.Email, err)
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
		Message:      "Email verified successfully",
		UserEmail:    user.Email,
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

	// Check if user is verified
	if !user.IsVerified {
		return nil, errors.New("account not verified, please check your email for the OTP")
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
		UserEmail:    user.Email,
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
		UserEmail:    user.Email,
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
			IsVerified:   true, // OAuth implicitly verifies the email
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
		UserEmail:    user.Email,
	}, nil
}
