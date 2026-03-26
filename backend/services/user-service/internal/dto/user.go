package dto

// UpdateProfileRequest is defined in profile.go to avoid duplication

// AddSkillRequest represents the request to add a skill
type AddSkillRequest struct {
	Skill string `json:"skill" validate:"required,min=2,max=50"`
}

// RemoveSkillRequest represents the request to remove a skill
type RemoveSkillRequest struct {
	Skill string `json:"skill" validate:"required"`
}

// AddPortfolioRequest represents the request to add a portfolio item
type AddPortfolioRequest struct {
	Title        string   `json:"title" validate:"required,min=2,max=100"`
	Description  string   `json:"description" validate:"required,min=10,max=1000"`
	URL          string   `json:"url" validate:"required,url"`
	ImageURL     string   `json:"image_url,omitempty" validate:"omitempty,url"`
	Technologies []string `json:"technologies,omitempty"`
}

// UpdatePortfolioRequest represents the request to update a portfolio item
type UpdatePortfolioRequest struct {
	Title        string   `json:"title,omitempty" validate:"omitempty,min=2,max=100"`
	Description  string   `json:"description,omitempty" validate:"omitempty,min=10,max=1000"`
	URL          string   `json:"url,omitempty" validate:"omitempty,url"`
	ImageURL     string   `json:"image_url,omitempty" validate:"omitempty,url"`
	Technologies []string `json:"technologies,omitempty"`
}

// SearchRequest represents the search query
type SearchRequest struct {
	Query       string   `json:"query,omitempty"`        // Search in name, bio, skills
	Skills      []string `json:"skills,omitempty"`      // Filter by skills
	Role        string   `json:"role,omitempty"`         // Filter by role
	MinRate     *float64 `json:"min_rate,omitempty"`     // Minimum hourly rate
	MaxRate     *float64 `json:"max_rate,omitempty"`     // Maximum hourly rate
	Location    string   `json:"location,omitempty"`     // Filter by location
	Availability string  `json:"availability,omitempty"` // Filter by availability
	Page        int      `json:"page,omitempty"`         // Page number (default: 1)
	Limit       int      `json:"limit,omitempty"`        // Results per page (default: 20, max: 100)
}

// UserResponse represents the user profile response
type UserResponse struct {
	ID            string          `json:"id"`
	Email         string          `json:"email"`
	UserName      string          `json:"user_name,omitempty"` // for ourdomain.com/user_name
	FullName      string          `json:"full_name"`
	WhatDoYouDo   string          `json:"what_do_you_do,omitempty"`
	Photo         string          `json:"photo,omitempty"`
	ShortHeadline string          `json:"short_headline,omitempty"`
	Role          string          `json:"role"`
	Bio           string          `json:"bio,omitempty"`
	Location      string          `json:"location,omitempty"`
	Experience    string          `json:"experience,omitempty"`
	Phone         string          `json:"phone,omitempty"`
	
	// Social links
	GitHubLink    string          `json:"github_link,omitempty"`
	LinkedInLink  string          `json:"linkedin_link,omitempty"`
	PortfolioLink string          `json:"portfolio_link,omitempty"`
	InstagramLink string          `json:"instagram_link,omitempty"`
	
	// Skills and portfolio
	Skills        []string        `json:"skills,omitempty"`
	Portfolio     []PortfolioItem `json:"portfolio,omitempty"` // Legacy
	Projects      []ProjectResponse `json:"projects,omitempty"` // New projects array
	
	// Professional details
	HourlyRate    *float64        `json:"hourly_rate,omitempty"`
	Availability  string          `json:"availability,omitempty"`
	
	// Stats (populated after contracts)
	NoOfProjectsDone int          `json:"no_of_projects_done,omitempty"`
	OnTimeCompletion  float64      `json:"on_time_completion,omitempty"`
	ReputationScore   float64      `json:"reputation_score,omitempty"`

	// Credibility Score (Hybrid C+D algorithm)
	CredibilityScore  int                    `json:"credibility_score"`
	ScoreTier         string                 `json:"score_tier"`
	DimensionScores   map[string]int         `json:"dimension_scores,omitempty"`

	// Testimonials
	Testimonials  []TestimonialResponse `json:"testimonials,omitempty"`
	
	// Client fields
	CompanyName   string          `json:"company_name,omitempty"`
	CompanySize   string          `json:"company_size,omitempty"`
	
	// Visibility (owner only; what is shown on public profile)
	ShowProfile   bool `json:"show_profile,omitempty"`
	ShowProjects  bool `json:"show_projects,omitempty"`
	ShowContracts bool `json:"show_contracts,omitempty"`

	// Metadata
	IsActive          bool   `json:"is_active"`
	IsVerified        bool   `json:"is_verified"`
	IsProfileComplete bool   `json:"is_profile_complete"`
	CreatedAt         string `json:"created_at"`
	UpdatedAt         string `json:"updated_at"`
}

