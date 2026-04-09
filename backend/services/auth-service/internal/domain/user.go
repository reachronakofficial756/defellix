package domain

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"type:varchar(255)" json:"-"` // Nullable for OAuth-only accounts

	// OAuth Integration
	AuthProvider string `gorm:"type:varchar(50);default:local" json:"auth_provider"` // local, google, linkedin
	ProviderID   string `gorm:"type:varchar(255);index" json:"provider_id,omitempty"` // The unique ID from Google/LinkedIn
	// Basic Information
	FullName      string         `gorm:"not null" json:"full_name"`
	WhatDoYouDo   string         `gorm:"type:varchar(150)" json:"what_do_you_do,omitempty"`
	Photo         string         `gorm:"type:text" json:"photo,omitempty"`
	ShortHeadline string         `gorm:"type:varchar(150)" json:"short_headline,omitempty"`
	Role          string         `gorm:"default:freelancer" json:"role"` // freelancer, client, both, admin
	Location      string         `gorm:"type:varchar(100)" json:"location,omitempty"`
	Experience    string         `gorm:"type:varchar(50)" json:"experience,omitempty"`

	// Social Links
	GitHubLink    string         `gorm:"type:text" json:"github_link,omitempty"`
	LinkedInLink  string         `gorm:"type:text" json:"linkedin_link,omitempty"`
	PortfolioLink string         `gorm:"type:text" json:"portfolio_link,omitempty"`
	InstagramLink string         `gorm:"type:text" json:"instagram_link,omitempty"`

	// Skills (Stored as JSON array)
	Skills        datatypes.JSON `gorm:"type:jsonb" json:"skills,omitempty"`

	// Extended Profile Fields
	Bio           string         `gorm:"type:text" json:"bio,omitempty"`
	Timezone      string         `gorm:"type:varchar(50)" json:"timezone,omitempty"`
	Phone         string         `gorm:"type:varchar(20)" json:"phone,omitempty"`

	// Reputation & Stats
	Stats                    datatypes.JSON `gorm:"type:jsonb" json:"stats,omitempty"`
	Projects                 datatypes.JSON `gorm:"type:jsonb" json:"projects,omitempty"`
	Testimonials             datatypes.JSON `gorm:"type:jsonb" json:"testimonials,omitempty"`
	Portfolio                datatypes.JSON `gorm:"type:jsonb" json:"portfolio,omitempty"` // Legacy

	// Client fields
	CompanyName   string         `gorm:"type:varchar(100)" json:"company_name,omitempty"`

	// Public profile routing (ourdomain.com/user_name)
	UserName      string         `gorm:"type:varchar(50);index" json:"user_name,omitempty"`

	// Visibility flags
	ShowProfile   bool           `gorm:"default:true" json:"show_profile"`
	ShowProjects  bool           `gorm:"default:true" json:"show_projects"`
	ShowContracts bool           `gorm:"default:false" json:"show_contracts"`

	// Metadata
	IsActive                 bool           `gorm:"default:true" json:"is_active"`
	IsVerified               bool           `gorm:"default:false" json:"is_verified"`
	IsProfileComplete        bool           `gorm:"default:false" json:"is_profile_complete"`
	CreatedAt                time.Time      `json:"created_at"`
	UpdatedAt                time.Time      `json:"updated_at"`
	DeletedAt                gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}

// UserRole constants
const (
	RoleUser      = "user"
	RoleFreelancer = "freelancer"
	RoleClient    = "client"
	RoleAdmin     = "admin"
)

// PendingRegistration represents a user who has initiated sign-up but has not verified their OTP yet
type PendingRegistration struct {
	Email     string    `gorm:"primaryKey;type:varchar(255)"`
	Password  string    `gorm:"type:varchar(255)"`
	FullName  string    `gorm:"not null"`
	OTP       string    `gorm:"type:varchar(6);not null"`
	ExpiresAt time.Time `gorm:"index"`
	CreatedAt time.Time
}

// TableName specifies the table name for PendingRegistration model
func (PendingRegistration) TableName() string {
	return "pending_registrations"
}

// PendingOAuthUser represents a user who authenticated via OAuth but hasn't completed profile setup
// They stay in this table until they fill Step 2 (username, etc.)
type PendingOAuthUser struct {
	Email      string    `gorm:"primaryKey;type:varchar(255)"`
	FullName   string    `gorm:"not null"`
	Provider   string    `gorm:"type:varchar(50);not null"` // google, linkedin, github
	ProviderID string    `gorm:"type:varchar(255);not null;index"`
	Role       string    `gorm:"type:varchar(20);default:freelancer"`
	ExpiresAt  time.Time `gorm:"index"` // 24 hours from creation
	CreatedAt  time.Time
}

// TableName specifies the table name for PendingOAuthUser model
func (PendingOAuthUser) TableName() string {
	return "pending_oauth_users"
}

