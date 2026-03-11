package repository

import (
	"context"
	"errors"

	"github.com/saiyam0211/defellix/services/blockchain-service/internal/domain"
	"gorm.io/gorm"
)

var (
	ErrContractRecordNotFound = errors.New("contract record not found")
)

type ContractRecordRepository interface {
	Create(ctx context.Context, cr *domain.ContractRecord) error
	GetByContractID(ctx context.Context, contractID uint) (*domain.ContractRecord, error)
	GetByTransactionHash(ctx context.Context, txHash string) (*domain.ContractRecord, error)
	UpdateStatus(ctx context.Context, contractID uint, status string, blockNumber *uint64, blockHash string, gasUsed *uint64) error
}

type contractRecordRepository struct {
	db *gorm.DB
}

func NewContractRecordRepository(db *gorm.DB) ContractRecordRepository {
	return &contractRecordRepository{db: db}
}

func (r *contractRecordRepository) Create(ctx context.Context, cr *domain.ContractRecord) error {
	return r.db.WithContext(ctx).Create(cr).Error
}

func (r *contractRecordRepository) GetByContractID(ctx context.Context, contractID uint) (*domain.ContractRecord, error) {
	var cr domain.ContractRecord
	err := r.db.WithContext(ctx).Where("contract_id = ?", contractID).First(&cr).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrContractRecordNotFound
		}
		return nil, err
	}
	return &cr, nil
}

func (r *contractRecordRepository) GetByTransactionHash(ctx context.Context, txHash string) (*domain.ContractRecord, error) {
	var cr domain.ContractRecord
	err := r.db.WithContext(ctx).Where("transaction_hash = ?", txHash).First(&cr).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrContractRecordNotFound
		}
		return nil, err
	}
	return &cr, nil
}

func (r *contractRecordRepository) UpdateStatus(ctx context.Context, contractID uint, status string, blockNumber *uint64, blockHash string, gasUsed *uint64) error {
	updates := map[string]interface{}{"status": status}
	if blockNumber != nil {
		updates["block_number"] = blockNumber
	}
	if blockHash != "" {
		updates["block_hash"] = blockHash
	}
	if gasUsed != nil {
		updates["gas_used"] = gasUsed
	}
	res := r.db.WithContext(ctx).Model(&domain.ContractRecord{}).
		Where("contract_id = ?", contractID).
		Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrContractRecordNotFound
	}
	return nil
}
