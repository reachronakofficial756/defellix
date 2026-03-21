package domain

import (
	"time"

	"gorm.io/gorm"
)

// ScoreAnchor records a credibility score hash anchored on-chain
type ScoreAnchor struct {
	ID                  uint           `gorm:"primaryKey" json:"id"`
	UserID              uint           `gorm:"index;not null" json:"user_id"`
	ScoreHash           string         `gorm:"type:varchar(66);not null" json:"score_hash"`
	TransactionHash     string         `gorm:"type:varchar(66);uniqueIndex" json:"transaction_hash"`
	BlockNumber         *uint64        `gorm:"type:bigint" json:"block_number,omitempty"`
	GasUsed             *uint64        `gorm:"type:bigint" json:"gas_used,omitempty"`
	OverallScore        int            `gorm:"not null" json:"overall_score"`
	ScoreTier           string         `gorm:"type:varchar(40)" json:"score_tier"`
	DimensionScoresJSON string         `gorm:"type:text" json:"dimension_scores"`
	Network             string         `gorm:"type:varchar(20);default:base_sepolia" json:"network"`
	Status              string         `gorm:"type:varchar(20);default:pending" json:"status"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"-"`
}

func (ScoreAnchor) TableName() string {
	return "score_anchors"
}
