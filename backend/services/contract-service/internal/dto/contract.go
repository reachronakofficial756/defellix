package dto

import "time"

// CreateContractRequest is the payload for creating or saving a contract as draft
type CreateContractRequest struct {
	// Project
	FreelancerName     string     `json:"freelancer_name,omitempty" validate:"omitempty,max=200"`
	ProjectCategory    string     `json:"project_category" validate:"required,max=80"`
	ProjectName        string     `json:"project_name" validate:"required,min=2,max=200"`
	Description        string     `json:"description" validate:"omitempty,max=5000"`
	DueDate            *time.Time `json:"due_date,omitempty"`
	TotalAmount        float64    `json:"total_amount" validate:"required,min=0"`
	Currency           string     `json:"currency" validate:"omitempty,len=3"`
	PRDFileURL         string     `json:"prd_file_url,omitempty" validate:"omitempty,url"`
	SubmissionCriteria string     `json:"submission_criteria,omitempty" validate:"omitempty,max=2000"`

	// Client
	ClientName        string `json:"client_name" validate:"required,max=120"`
	ClientCompanyName string `json:"client_company_name,omitempty" validate:"omitempty,max=120"`
	ClientEmail       string `json:"client_email" validate:"required,email"`
	ClientPhone       string `json:"client_phone,omitempty" validate:"omitempty,max=30"`
	ClientCountry     string `json:"client_country,omitempty" validate:"omitempty,max=100"`

	// Terms
	TermsAndConditions     string     `json:"terms_and_conditions,omitempty" validate:"omitempty,max=10000"`
	StartDate              *time.Time `json:"start_date,omitempty"`
	RevisionPolicy         string     `json:"revision_policy,omitempty" validate:"omitempty,max=5000"`
	OutOfScopeWork         string     `json:"out_of_scope_work,omitempty" validate:"omitempty,max=5000"`
	IntellectualProperty   string     `json:"intellectual_property,omitempty" validate:"omitempty,max=5000"`
	EstimatedDuration      string     `json:"estimated_duration,omitempty" validate:"omitempty,max=100"`
	PaymentMethod          string     `json:"payment_method,omitempty" validate:"omitempty,max=50"`
	AdvancePaymentRequired bool       `json:"advance_payment_required"`
	AdvancePaymentAmount   float64    `json:"advance_payment_amount,omitempty" validate:"omitempty,min=0"`

	// Milestones (at least one; first can be initial payment)
	Milestones []MilestoneInput `json:"milestones" validate:"required,min=1,dive"`
}

// MilestoneInput is one milestone in create/update payload
type MilestoneInput struct {
	Title             string     `json:"title" validate:"required,max=200"`
	Description       string     `json:"description,omitempty" validate:"omitempty,max=2000"`
	Amount            float64    `json:"amount" validate:"required,min=0"`
	DueDate           *time.Time `json:"due_date,omitempty"`
	SubmissionCriteria   interface{} `json:"submission_criteria,omitempty"`
	CompletionCriteriaTC string      `json:"completion_criteria_tc,omitempty" validate:"omitempty,max=10000"`
}

// UpdateContractRequest is the payload for updating a draft contract
type UpdateContractRequest struct {
	ProjectCategory    *string    `json:"project_category,omitempty" validate:"omitempty,max=80"`
	ProjectName        *string    `json:"project_name,omitempty" validate:"omitempty,max=200"`
	Description        *string    `json:"description,omitempty" validate:"omitempty,max=5000"`
	DueDate            *time.Time `json:"due_date,omitempty"`
	TotalAmount        *float64   `json:"total_amount,omitempty" validate:"omitempty,min=0"`
	Currency           *string    `json:"currency,omitempty" validate:"omitempty,len=3"`
	PRDFileURL         *string    `json:"prd_file_url,omitempty" validate:"omitempty,url"`
	SubmissionCriteria *string    `json:"submission_criteria,omitempty" validate:"omitempty,max=2000"`
	ClientName         *string    `json:"client_name,omitempty" validate:"omitempty,max=120"`
	ClientCompanyName  *string    `json:"client_company_name,omitempty" validate:"omitempty,max=120"`
	ClientEmail        *string    `json:"client_email,omitempty" validate:"omitempty,email"`
	ClientPhone            *string    `json:"client_phone,omitempty" validate:"omitempty,max=30"`
	ClientCountry          *string    `json:"client_country,omitempty" validate:"omitempty,max=100"`
	TermsAndConditions     *string    `json:"terms_and_conditions,omitempty" validate:"omitempty,max=10000"`
	StartDate              *time.Time `json:"start_date,omitempty"`
	RevisionPolicy         *string    `json:"revision_policy,omitempty" validate:"omitempty,max=5000"`
	OutOfScopeWork         *string    `json:"out_of_scope_work,omitempty" validate:"omitempty,max=5000"`
	IntellectualProperty   *string    `json:"intellectual_property,omitempty" validate:"omitempty,max=5000"`
	EstimatedDuration      *string    `json:"estimated_duration,omitempty" validate:"omitempty,max=100"`
	PaymentMethod          *string    `json:"payment_method,omitempty" validate:"omitempty,max=50"`
	AdvancePaymentRequired *bool      `json:"advance_payment_required,omitempty"`
	AdvancePaymentAmount   *float64   `json:"advance_payment_amount,omitempty" validate:"omitempty,min=0"`
	Milestones             []UpdateMilestoneInput `json:"milestones,omitempty" validate:"omitempty,dive"`
}

