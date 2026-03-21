package repository

import (
	"context"
	"errors"

	"github.com/saiyam0211/defellix/services/contract-service/internal/domain"
	"gorm.io/gorm"
)

var ErrReviewNotFound = errors.New("review not found")

type ReviewRepository interface {
	Create(ctx context.Context, review *domain.ContractReview) error
	GetByContractID(ctx context.Context, contractID uint) (*domain.ContractReview, error)
	GetByFreelancerID(ctx context.Context, freelancerID uint) ([]*domain.ContractReview, error)
}

type reviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) ReviewRepository {
	return &reviewRepository{db: db}
}

func (r *reviewRepository) Create(ctx context.Context, review *domain.ContractReview) error {
	return r.db.WithContext(ctx).Create(review).Error
}

func (r *reviewRepository) GetByContractID(ctx context.Context, contractID uint) (*domain.ContractReview, error) {
	var review domain.ContractReview
	err := r.db.WithContext(ctx).Where("contract_id = ?", contractID).First(&review).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrReviewNotFound
	}
	return &review, err
}

func (r *reviewRepository) GetByFreelancerID(ctx context.Context, freelancerID uint) ([]*domain.ContractReview, error) {
	var reviews []*domain.ContractReview
	err := r.db.WithContext(ctx).Where("freelancer_user_id = ?", freelancerID).Order("reviewed_at DESC").Find(&reviews).Error
	return reviews, err
}
