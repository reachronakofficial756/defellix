package domain

import (
	"time"

	"gorm.io/gorm"
)

// ContractStatus represents the lifecycle state of a contract
const (
	ContractStatusDraft   = "draft"
	ContractStatusSent    = "sent"
	ContractStatusPending = "pending" // client sent for review; freelancer can update and re-send
	ContractStatusSigned  = "signed"
	ContractStatusActive  = "active"
	ContractStatusDone    = "completed"
	ContractStatusCancel  = "cancelled"
)

// Contract represents a freelancer–client agreement
type Contract struct {
	ID               uint   `gorm:"primaryKey" json:"id"`
	FreelancerUserID uint   `gorm:"index;not null" json:"freelancer_user_id"`           // from auth-service users.id
	FreelancerName   string `gorm:"type:varchar(200)" json:"freelancer_name,omitempty"` // display name of the freelancer

	// Project details
	ProjectCategory    string     `gorm:"type:varchar(80);not null" json:"project_category"`
	ProjectName        string     `gorm:"type:varchar(200);not null" json:"project_name"`
	Description        string     `gorm:"type:text" json:"description"`
	DueDate            *time.Time `gorm:"type:timestamptz" json:"due_date,omitempty"`
	TotalAmount        float64    `gorm:"type:decimal(12,2);not null" json:"total_amount"`
	Currency           string     `gorm:"type:varchar(3);default:INR" json:"currency"`
	PRDFileURL         string     `gorm:"type:text" json:"prd_file_url,omitempty"`        // PRD PDF URL (IPFS later)
	SubmissionCriteria string     `gorm:"type:text" json:"submission_criteria,omitempty"` // submission criteria text

	// Client details
	ClientName        string `gorm:"type:varchar(120);not null" json:"client_name"`
	ClientCompanyName string `gorm:"type:varchar(120)" json:"client_company_name,omitempty"`
	ClientEmail       string `gorm:"type:varchar(255);not null" json:"client_email"`
	ClientPhone       string `gorm:"type:varchar(30)" json:"client_phone,omitempty"`
	ClientCountry     string `gorm:"type:varchar(100)" json:"client_country,omitempty"`

	// Terms
	TermsAndConditions     string     `gorm:"type:text" json:"terms_and_conditions,omitempty"`
	StartDate              *time.Time `gorm:"type:timestamptz" json:"start_date,omitempty"`
	RevisionPolicy         string     `gorm:"type:text" json:"revision_policy,omitempty"`
	OutOfScopeWork         string     `gorm:"type:text" json:"out_of_scope_work,omitempty"`
	IntellectualProperty   string     `gorm:"type:text" json:"intellectual_property,omitempty"`
	EstimatedDuration      string     `gorm:"type:varchar(100)" json:"estimated_duration,omitempty"`
	PaymentMethod          string     `gorm:"type:varchar(50)" json:"payment_method,omitempty"`
	AdvancePaymentRequired bool       `gorm:"default:false" json:"advance_payment_required"`
	AdvancePaymentAmount   float64    `gorm:"type:decimal(12,2);default:0.00" json:"advance_payment_amount,omitempty"`

	// Lifecycle
	Status    string     `gorm:"type:varchar(20);default:draft;index" json:"status"` // draft | sent | pending | signed | active | completed | cancelled
	IsRevised bool       `gorm:"default:false" json:"is_revised"`
	SentAt    *time.Time `gorm:"type:timestamptz" json:"sent_at,omitempty"`

	// Client view & actions (no auth): token set when contract is sent; used in /public/contracts/:token
	ClientViewToken      string     `gorm:"type:varchar(64);uniqueIndex" json:"client_view_token,omitempty"`
	ClientReviewComment  string     `gorm:"type:text" json:"client_review_comment,omitempty"` // set when client sends for review
	ClientSignedAt       *time.Time `gorm:"type:timestamptz" json:"client_signed_at,omitempty"`
	ClientCompanyAddress string     `gorm:"type:varchar(500)" json:"client_company_address,omitempty"` // required on sign: Remote | address | maps URL
	ClientSignMetadata   string     `gorm:"type:text" json:"-"`                                        // JSON: optional gst_number, business_email, instagram, linkedin etc.; flexible for later
	SignOTP              string     `gorm:"type:varchar(6)" json:"-"`
	OTPExpiresAt         *time.Time `gorm:"type:timestamptz" json:"-"`
	LastOTPSentAt        *time.Time `gorm:"type:timestamptz" json:"-"`
	// Blockchain metadata (set when contract is written to chain)
	BlockchainTxHash   string  `gorm:"type:varchar(66);index" json:"blockchain_tx_hash,omitempty"` // Transaction hash from Base L2
	BlockchainTxID     string  `gorm:"type:varchar(66)" json:"blockchain_tx_id,omitempty"`
	BlockchainBlockNum *uint64 `gorm:"type:bigint" json:"blockchain_block_num,omitempty"`
	BlockchainGasUsed  *uint64 `gorm:"type:bigint" json:"blockchain_gas_used,omitempty"`
	BlockchainNetwork  string  `gorm:"type:varchar(20)" json:"blockchain_network,omitempty"` // base_sepolia, base_mainnet
	BlockchainStatus   string  `gorm:"type:varchar(20)" json:"blockchain_status,omitempty"`  // pending, confirmed, failed

	// Visibility: show on public profile
	IsPublic bool `gorm:"default:false" json:"is_public"`

	DraftCount int64 `gorm:"-" json:"draft_count"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations (loaded when needed)
	Milestones []ContractMilestone `gorm:"foreignKey:ContractID" json:"milestones,omitempty"`
}

// TableName specifies the table name
func (Contract) TableName() string {
	return "contracts"
}

// ContractMilestone represents a single milestone (payment + deliverable)
type ContractMilestone struct {
	ID         uint `gorm:"primaryKey" json:"id"`
	ContractID uint `gorm:"index;not null" json:"contract_id"`
	OrderIndex int  `gorm:"not null" json:"order_index"` // 0-based

	Title       string     `gorm:"type:varchar(200);not null" json:"title"`
	Description string     `gorm:"type:text" json:"description,omitempty"`
	Amount      float64    `gorm:"type:decimal(12,2);not null" json:"amount"`
	DueDate     *time.Time `gorm:"type:timestamptz" json:"due_date,omitempty"`

	// Phase 8: Structured Deliverables
	SubmissionCriteria   string `gorm:"type:jsonb" json:"submission_criteria,omitempty"`
	CompletionCriteriaTC string `gorm:"type:text" json:"completion_criteria_tc,omitempty"`

	// Status (Week 5: submission/approval)
	Status string `gorm:"type:varchar(20);default:pending" json:"status"` // pending | submitted | approved | paid

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Populated at runtime
	LastDraftAt      *time.Time     `gorm:"-" json:"last_draft_at,omitempty"`
	LatestSubmission *Submission    `gorm:"-" json:"latest_submission,omitempty"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name
func (ContractMilestone) TableName() string {
	return "contract_milestones"
}
