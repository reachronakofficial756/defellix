package repository

import (
	"context"

	"github.com/saiyam0211/defellix/services/user-service/internal/domain"
	"gorm.io/gorm"
)

type ReputationRepository interface {
	Create(ctx context.Context, reputation *domain.Reputation) error
	GetByContractID(ctx context.Context, contractID uint) (*domain.Reputation, error)
	GetByFreelancerID(ctx context.Context, freelancerID uint) ([]*domain.Reputation, error)
}

type reputationRepository struct {
	db *gorm.DB
}

func NewReputationRepository(db *gorm.DB) ReputationRepository {
	return &reputationRepository{db: db}
}

func (r *reputationRepository) Create(ctx context.Context, rep *domain.Reputation) error {
	return r.db.WithContext(ctx).Create(rep).Error
}

func (r *reputationRepository) GetByContractID(ctx context.Context, contractID uint) (*domain.Reputation, error) {
	var rep domain.Reputation
	if err := r.db.WithContext(ctx).Where("contract_id = ?", contractID).First(&rep).Error; err != nil {
		return nil, err
	}
	return &rep, nil
}

func (r *reputationRepository) GetByFreelancerID(ctx context.Context, freelancerID uint) ([]*domain.Reputation, error) {
	var list []*domain.Reputation
	if err := r.db.WithContext(ctx).Where("freelancer_id = ?", freelancerID).Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}
