package repository

import (
	"context"
	"errors"

	"github.com/saiyam0211/defellix/services/blockchain-service/internal/domain"
	"gorm.io/gorm"
)

var (
	ErrWalletNotFound = errors.New("wallet not found")
)

type WalletRepository interface {
	Create(ctx context.Context, w *domain.Wallet) error
	GetByUserIDAndType(ctx context.Context, userID uint, userType string) (*domain.Wallet, error)
	GetByAddress(ctx context.Context, address string) (*domain.Wallet, error)
}

type walletRepository struct {
	db *gorm.DB
}

func NewWalletRepository(db *gorm.DB) WalletRepository {
	return &walletRepository{db: db}
}

func (r *walletRepository) Create(ctx context.Context, w *domain.Wallet) error {
	return r.db.WithContext(ctx).Create(w).Error
}

func (r *walletRepository) GetByUserIDAndType(ctx context.Context, userID uint, userType string) (*domain.Wallet, error) {
	var w domain.Wallet
	err := r.db.WithContext(ctx).Where("user_id = ? AND user_type = ?", userID, userType).First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWalletNotFound
		}
		return nil, err
	}
	return &w, nil
}

func (r *walletRepository) GetByAddress(ctx context.Context, address string) (*domain.Wallet, error) {
	var w domain.Wallet
	err := r.db.WithContext(ctx).Where("address = ?", address).First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWalletNotFound
		}
		return nil, err
	}
	return &w, nil
}