// UpdateMilestoneInput is for modifying milestones via PUT
type UpdateMilestoneInput struct {
	ID                *uint      `json:"id,omitempty"`
	Title             *string    `json:"title,omitempty" validate:"omitempty,max=200"`
	Description       *string    `json:"description,omitempty" validate:"omitempty,max=2000"`
	Amount            *float64   `json:"amount,omitempty" validate:"omitempty,min=0"`
	DueDate           *time.Time `json:"due_date,omitempty"`
	SubmissionCriteria   interface{} `json:"submission_criteria,omitempty"`
	CompletionCriteriaTC *string     `json:"completion_criteria_tc,omitempty" validate:"omitempty,max=10000"`
}

// ContractResponse is the API response for a contract (with milestones)
type ContractResponse struct {
	ID                 uint                 `json:"id"`
	FreelancerUserID   uint                 `json:"freelancer_user_id"`
	ProjectCategory    string               `json:"project_category"`
	ProjectName        string               `json:"project_name"`
	Description        string               `json:"description"`
	DueDate            *time.Time           `json:"due_date,omitempty"`
	TotalAmount        float64              `json:"total_amount"`
	Currency           string               `json:"currency"`
	PRDFileURL         string               `json:"prd_file_url,omitempty"`
	SubmissionCriteria string               `json:"submission_criteria,omitempty"`
	ClientName         string               `json:"client_name"`
	ClientCompanyName  string               `json:"client_company_name,omitempty"`
	ClientEmail        string               `json:"client_email"`
	ClientPhone            string               `json:"client_phone,omitempty"`
	ClientCountry          string               `json:"client_country,omitempty"`
	TermsAndConditions     string               `json:"terms_and_conditions,omitempty"`
	StartDate              *time.Time           `json:"start_date,omitempty"`
	RevisionPolicy         string               `json:"revision_policy,omitempty"`
	OutOfScopeWork         string               `json:"out_of_scope_work,omitempty"`
	IntellectualProperty   string               `json:"intellectual_property,omitempty"`
	EstimatedDuration      string               `json:"estimated_duration,omitempty"`
	PaymentMethod          string               `json:"payment_method,omitempty"`
	AdvancePaymentRequired bool                 `json:"advance_payment_required"`
	AdvancePaymentAmount   float64              `json:"advance_payment_amount,omitempty"`
	Status                 string               `json:"status"`
	IsRevised          bool                 `json:"is_revised"`
	SentAt             *time.Time           `json:"sent_at,omitempty"`
	ShareableLink      string               `json:"shareable_link,omitempty"` // Set when status is sent; base URL + /:id
	ClientReviewComment string              `json:"client_review_comment,omitempty"`
	Milestones         []MilestoneResponse  `json:"milestones,omitempty"`
	CreatedAt          time.Time            `json:"created_at"`
	UpdatedAt          time.Time            `json:"updated_at"`
}

