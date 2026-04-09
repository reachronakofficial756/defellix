package domain

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// User represents a user and their profile in the system (Mapped to the exact same 'users' table as auth-service)
// Using PostgreSQL with JSONB for flexible fields
type User struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	Email  string `gorm:"uniqueIndex;not null" json:"email"`

	// Basic Information (Required at registration)
	FullName      string `gorm:"not null" json:"full_name"`
	WhatDoYouDo   string `gorm:"type:varchar(150)" json:"what_do_you_do,omitempty"` // Profession/Role headline e.g Backend Developer
	Photo         string `gorm:"type:text" json:"photo,omitempty"`                 // Avatar/Profile picture URL
	ShortHeadline string `gorm:"type:varchar(150);not null" json:"short_headline"` // Professional tagline
	Role          string `gorm:"type:varchar(20);default:freelancer" json:"role"`  // freelancer, client, both
	Location      string `gorm:"type:varchar(100)" json:"location,omitempty"`
	Experience    string `gorm:"type:varchar(50)" json:"experience,omitempty"` // e.g., "5 years", "Senior"

	// Social Links (Required at registration)
	GitHubLink    string `gorm:"type:text" json:"github_link,omitempty"`
	LinkedInLink  string `gorm:"type:text" json:"linkedin_link,omitempty"`
	PortfolioLink string `gorm:"type:text" json:"portfolio_link,omitempty"`
	InstagramLink string `gorm:"type:text" json:"instagram_link,omitempty"`

	// Skills (Required at registration - multiple) - Using PostgreSQL array
	Skills datatypes.JSON `gorm:"type:jsonb" json:"skills,omitempty"` // Stored as JSON array

	// Extended Profile Fields (Added after contracts
	Bio   string `gorm:"type:text" json:"bio,omitempty"`        // Detailed bio
	Phone string `gorm:"type:varchar(20)" json:"phone,omitempty"`

	// Reputation & Stats (Populated after contracts) - Using JSONB for flexibility
	Stats                    datatypes.JSON `gorm:"type:jsonb" json:"stats,omitempty"` // {no_of_projects_done, on_time_completion, reputation_score}
	CredibilityScore         int            `gorm:"default:0" json:"credibility_score"`                      // 0-1000 overall score
	ScoreTier                string         `gorm:"type:varchar(40);default:'Starter'" json:"score_tier"`     // Tier label
	DimensionScores          datatypes.JSON `gorm:"type:jsonb" json:"dimension_scores,omitempty"`             // 6-dimension breakdown

	// Projects (Added after contract completion) - Using JSONB for nested documents
	Projects datatypes.JSON `gorm:"type:jsonb" json:"projects,omitempty"` // Array of project objects

	// Testimonials (Added after project completion) - Using JSONB
	Testimonials datatypes.JSON `gorm:"type:jsonb" json:"testimonials,omitempty"` // Array of testimonial objects

	// Portfolio Items (Legacy - for backward compatibility) - Using JSONB
	Portfolio datatypes.JSON `gorm:"type:jsonb" json:"portfolio,omitempty"` // Array of portfolio items

	// Client-specific fields (if role is client or both)
	CompanyName string `gorm:"type:varchar(100)" json:"company_name,omitempty"`

	// Public profile: ourdomain.com/user_name (unique when set; empty = not set, unique index)
	UserName string `gorm:"type:varchar(50);index" json:"user_name,omitempty"`

	// Visibility: what to show on public profile
	ShowProfile  bool `gorm:"default:true" json:"show_profile"`   // main profile
	ShowProjects bool `gorm:"default:true" json:"show_projects"`  // projects section
	ShowContracts bool `gorm:"default:false" json:"show_contracts"` // contracts section (when integrated)

	// Metadata
	IsActive          bool           `gorm:"default:true" json:"is_active"`
	IsVerified        bool           `gorm:"default:false" json:"is_verified"`         // Email/Phone verification
	IsProfileComplete bool           `gorm:"default:false" json:"is_profile_complete"` // All required fields filled
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name
func (User) TableName() string {
	return "users"
}

// Project represents a completed project (stored as JSONB in PostgreSQL)
type Project struct {
	ID          string `json:"id"` // UUID string
	ProjectName string `json:"project_name"`
	Description string `json:"description,omitempty"`

	// Media Links (Flexible for different freelancer types)
	Screenshots []string      `json:"screenshots,omitempty"` // Image URLs
	GitHubLink  string        `json:"github_link,omitempty"`
	LiveLink    string        `json:"live_link,omitempty"`   // Live project URL
	DriveLink   string        `json:"drive_link,omitempty"`  // Google Drive/Dropbox
	VideoLink   string        `json:"video_link,omitempty"`  // For video editors
	OtherLinks  []ProjectLink `json:"other_links,omitempty"` // Flexible for future links

	Technologies  []string `json:"technologies,omitempty"`
	ClientName    string   `json:"client_name,omitempty"`
	CompletedDate string   `json:"completed_date,omitempty"` // ISO 8601 string
	CreatedAt     string   `json:"created_at"`               // ISO 8601 string
	UpdatedAt     string   `json:"updated_at"`               // ISO 8601 string
}

// ProjectLink represents additional project links (flexible structure)
type ProjectLink struct {
	Label string `json:"label"` // e.g., "Figma Design", "Behance", "Dribbble"
	URL   string `json:"url"`
}

// Testimonial represents a client testimonial (stored as JSONB)
type Testimonial struct {
	ID          string `json:"id"` // UUID string
	ClientName  string `json:"client_name"`
	ClientEmail string `json:"client_email,omitempty"`
	Rating      int    `json:"rating"` // 1-10
	Comment     string `json:"comment"`
	ProjectName string `json:"project_name,omitempty"`
	IsVerified  bool   `json:"is_verified"` // From verified client
	CreatedAt   string `json:"created_at"`  // ISO 8601 string
}

// PortfolioItem represents a portfolio entry (legacy - stored as JSONB)
type PortfolioItem struct {
	ID           string   `json:"id"` // UUID string
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	URL          string   `json:"url"`
	ImageURL     string   `json:"image_url,omitempty"`
	Technologies []string `json:"technologies,omitempty"`
	CreatedAt    string   `json:"created_at"` // ISO 8601 string
}

// UserRole constants
const (
	RoleFreelancer = "freelancer"
	RoleClient     = "client"
	RoleBoth       = "both"
)

// Availability constants
const (
	AvailabilityFullTime    = "full-time"
	AvailabilityPartTime    = "part-time"
	AvailabilityAvailable   = "available"
	AvailabilityUnavailable = "unavailable"
)

// CompanySize constants
const (
	CompanySizeStartup = "startup"
	CompanySizeSmall   = "small"
	CompanySizeMedium  = "medium"
	CompanySizeLarge   = "large"
)
