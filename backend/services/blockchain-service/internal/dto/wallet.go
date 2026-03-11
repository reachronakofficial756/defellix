package dto

// CreateWalletRequest is the payload for creating a wallet (internal, called by contract-service)
type CreateWalletRequest struct {
	UserID   uint   `json:"user_id" validate:"required"`
	UserType string `json:"user_type" validate:"required,oneof=freelancer client"`
}

// WalletResponse is the API response for a wallet (address only, never private key)
type WalletResponse struct {
	ID        uint   `json:"id"`
	UserID    uint   `json:"user_id"`
	UserType  string `json:"user_type"`
	Address   string `json:"address"`
	Network   string `json:"network"`
	CreatedAt string `json:"created_at"`
}

// GetWalletRequest is used to get wallet by user_id and user_type
type GetWalletRequest struct {
	UserID   uint   `json:"user_id" validate:"required"`
	UserType string `json:"user_type" validate:"required,oneof=freelancer client"`
}
