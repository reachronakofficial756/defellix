package domain

import (
	"time"

	"gorm.io/gorm"
)

// ContractReview stores the client's ratings and testimonial after a contract is completed
type ContractReview struct {
	ID                    uint           `gorm:"primaryKey" json:"id"`
	ContractID            uint           `gorm:"uniqueIndex;not null" json:"contract_id"`
	FreelancerUserID      uint           `gorm:"index;not null" json:"freelancer_user_id"`
	ClientName            string         `gorm:"type:varchar(120)" json:"client_name"`
	ClientEmail           string         `gorm:"type:varchar(255)" json:"client_email"`
	ClientCompanyName     string         `gorm:"type:varchar(120)" json:"client_company_name,omitempty"`

	// Multi-metric ratings (1-5 stars each)
	OverallRating         int            `gorm:"type:int;not null" json:"overall_rating"`
	DeliveryRating        int            `gorm:"type:int;not null" json:"delivery_rating"`
	QualityRating         int            `gorm:"type:int;not null" json:"quality_rating"`
	CommunicationRating   int            `gorm:"type:int;not null" json:"communication_rating"`

	// Written feedback
	Comment               string         `gorm:"type:text" json:"comment"`

	// Testimonial
	Testimonial           string         `gorm:"type:text" json:"testimonial,omitempty"`
	AllowTestimonialPublic bool          `gorm:"default:false" json:"allow_testimonial_public"`

	ReviewedAt            time.Time      `gorm:"autoCreateTime" json:"reviewed_at"`
	DeletedAt             gorm.DeletedAt `gorm:"index" json:"-"`
}

func (ContractReview) TableName() string {
	return "contract_reviews"
}

// ContractReviewRequest is the payload from the client review page
type ContractReviewRequest struct {
	OverallRating         int    `json:"overall_rating" validate:"required,min=1,max=5"`
	DeliveryRating        int    `json:"delivery_rating" validate:"required,min=1,max=5"`
	QualityRating         int    `json:"quality_rating" validate:"required,min=1,max=5"`
	CommunicationRating   int    `json:"communication_rating" validate:"required,min=1,max=5"`
	Comment               string `json:"comment" validate:"omitempty,max=2000"`
	Testimonial           string `json:"testimonial" validate:"omitempty,max=2000"`
	AllowTestimonialPublic bool  `json:"allow_testimonial_public"`
}
