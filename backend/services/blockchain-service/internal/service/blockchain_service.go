package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/saiyam0211/defellix/services/blockchain-service/internal/domain"
	"github.com/saiyam0211/defellix/services/blockchain-service/internal/dto"
	"github.com/saiyam0211/defellix/services/blockchain-service/internal/repository"
	"github.com/saiyam0211/defellix/services/blockchain-service/pkg/wallet"
)

var (
	ErrContractAlreadyOnChain = errors.New("contract already recorded on blockchain")
)

type BlockchainService struct {
	contractRepo     repository.ContractRecordRepository
	walletRepo       repository.WalletRepository
	scoreAnchorRepo  repository.ScoreAnchorRepository
	rpcURL           string
	chainID          int64
	encryptionKey    string
	masterPrivateKey string
	network          string
}

func NewBlockchainService(
	contractRepo repository.ContractRecordRepository,
	walletRepo repository.WalletRepository,
	scoreAnchorRepo repository.ScoreAnchorRepository,
	rpcURL string,
	chainID int64,
	encryptionKey string,
	masterPrivateKey string,
	network string,
) *BlockchainService {
	return &BlockchainService{
		contractRepo:     contractRepo,
		walletRepo:       walletRepo,
		scoreAnchorRepo:  scoreAnchorRepo,
		rpcURL:           rpcURL,
		chainID:          chainID,
		encryptionKey:    encryptionKey,
		masterPrivateKey: masterPrivateKey,
		network:          network,
	}
}

