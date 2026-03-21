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

	// Extended fields for hybrid C+D algorithm
	DeliveryScore        int     `gorm:"type:int;default:0" json:"delivery_score"`
	QualityScore         int     `gorm:"type:int;default:0" json:"quality_score"`
	ProfessionalismScore int     `gorm:"type:int;default:0" json:"professionalism_score"`
	ReliabilityScore     int     `gorm:"type:int;default:0" json:"reliability_score"`
	ContractValue        float64 `gorm:"type:decimal(12,2);default:0" json:"contract_value"`
	OnTime               bool    `gorm:"default:false" json:"on_time"`

	// Raw per-dimension ratings from client review (1-5 stars each)
	DeliveryRatingRaw      int `gorm:"type:int;default:0" json:"delivery_rating_raw"`
	QualityRatingRaw       int `gorm:"type:int;default:0" json:"quality_rating_raw"`
	CommunicationRatingRaw int `gorm:"type:int;default:0" json:"communication_rating_raw"`
	RevisionCount          int    `gorm:"type:int;default:0" json:"revision_count"`
	DaysEarlyOrLate        int    `gorm:"type:int;default:0" json:"days_early_or_late"`
	ClientEmail            string `gorm:"type:varchar(255);index" json:"client_email,omitempty"`
	MilestoneRatingsJSON   string `gorm:"type:text" json:"milestone_ratings_json,omitempty"`

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

	// Extended fields for hybrid C+D algorithm
	DeliveryRating        int     `json:"delivery_rating,omitempty"`        // 1-5
	QualityRating         int     `json:"quality_rating,omitempty"`         // 1-5
	CommunicationRating   int     `json:"communication_rating,omitempty"`   // 1-5
	MilestoneRatings      []int   `json:"milestone_ratings,omitempty"`      // Array of 1-5 per milestone
	ContractValueUSD      float64 `json:"contract_value_usd,omitempty"`
	WasGhosted            bool    `json:"was_ghosted,omitempty"`
	DaysEarlyOrLate       int     `json:"days_early_or_late,omitempty"`     // Positive = early
	EstimatedDays         int     `json:"estimated_days,omitempty"`
	ActualDays            int     `json:"actual_days,omitempty"`
	ClientEmail           string  `json:"client_email,omitempty"`
}
