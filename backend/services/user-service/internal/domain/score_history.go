package domain

import (
	"time"

	"gorm.io/datatypes"
)

// ScoreHistory stores a snapshot of a user's credibility score at a point in time
type ScoreHistory struct {
	ID                  uint           `gorm:"primaryKey" json:"id"`
	UserID              uint           `gorm:"index;not null" json:"user_id"`
	OverallScore        int            `gorm:"not null" json:"overall_score"`
	ScoreTier           string         `gorm:"type:varchar(40)" json:"score_tier"`
	DimensionScoresJSON datatypes.JSON `gorm:"type:jsonb" json:"dimension_scores"`
	SnapshotDate        time.Time      `gorm:"index;not null" json:"snapshot_date"`
	CreatedAt           time.Time      `gorm:"autoCreateTime" json:"created_at"`
}
