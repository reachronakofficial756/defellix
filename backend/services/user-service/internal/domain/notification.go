package domain

import "time"

// ScoreNotification records a score change event for a user
type ScoreNotification struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	Type      string    `gorm:"type:varchar(30);not null;default:'score_updated'" json:"type"`
	Title     string    `gorm:"type:varchar(200)" json:"title"`
	Message   string    `gorm:"type:text" json:"message"`
	OldScore  int       `json:"old_score"`
	NewScore  int       `json:"new_score"`
	OldTier   string    `gorm:"type:varchar(40)" json:"old_tier"`
	NewTier   string    `gorm:"type:varchar(40)" json:"new_tier"`
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// TableName specifies the table name for ScoreNotification
func (ScoreNotification) TableName() string {
	return "score_notifications"
}
