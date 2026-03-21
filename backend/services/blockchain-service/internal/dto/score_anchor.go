package dto

// AnchorScoreRequest is the payload for anchoring a credibility score on-chain
type AnchorScoreRequest struct {
	UserID          uint   `json:"user_id" validate:"required"`
	DimensionScores string `json:"dimension_scores" validate:"required"` // JSON string
	OverallScore    int    `json:"overall_score" validate:"required"`
	ScoreTier       string `json:"score_tier" validate:"required"`
	Timestamp       string `json:"timestamp" validate:"required"` // ISO 8601
	ScoreHash       string `json:"score_hash" validate:"required"` // SHA-256 hex
}

// AnchorScoreResponse is returned after anchoring a score
type AnchorScoreResponse struct {
	UserID          uint    `json:"user_id"`
	ScoreHash       string  `json:"score_hash"`
	TransactionHash string  `json:"transaction_hash"`
	BlockNumber     *uint64 `json:"block_number,omitempty"`
	GasUsed         *uint64 `json:"gas_used,omitempty"`
	Status          string  `json:"status"`
	Network         string  `json:"network"`
	CreatedAt       string  `json:"created_at"`
}
