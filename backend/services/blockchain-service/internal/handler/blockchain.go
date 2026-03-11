package handler

import (
	"errors"
	"log"
	"net/http"

	"github.com/saiyam0211/defellix/services/blockchain-service/internal/dto"
	"github.com/saiyam0211/defellix/services/blockchain-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/blockchain-service/internal/repository"
	"github.com/saiyam0211/defellix/services/blockchain-service/internal/service"
)

type BlockchainHandler struct {
	validator      *middleware.Validator
	blockchainSvc  *service.BlockchainService
}

func NewBlockchainHandler(blockchainSvc *service.BlockchainService) *BlockchainHandler {
	return &BlockchainHandler{
		validator:     middleware.NewValidator(),
		blockchainSvc: blockchainSvc,
	}
}

func (h *BlockchainHandler) WriteContract(w http.ResponseWriter, r *http.Request) {
	var req dto.WriteContractRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	out, err := h.blockchainSvc.WriteContractToChain(r.Context(), &req)
	if err != nil {
		if errors.Is(err, service.ErrContractAlreadyOnChain) {
			respondError(w, http.StatusConflict, "Contract already recorded on blockchain", "ALREADY_ON_CHAIN")
			return
		}
		if errors.Is(err, repository.ErrWalletNotFound) {
			respondError(w, http.StatusNotFound, "Wallet not found", "WALLET_NOT_FOUND")
			return
		}
		log.Printf("[ERROR] Failed to write contract to chain: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to write contract to chain", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusCreated, out, "Contract written to blockchain")
}

func (h *BlockchainHandler) GetContractRecord(w http.ResponseWriter, r *http.Request) {
	var req dto.GetContractRecordRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	out, err := h.blockchainSvc.GetContractRecord(r.Context(), req.ContractID)
	if err != nil {
		if errors.Is(err, repository.ErrContractRecordNotFound) {
			respondError(w, http.StatusNotFound, "Contract record not found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to get contract record", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, out, "OK")
}
