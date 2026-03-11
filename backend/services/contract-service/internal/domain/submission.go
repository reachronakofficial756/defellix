package domain

import (
	"time"

	"gorm.io/gorm"
)

const (
	SubmissionStatusDraft            = "draft"
	SubmissionStatusPending          = "pending_review"
	SubmissionStatusAccepted         = "accepted"
	SubmissionStatusRevision         = "revision_requested"
	SubmissionStatusGhosted          = "ghosted"
)

// RevisionComment represents a single comment structure stored in RevisionHistory array
type RevisionComment struct {
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}

// Submission represents work submitted by a freelancer against a contract
type Submission struct {
	ID                  uint           `gorm:"primaryKey" json:"id"`
	ContractID          uint           `gorm:"index;not null" json:"contract_id"`
	MilestoneID         *uint          `gorm:"index" json:"milestone_id,omitempty"` // Nullable for backwards compatibility, but should be used for milestone-based submissions
	FreelancerID        uint           `gorm:"index;not null" json:"freelancer_id"`
	SubmittedData       string         `gorm:"type:jsonb" json:"submitted_data,omitempty"` // JSON mapping of submission criteria (Phase 8)
	Description         string         `gorm:"type:text;not null" json:"description"`      // Originally DetailedDescription
	Status              string         `gorm:"type:varchar(20);default:draft;not null" json:"status"` // draft, pending_review, accepted, revision_requested, ghosted
	RevisionHistory     string         `gorm:"type:jsonb" json:"revision_history,omitempty"` // array of RevisionComment
	SubmittedAt         time.Time      `gorm:"autoCreateTime" json:"submitted_at"`
	ReviewedAt          *time.Time     `json:"reviewed_at,omitempty"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"-"`
}

// SubmissionRequest is the payload for creating a new submission
type SubmissionRequest struct {
	MilestoneID         *uint                  `json:"milestone_id,omitempty"` // The specific milestone this submission is for
	Status              string                 `json:"status" validate:"omitempty,oneof=draft pending_review"`
	SubmittedData       map[string]interface{} `json:"submitted_data" validate:"required"`
	Description         string                 `json:"description" validate:"required"`
}

// UpdateSubmissionRequest is the payload for editing a draft/revision submission
type UpdateSubmissionRequest struct {
	Status              *string                `json:"status,omitempty" validate:"omitempty,oneof=draft pending_review"`
	SubmittedData       map[string]interface{} `json:"submitted_data,omitempty"`
	Description         *string                `json:"description,omitempty"`
}

// SubmissionReviewRequest is the payload for a client reviewing a submission
type SubmissionReviewRequest struct {
	Action  string  `json:"action" validate:"required,oneof=accept revision"` // 'accept' or 'revision'
	Comment *string `json:"comment" validate:"omitempty,max=1000"`
}
