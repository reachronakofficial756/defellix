package dto

// WriteContractRequest is the payload for writing a contract to blockchain
type WriteContractRequest struct {
	ContractID      uint    `json:"contract_id" validate:"required"`
	FreelancerID    uint    `json:"freelancer_id" validate:"required"`
	ClientID        uint    `json:"client_id,omitempty"` // 0 if client not a platform user
	FreelancerEmail string  `json:"freelancer_email,omitempty" validate:"omitempty,email"`
	ClientEmail     string  `json:"client_email" validate:"required,email"`
	TotalAmount     float64 `json:"total_amount" validate:"required,min=0"`
	Currency        string  `json:"currency" validate:"required"`
	DueDate         string  `json:"due_date,omitempty"` // ISO 8601
	ProjectName     string  `json:"project_name" validate:"required"`
	ContractHash    string  `json:"contract_hash" validate:"required"` // Hash of contract details for verification
}

// WriteContractResponse is returned after writing contract to chain
type WriteContractResponse struct {
	ContractID      uint   `json:"contract_id"`
	TransactionHash string `json:"transaction_hash"`
	TransactionID   string `json:"transaction_id"`
	BlockNumber     *uint64 `json:"block_number,omitempty"`
	GasUsed         *uint64 `json:"gas_used,omitempty"`
	Status          string `json:"status"` // pending, confirmed
	Network         string `json:"network"`
	CreatedAt       string `json:"created_at"`
}

// GetContractRecordRequest is used to get contract record by contract_id
type GetContractRecordRequest struct {
	ContractID uint `json:"contract_id" validate:"required"`
}