// MilestoneResponse is one milestone in API response
type MilestoneResponse struct {
	ID                uint       `json:"id"`
	OrderIndex        int        `json:"order_index"`
	Title             string     `json:"title"`
	Description       string     `json:"description,omitempty"`
	Amount            float64    `json:"amount"`
	DueDate           *time.Time `json:"due_date,omitempty"`
	SubmissionCriteria   interface{} `json:"submission_criteria,omitempty"`
	CompletionCriteriaTC string      `json:"completion_criteria_tc,omitempty"`
	Status            string     `json:"status"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// ListContractsQuery is used for GET /contracts query params
type ListContractsQuery struct {
	Status string `json:"status"` // draft, sent, ...
	Page   int    `json:"page"`
	Limit  int    `json:"limit"`
}

// PublicContractViewResponse is returned by GET /api/v1/public/contracts/:token (no auth). Safe for client view.
type PublicContractViewResponse struct {
	ID                  uint                 `json:"id"`
	FreelancerName      string               `json:"freelancer_name,omitempty"` // display name of the service provider
	ProjectCategory     string               `json:"project_category"`
	ProjectName         string               `json:"project_name"`
	Description         string               `json:"description"`
	DueDate             *time.Time           `json:"due_date,omitempty"`
	TotalAmount         float64              `json:"total_amount"`
	Currency            string               `json:"currency"`
	PRDFileURL          string               `json:"prd_file_url,omitempty"`
	SubmissionCriteria  string               `json:"submission_criteria,omitempty"`
	ClientName          string               `json:"client_name"`
	ClientCompanyName   string               `json:"client_company_name,omitempty"`
	ClientEmail         string               `json:"client_email"`
	ClientPhone            string               `json:"client_phone,omitempty"`
	ClientCountry          string               `json:"client_country,omitempty"`
	TermsAndConditions     string               `json:"terms_and_conditions,omitempty"`
	StartDate              *time.Time           `json:"start_date,omitempty"`
	RevisionPolicy         string               `json:"revision_policy,omitempty"`
	OutOfScopeWork         string               `json:"out_of_scope_work,omitempty"`
	IntellectualProperty   string               `json:"intellectual_property,omitempty"`
	EstimatedDuration      string               `json:"estimated_duration,omitempty"`
	PaymentMethod          string               `json:"payment_method,omitempty"`
	AdvancePaymentRequired bool                 `json:"advance_payment_required"`
	AdvancePaymentAmount   float64              `json:"advance_payment_amount,omitempty"`
	Status                 string               `json:"status"`
	IsRevised           bool                 `json:"is_revised"`
	SentAt              *time.Time           `json:"sent_at,omitempty"`
	ClientReviewComment string               `json:"client_review_comment,omitempty"` // set when status is pending
	Milestones          []MilestoneResponse  `json:"milestones"`
	CreatedAt           time.Time            `json:"created_at"`
	UpdatedAt           time.Time            `json:"updated_at"`
}

// SendForReviewRequest is the body for POST /api/v1/public/contracts/:token/send-for-review
type SendForReviewRequest struct {
	Comment string `json:"comment" validate:"required,max=2000"`
}

// SignRequest is the body for POST /api/v1/public/contracts/:token/sign
// CompanyAddress is required: "Remote" | full address | Google Maps URL. GST and other fields optional (flexible for later).
type SignRequest struct {
	OTP            string `json:"otp" validate:"required,len=6"`
	CompanyAddress string `json:"company_address" validate:"required,max=500"`
	Email          string `json:"email,omitempty" validate:"omitempty,email,max=255"`
	Phone          string `json:"phone,omitempty" validate:"omitempty,max=30"`
	CompanyName    string `json:"company_name,omitempty" validate:"omitempty,max=120"`
	GSTNumber      string `json:"gst_number,omitempty" validate:"omitempty,max=20"`
	BusinessEmail  string `json:"business_email,omitempty" validate:"omitempty,email,max=255"`
	Instagram      string `json:"instagram,omitempty" validate:"omitempty,max=100"`
	LinkedIn       string `json:"linkedin,omitempty" validate:"omitempty,url,max=300"`
}

// SendOTPRequest is payload for generating contract sign OTP
type SendOTPRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// ExtractFromPRDRequest is the payload for POST /api/v1/contracts/extract-from-prd
type ExtractFromPRDRequest struct {
	PRDFileURL string `json:"prd_file_url" validate:"required,url"`
}

// ExtractedClient holds client details extracted from PRD
type ExtractedClient struct {
	Name    string `json:"name,omitempty"`
	Email   string `json:"email,omitempty"`
	Phone   string `json:"phone,omitempty"`
	Company string `json:"company,omitempty"`
	Country string `json:"country,omitempty"`
}

// ExtractedContract is the response from POST /api/v1/contracts/extract-from-prd
type ExtractedContract struct {
	ProjectTitle       string          `json:"project_title,omitempty"`
	ProjectType        string          `json:"project_type,omitempty"`
	ProjectDescription string          `json:"project_description,omitempty"`
	TermsAndConditions string          `json:"terms_and_conditions,omitempty"`
	StartDate          string          `json:"start_date,omitempty"`  // YYYY-MM-DD
	Deadline           string          `json:"deadline,omitempty"`    // YYYY-MM-DD
	Client             ExtractedClient `json:"client,omitempty"`
	Scope              string          `json:"scope,omitempty"`
	Deliverables       string          `json:"deliverables,omitempty"`
	PaymentTerms       string          `json:"payment_terms,omitempty"`
}
