package repository

import (
	"context"

	"github.com/saiyam0211/defellix/services/user-service/internal/domain"
	"gorm.io/gorm"
)

// NotificationRepository defines the interface for score notification data access
type NotificationRepository interface {
	Create(ctx context.Context, notification *domain.ScoreNotification) error
	GetByUserID(ctx context.Context, userID uint) ([]*domain.ScoreNotification, error)
	MarkAsRead(ctx context.Context, notificationID uint, userID uint) error
	GetUnreadCount(ctx context.Context, userID uint) (int64, error)
}

type notificationRepository struct {
	db *gorm.DB
}

// NewNotificationRepository creates a new notification repository
func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(ctx context.Context, n *domain.ScoreNotification) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *notificationRepository) GetByUserID(ctx context.Context, userID uint) ([]*domain.ScoreNotification, error) {
	var list []*domain.ScoreNotification
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(50).
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, notificationID uint, userID uint) error {
	return r.db.WithContext(ctx).
		Model(&domain.ScoreNotification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true).Error
}

func (r *notificationRepository) GetUnreadCount(ctx context.Context, userID uint) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&domain.ScoreNotification{}).
		Where("user_id = ? AND is_read = false", userID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