// PublicProfileResponse is returned by GET /api/v1/public/profile/:user_name
// Only includes sections allowed by visibility; excludes email/phone.
type PublicProfileResponse struct {
	UserName      string               `json:"user_name"`
	FullName      string               `json:"full_name,omitempty"`
	WhatDoYouDo   string               `json:"what_do_you_do,omitempty"`
	Photo         string               `json:"photo,omitempty"`
	ShortHeadline string               `json:"short_headline,omitempty"`
	Role          string               `json:"role,omitempty"`
	Bio           string               `json:"bio,omitempty"`
	Location      string               `json:"location,omitempty"`
	Experience    string               `json:"experience,omitempty"`
	GitHubLink    string               `json:"github_link,omitempty"`
	LinkedInLink  string               `json:"linkedin_link,omitempty"`
	PortfolioLink string               `json:"portfolio_link,omitempty"`
	InstagramLink string               `json:"instagram_link,omitempty"`
	Skills        []string             `json:"skills,omitempty"`
	HourlyRate    *float64             `json:"hourly_rate,omitempty"`
	Availability             string               `json:"availability,omitempty"`
	AggregateReputationScore int                  `json:"aggregate_reputation_score,omitempty"`
	CredibilityScore         int                  `json:"credibility_score"`
	ScoreTier                string               `json:"score_tier,omitempty"`
	Projects                 []ProjectResponse    `json:"projects,omitempty"` // only if show_projects
	Contracts                []ContractSummary    `json:"contracts,omitempty"` // only if show_projects
}

// ContractSummary represents a verified contract shown on public profile
type ContractSummary struct {
	ID               uint    `json:"id"`
	ProjectName      string  `json:"project_name"`
	ProjectCategory  string  `json:"project_category"`
	ClientName       string  `json:"client_name"`
	ClientCompany    string  `json:"client_company,omitempty"`
	CompletedDate    string  `json:"completed_date,omitempty"` // YYYY-MM-DD
	Deadline         string  `json:"deadline,omitempty"`
	TotalAmount      float64                      `json:"total_amount"`
	Currency         string                       `json:"currency"`
	ReputationScore  float64                      `json:"reputation_score,omitempty"`
	Rating           float64                      `json:"rating,omitempty"`
	Status           string                       `json:"status"`
	PRDFileURL       string                       `json:"prd_file_url,omitempty"`
	Milestones       []ContractMilestoneSummary   `json:"milestones,omitempty"`
}

type ContractMilestoneSummary struct {
	Title            string                     `json:"title"`
	Amount           float64                    `json:"amount"`
	Status           string                     `json:"status"`
	LatestSubmission *ContractSubmissionSummary `json:"latest_submission,omitempty"`
}

type ContractSubmissionSummary struct {
	Status        string                 `json:"status"`
	SubmittedData map[string]interface{} `json:"submitted_data,omitempty"`
	Description   string                 `json:"description,omitempty"`
}

// ProjectResponse represents a project in API response
type ProjectResponse struct {
	ID            string          `json:"id"`
	ProjectName   string          `json:"project_name"`
	Description   string          `json:"description,omitempty"`
	Screenshots   []string        `json:"screenshots,omitempty"`
	GitHubLink    string          `json:"github_link,omitempty"`
	LiveLink      string          `json:"live_link,omitempty"`
	DriveLink     string          `json:"drive_link,omitempty"`
	VideoLink     string          `json:"video_link,omitempty"`
	OtherLinks    []ProjectLink   `json:"other_links,omitempty"`
	Technologies  []string        `json:"technologies,omitempty"`
	ClientName    string          `json:"client_name,omitempty"`
	CompletedDate string          `json:"completed_date,omitempty"`
	CreatedAt     string          `json:"created_at"`
	UpdatedAt     string          `json:"updated_at"`
}

// TestimonialResponse represents a testimonial in API response
type TestimonialResponse struct {
	ID          string `json:"id"`
	ClientName  string `json:"client_name"`
	Rating      int    `json:"rating"`
	Comment     string `json:"comment"`
	ProjectName string `json:"project_name,omitempty"`
	IsVerified  bool   `json:"is_verified"`
	CreatedAt   string `json:"created_at"`
}

// PortfolioItem represents a portfolio entry in response
type PortfolioItem struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	URL         string   `json:"url"`
	ImageURL    string   `json:"image_url,omitempty"`
	Technologies []string `json:"technologies,omitempty"`
	CreatedAt   string   `json:"created_at"`
}

// SearchResponse represents the search results
type SearchResponse struct {
	Users      []UserResponse `json:"users"`
	Total      int64                 `json:"total"`
	Page       int                   `json:"page"`
	Limit      int                   `json:"limit"`
	TotalPages int                   `json:"total_pages"`
}

