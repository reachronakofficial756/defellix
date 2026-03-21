package repository

import (
	"context"
	"time"

	"github.com/saiyam0211/defellix/services/user-service/internal/domain"
	"gorm.io/gorm"
)

type ScoreHistoryRepository interface {
	Create(ctx context.Context, snapshot *domain.ScoreHistory) error
	GetByUserID(ctx context.Context, userID uint, limit int) ([]domain.ScoreHistory, error)
	GetLatestByUserID(ctx context.Context, userID uint) (*domain.ScoreHistory, error)
}

type scoreHistoryRepository struct {
	db *gorm.DB
}

func NewScoreHistoryRepository(db *gorm.DB) ScoreHistoryRepository {
	return &scoreHistoryRepository{db: db}
}

func (r *scoreHistoryRepository) Create(ctx context.Context, snapshot *domain.ScoreHistory) error {
	if snapshot.SnapshotDate.IsZero() {
		snapshot.SnapshotDate = time.Now()
	}
	return r.db.WithContext(ctx).Create(snapshot).Error
}

func (r *scoreHistoryRepository) GetByUserID(ctx context.Context, userID uint, limit int) ([]domain.ScoreHistory, error) {
	var history []domain.ScoreHistory
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("snapshot_date DESC").
		Limit(limit).
		Find(&history).Error
	return history, err
}

func (r *scoreHistoryRepository) GetLatestByUserID(ctx context.Context, userID uint) (*domain.ScoreHistory, error) {
	var snapshot domain.ScoreHistory
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("snapshot_date DESC").
		First(&snapshot).Error
	if err != nil {
		return nil, err
	}
	return &snapshot, nil
}