// WriteContractToChain writes contract details to Base L2 blockchain
// For now, this is a mock/testnet implementation. Replace with real Base L2 RPC calls when ready.
func (s *BlockchainService) WriteContractToChain(ctx context.Context, req *dto.WriteContractRequest) (*dto.WriteContractResponse, error) {
	// Check if contract already on chain
	existing, err := s.contractRepo.GetByContractID(ctx, req.ContractID)
	if err == nil && existing != nil {
		return nil, ErrContractAlreadyOnChain
	}
	if err != nil && !errors.Is(err, repository.ErrContractRecordNotFound) {
		return nil, err
	}

	// Get freelancer wallet (required for signing transaction), auto-create if missing
	freelancerWallet, err := s.walletRepo.GetByUserIDAndType(ctx, req.FreelancerID, "freelancer")
	if err != nil {
		if errors.Is(err, repository.ErrWalletNotFound) {
			address, privateKeyHex, errGen := wallet.GenerateWallet()
			if errGen != nil {
				return nil, fmt.Errorf("failed to generate freelancer wallet: %w", errGen)
			}
			encryptedKey, errEnc := wallet.EncryptPrivateKey(privateKeyHex, s.encryptionKey)
			if errEnc != nil {
				return nil, fmt.Errorf("failed to encrypt private key: %w", errEnc)
			}
			freelancerWallet = &domain.Wallet{
				UserID:              req.FreelancerID,
				UserType:            "freelancer",
				Address:             address,
				EncryptedPrivateKey: encryptedKey,
				Network:             s.network,
				CreatedAt:           time.Now(),
				UpdatedAt:           time.Now(),
			}
			if errCreate := s.walletRepo.Create(ctx, freelancerWallet); errCreate != nil {
				return nil, fmt.Errorf("failed to create freelancer wallet: %w", errCreate)
			}
		} else {
			return nil, fmt.Errorf("freelancer wallet lookup failed: %w", err)
		}
	}

	// Get client wallet if client is a platform user
	var clientAddress string
	if req.ClientID > 0 {
		clientWallet, err := s.walletRepo.GetByUserIDAndType(ctx, req.ClientID, "client")
		if err == nil {
			clientAddress = clientWallet.Address
		}
	}

	// Prepare contract data for on-chain storage
	contractData := map[string]interface{}{
		"contract_id":      req.ContractID,
		"freelancer_id":    req.FreelancerID,
		"freelancer_email": req.FreelancerEmail,
		"client_email":     req.ClientEmail,
		"client_address":   clientAddress,
		"total_amount":     req.TotalAmount,
		"currency":         req.Currency,
		"due_date":         req.DueDate,
		"project_name":     req.ProjectName,
		"contract_hash":    req.ContractHash,
	}

	// Submit transaction to Base L2
	txHash, blockNumber, gasUsed, err := s.submitToBaseL2(ctx, freelancerWallet, contractData)
	if err != nil {
		return nil, fmt.Errorf("failed to submit to Base L2: %w", err)
	}

	// Create contract record with real transaction details
	cr := &domain.ContractRecord{
		ContractID:      req.ContractID,
		TransactionHash: txHash,
		TransactionID:   txHash, // Use tx hash as ID
		Status:          "confirmed",
		Network:         s.network,
		BlockNumber:     blockNumber,
		GasUsed:         gasUsed,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := s.contractRepo.Create(ctx, cr); err != nil {
		return nil, err
	}

	return s.toWriteContractResponse(cr), nil
}

// GetContractRecord retrieves contract record by contract ID
func (s *BlockchainService) GetContractRecord(ctx context.Context, contractID uint) (*dto.WriteContractResponse, error) {
	cr, err := s.contractRepo.GetByContractID(ctx, contractID)
	if err != nil {
		return nil, err
	}
	return s.toWriteContractResponse(cr), nil
}

// AnchorScoreToChain anchors a credibility score hash on Base L2
func (s *BlockchainService) AnchorScoreToChain(ctx context.Context, req *dto.AnchorScoreRequest) (*dto.AnchorScoreResponse, error) {
	// Prepare score data for on-chain storage
	scoreData := map[string]interface{}{
		"type":             "score_anchor",
		"user_id":          req.UserID,
		"overall_score":    req.OverallScore,
		"score_tier":       req.ScoreTier,
		"dimension_scores": req.DimensionScores,
		"timestamp":        req.Timestamp,
		"score_hash":       req.ScoreHash,
	}

	// We need a wallet for submitting; use a system/master wallet approach
	// Create a temporary wallet struct pointing to the master key
	masterWallet := &domain.Wallet{
		Address: "master",
	}

	txHash, blockNumber, gasUsed, err := s.submitToBaseL2(ctx, masterWallet, scoreData)
	if err != nil {
		return nil, fmt.Errorf("failed to anchor score on-chain: %w", err)
	}

	// Persist the anchor record
	anchor := &domain.ScoreAnchor{
		UserID:              req.UserID,
		ScoreHash:           req.ScoreHash,
		TransactionHash:     txHash,
		BlockNumber:         blockNumber,
		GasUsed:             gasUsed,
		OverallScore:        req.OverallScore,
		ScoreTier:           req.ScoreTier,
		DimensionScoresJSON: req.DimensionScores,
		Network:             s.network,
		Status:              "confirmed",
	}

	if err := s.scoreAnchorRepo.Create(ctx, anchor); err != nil {
		return nil, fmt.Errorf("failed to save score anchor: %w", err)
	}

	return &dto.AnchorScoreResponse{
		UserID:          anchor.UserID,
		ScoreHash:       anchor.ScoreHash,
		TransactionHash: anchor.TransactionHash,
		BlockNumber:     anchor.BlockNumber,
		GasUsed:         anchor.GasUsed,
		Status:          anchor.Status,
		Network:         anchor.Network,
		CreatedAt:       anchor.CreatedAt.Format(time.RFC3339),
	}, nil
}

// GetScoreAnchors retrieves score anchors for a user
func (s *BlockchainService) GetScoreAnchors(ctx context.Context, userID uint) ([]domain.ScoreAnchor, error) {
	return s.scoreAnchorRepo.GetByUserID(ctx, userID, 50)
}

// GetLatestScoreAnchor retrieves the latest score anchor for a user
func (s *BlockchainService) GetLatestScoreAnchor(ctx context.Context, userID uint) (*domain.ScoreAnchor, error) {
	return s.scoreAnchorRepo.GetLatestByUserID(ctx, userID)
}

// submitToBaseL2 submits contract data to Base L2 blockchain
// Returns: transaction hash, block number, gas used, error
func (s *BlockchainService) submitToBaseL2(ctx context.Context, freelancerWallet *domain.Wallet, contractData map[string]interface{}) (string, *uint64, *uint64, error) {
	// 1. Connect to Base L2 RPC (or mock if no RPC URL provided)
	log.Printf("[DEBUG] submitToBaseL2 triggered. s.rpcURL is: '%s'", s.rpcURL)
	if s.rpcURL == "" {
		// Mock Mode: Return a fake transaction response instead of hitting a real chain
		mockTxHash := common.BytesToHash(crypto.Keccak256([]byte(time.Now().String()))).Hex()
		mockBlockNum := uint64(12345678)
		mockGasUsed := uint64(21000)
		return mockTxHash, &mockBlockNum, &mockGasUsed, nil
	}

	client, err := ethclient.Dial(s.rpcURL)
	if err != nil {
		return "", nil, nil, fmt.Errorf("failed to connect to Base L2 RPC: %w", err)
	}
	defer client.Close()

	// 2. Load Master Wallet private key
	privateKey, err := crypto.HexToECDSA(s.masterPrivateKey)
	if err != nil {
		return "", nil, nil, fmt.Errorf("invalid master private key: %w", err)
	}

	// 3. Get account address and nonce
	fromAddress := crypto.PubkeyToAddress(privateKey.PublicKey)
	nonce, err := client.PendingNonceAt(ctx, fromAddress)
	if err != nil {
		return "", nil, nil, fmt.Errorf("failed to get nonce: %w", err)
	}

	// 3.5 Check master wallet balance
	balance, err := client.BalanceAt(ctx, fromAddress, nil)
	if err != nil {
		return "", nil, nil, fmt.Errorf("failed to check balance: %w", err)
	}
	if balance.Cmp(big.NewInt(0)) == 0 {
		return "", nil, nil, errors.New("master wallet has zero balance, please fund it with base sepolia eth")
	}

	// 4. Get gas price (use suggested gas price)
	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		return "", nil, nil, fmt.Errorf("failed to get gas price: %w", err)
	}

	// 5. Prepare transaction data (contract details as JSON in calldata)
	dataJSON, err := json.Marshal(contractData)
	if err != nil {
		return "", nil, nil, fmt.Errorf("failed to marshal contract data: %w", err)
	}
	data := []byte(dataJSON)

	// 6. Estimate gas limit
	gasLimit := uint64(100000) // Default gas limit, adjust as needed
	// Try to estimate gas if we have a contract address, otherwise use default
	if s.rpcURL != "" {
		msg := ethereum.CallMsg{
			From: fromAddress,
			To:   nil, // nil means contract creation, but we're just storing data
			Data: data,
		}
		estimatedGas, err := client.EstimateGas(ctx, msg)
		if err == nil {
			gasLimit = estimatedGas
		}
	}

	// 7. Create transaction
	// Using a zero address as recipient (we're storing data on-chain via calldata)
	// In production, you might deploy a smart contract and call it instead
	toAddress := common.HexToAddress("0x0000000000000000000000000000000000000000")
	
	tx := types.NewTransaction(
		nonce,
		toAddress,
		big.NewInt(0), // Value: 0 ETH (we're just storing data)
		gasLimit,
		gasPrice,
		data,
	)

	// 8. Sign transaction
	chainID := big.NewInt(s.chainID)
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		return "", nil, nil, fmt.Errorf("failed to sign transaction: %w", err)
	}

	// 9. Submit transaction
	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		return "", nil, nil, fmt.Errorf("failed to send transaction: %w", err)
	}

	txHash := signedTx.Hash().Hex()

	// 10. Wait for confirmation
	receipt, err := bind.WaitMined(ctx, client, signedTx)
	if err != nil {
		return "", nil, nil, fmt.Errorf("transaction failed or timeout: %w", err)
	}

	// 11. Extract transaction details
	blockNumber := receipt.BlockNumber.Uint64()
	gasUsed := receipt.GasUsed

	return txHash, &blockNumber, &gasUsed, nil
}

func (s *BlockchainService) toWriteContractResponse(cr *domain.ContractRecord) *dto.WriteContractResponse {
	return &dto.WriteContractResponse{
		ContractID:      cr.ContractID,
		TransactionHash: cr.TransactionHash,
		TransactionID:   cr.TransactionID,
		BlockNumber:     cr.BlockNumber,
		GasUsed:         cr.GasUsed,
		Status:          cr.Status,
		Network:         cr.Network,
		CreatedAt:       cr.CreatedAt.Format(time.RFC3339),
	}
}
