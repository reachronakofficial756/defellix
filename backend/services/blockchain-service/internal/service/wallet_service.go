package service

import (
	"context"
	"errors"
	"time"

	"github.com/saiyam0211/defellix/services/blockchain-service/internal/domain"
	"github.com/saiyam0211/defellix/services/blockchain-service/internal/dto"
	"github.com/saiyam0211/defellix/services/blockchain-service/internal/repository"
	"github.com/saiyam0211/defellix/services/blockchain-service/pkg/wallet"
)

var (
	ErrWalletExists = errors.New("wallet already exists for this user and type")
)

type WalletService struct {
	repo        repository.WalletRepository
	encryptionKey string
	network     string
}

func NewWalletService(repo repository.WalletRepository, encryptionKey, network string) *WalletService {
	return &WalletService{
		repo:          repo,
		encryptionKey: encryptionKey,
		network:       network,
	}
}

// CreateOrGetWallet creates a wallet if it doesn't exist, or returns existing one
func (s *WalletService) CreateOrGetWallet(ctx context.Context, userID uint, userType string) (*dto.WalletResponse, error) {
	// Check if wallet already exists
	existing, err := s.repo.GetByUserIDAndType(ctx, userID, userType)
	if err == nil && existing != nil {
		return s.toWalletResponse(existing), nil
	}
	if err != nil && !errors.Is(err, repository.ErrWalletNotFound) {
		return nil, err
	}

	// Generate new wallet
	address, privateKeyHex, err := wallet.GenerateWallet()
	if err != nil {
		return nil, err
	}

	// Encrypt private key
	encryptedKey, err := wallet.EncryptPrivateKey(privateKeyHex, s.encryptionKey)
	if err != nil {
		return nil, err
	}

	// Save to database
	w := &domain.Wallet{
		UserID:            userID,
		UserType:          userType,
		Address:           address,
		EncryptedPrivateKey: encryptedKey,
		Network:           s.network,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	if err := s.repo.Create(ctx, w); err != nil {
		return nil, err
	}

	return s.toWalletResponse(w), nil
}

// GetWallet retrieves wallet by user ID and type
func (s *WalletService) GetWallet(ctx context.Context, userID uint, userType string) (*dto.WalletResponse, error) {
	w, err := s.repo.GetByUserIDAndType(ctx, userID, userType)
	if err != nil {
		return nil, err
	}
	return s.toWalletResponse(w), nil
}

func (s *WalletService) toWalletResponse(w *domain.Wallet) *dto.WalletResponse {
	return &dto.WalletResponse{
		ID:        w.ID,
		UserID:    w.UserID,
		UserType:  w.UserType,
		Address:   w.Address,
		Network:   w.Network,
		CreatedAt: w.CreatedAt.Format(time.RFC3339),
	}
}
