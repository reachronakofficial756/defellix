package domain

import (
	"time"

	"gorm.io/gorm"
)

// Wallet represents a custodial wallet managed by the backend for a user (freelancer or client)
type Wallet struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"` // from auth-service users.id
	UserType  string    `gorm:"type:varchar(20);not null;index" json:"user_type"` // "freelancer" or "client"
	Address   string    `gorm:"type:varchar(42);uniqueIndex;not null" json:"address"` // Ethereum address (0x...)
	EncryptedPrivateKey string `gorm:"type:text;not null" json:"-"` // Encrypted private key (never expose)
	Network   string    `gorm:"type:varchar(20);default:base_sepolia" json:"network"` // base_sepolia, base_mainnet
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name
func (Wallet) TableName() string {
	return "wallets"
}

// ContractRecord represents an on-chain contract record (written to Base L2)
type ContractRecord struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	ContractID      uint      `gorm:"index;not null" json:"contract_id"` // from contract-service contracts.id
	TransactionHash string    `gorm:"type:varchar(66);uniqueIndex;not null" json:"transaction_hash"` // 0x...
	TransactionID   string    `gorm:"type:varchar(66);index" json:"transaction_id"` // same as hash or separate ID
	BlockNumber     *uint64   `gorm:"type:bigint" json:"block_number,omitempty"`
	BlockHash       string    `gorm:"type:varchar(66)" json:"block_hash,omitempty"`
	GasUsed         *uint64   `gorm:"type:bigint" json:"gas_used,omitempty"`
	GasPrice        string    `gorm:"type:varchar(50)" json:"gas_price,omitempty"` // in wei
	Status          string    `gorm:"type:varchar(20);default:pending" json:"status"` // pending, confirmed, failed
	Network         string    `gorm:"type:varchar(20);default:base_sepolia" json:"network"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name
func (ContractRecord) TableName() string {
	return "contract_records"
}
