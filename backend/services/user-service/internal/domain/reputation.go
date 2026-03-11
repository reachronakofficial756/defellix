package domain

import (
	"time"

	"gorm.io/gorm"
)

// Reputation records the score and metadata for an individual completed contract
type Reputation struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	FreelancerID    uint           `gorm:"index;not null" json:"freelancer_id"`
	ContractID      uint           `gorm:"index;unique;not null" json:"contract_id"` // One reputation score per contract
	BaseRating      int            `gorm:"type:int;not null" json:"base_rating"`     // 1 to 5 stars
	DeadlineBonus   int            `gorm:"type:int;default:0" json:"deadline_bonus"`
	RevisionPenalty int            `gorm:"type:int;default:0" json:"revision_penalty"`
	CalculatedScore int            `gorm:"type:int;not null" json:"calculated_score"` // Final RP for this contract
	ClientFeedback  *string        `gorm:"type:text" json:"client_feedback,omitempty"`
	CreatedAt       time.Time      `gorm:"autoCreateTime" json:"created_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

// ReputationRequest is the internal payload sent from contract-service to user-service
type ReputationRequest struct {
	FreelancerID      uint      `json:"freelancer_id" validate:"required"`
	ContractID        uint      `json:"contract_id" validate:"required"`
	ClientRating      int       `json:"client_rating" validate:"required,min=1,max=5"`
	ClientFeedback    *string   `json:"client_feedback,omitempty"`
	ContractDeadline  time.Time `json:"contract_deadline" validate:"required"`
	SubmittedAt       time.Time `json:"submitted_at" validate:"required"`
	RevisionCount     int       `json:"revision_count"`
}
