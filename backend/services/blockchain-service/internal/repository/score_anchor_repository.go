package repository

import (
	"context"
	"errors"

	"github.com/saiyam0211/defellix/services/blockchain-service/internal/domain"
	"gorm.io/gorm"
)

var ErrScoreAnchorNotFound = errors.New("score anchor not found")

type ScoreAnchorRepository interface {
	Create(ctx context.Context, anchor *domain.ScoreAnchor) error
	GetByUserID(ctx context.Context, userID uint, limit int) ([]domain.ScoreAnchor, error)
	GetLatestByUserID(ctx context.Context, userID uint) (*domain.ScoreAnchor, error)
}

type scoreAnchorRepository struct {
	db *gorm.DB
}

func NewScoreAnchorRepository(db *gorm.DB) ScoreAnchorRepository {
	return &scoreAnchorRepository{db: db}
}

func (r *scoreAnchorRepository) Create(ctx context.Context, anchor *domain.ScoreAnchor) error {
	return r.db.WithContext(ctx).Create(anchor).Error
}

func (r *scoreAnchorRepository) GetByUserID(ctx context.Context, userID uint, limit int) ([]domain.ScoreAnchor, error) {
	var anchors []domain.ScoreAnchor
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&anchors).Error
	return anchors, err
}

func (r *scoreAnchorRepository) GetLatestByUserID(ctx context.Context, userID uint) (*domain.ScoreAnchor, error) {
	var anchor domain.ScoreAnchor
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		First(&anchor).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrScoreAnchorNotFound
		}
		return nil, err
	}
	return &anchor, nil
}
