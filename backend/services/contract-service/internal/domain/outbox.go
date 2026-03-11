package domain

import "time"

const (
	OutboxStatusPending   = "pending"
	OutboxStatusProcessing = "processing"
	OutboxStatusSuccess   = "success"
	OutboxStatusFailed    = "failed"
)

type BlockchainOutbox struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	ContractID uint       `gorm:"index;not null" json:"contract_id"`
	Status     string     `gorm:"type:varchar(20);default:pending;index" json:"status"`
	RetryCount int        `gorm:"default:0" json:"retry_count"`
	ErrorLog   string     `gorm:"type:text" json:"error_log,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}
