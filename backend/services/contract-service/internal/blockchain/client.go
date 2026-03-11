package blockchain

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client calls blockchain-service to write contracts to chain
type Client interface {
	WriteContract(ctx context.Context, req WriteContractRequest) (*WriteContractResponse, error)
}

// WriteContractRequest matches blockchain-service DTO
type WriteContractRequest struct {
	ContractID      uint    `json:"contract_id"`
	FreelancerID    uint    `json:"freelancer_id"`
	ClientID        uint    `json:"client_id"` // 0 if client not a platform user
	FreelancerEmail string  `json:"freelancer_email"`
	ClientEmail     string  `json:"client_email"`
	TotalAmount     float64 `json:"total_amount"`
	Currency        string  `json:"currency"`
	DueDate         string  `json:"due_date,omitempty"`
	ProjectName     string  `json:"project_name"`
	ContractHash    string  `json:"contract_hash"`
}

// WriteContractResponse matches blockchain-service DTO
type WriteContractResponse struct {
	ContractID      uint    `json:"contract_id"`
	TransactionHash string  `json:"transaction_hash"`
	TransactionID   string  `json:"transaction_id"`
	BlockNumber     *uint64 `json:"block_number,omitempty"`
	GasUsed         *uint64 `json:"gas_used,omitempty"`
	Status          string  `json:"status"`
	Network         string  `json:"network"`
	CreatedAt       string  `json:"created_at"`
}

type httpClient struct {
	baseURL string
	apiKey  string
	client  *http.Client
}

// NewClient creates a blockchain client
func NewClient(baseURL, apiKey string) Client {
	if baseURL == "" {
		return &noopClient{} // No-op if URL not set
	}
	return &httpClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *httpClient) WriteContract(ctx context.Context, req WriteContractRequest) (*WriteContractResponse, error) {
	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/api/v1/blockchain/contracts", bytes.NewReader(reqBody))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// For service-to-service auth, use API key if provided, otherwise rely on blockchain-service's auth middleware
	// TODO: In production, use a proper service-to-service auth mechanism (API key, mTLS, etc.)
	if c.apiKey != "" {
		httpReq.Header.Set("X-API-Key", c.apiKey)
	}

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		var errResp struct {
			Error   string `json:"error"`
			Message string `json:"message"`
			Code    string `json:"code"`
		}
		_ = json.Unmarshal(body, &errResp)
		return nil, fmt.Errorf("blockchain-service error [%d]: %s", resp.StatusCode, errResp.Message)
	}

	var wrapper struct {
		Data WriteContractResponse `json:"data"`
	}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	return &wrapper.Data, nil
}

// noopClient does nothing (when blockchain-service URL not configured)
type noopClient struct{}

func (n *noopClient) WriteContract(context.Context, WriteContractRequest) (*WriteContractResponse, error) {
	return nil, fmt.Errorf("blockchain-service not configured (BLOCKCHAIN_SERVICE_URL not set)")
}

// ComputeContractHash computes a deterministic hash of contract details for on-chain verification
func ComputeContractHash(contractID uint, freelancerEmail, clientEmail string, totalAmount float64, currency, projectName string, dueDate *time.Time) string {
	data := map[string]interface{}{
		"contract_id":      contractID,
		"freelancer_email": freelancerEmail,
		"client_email":     clientEmail,
		"total_amount":     totalAmount,
		"currency":         currency,
		"project_name":     projectName,
	}
	if dueDate != nil {
		data["due_date"] = dueDate.Format(time.RFC3339)
	}
	jsonBytes, _ := json.Marshal(data)
	hash := sha256.Sum256(jsonBytes)
	return hex.EncodeToString(hash[:])
}
