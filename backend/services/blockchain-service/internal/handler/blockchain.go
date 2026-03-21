package handler

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
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

// E11: AnchorScore anchors a credibility score hash on-chain
func (h *BlockchainHandler) AnchorScore(w http.ResponseWriter, r *http.Request) {
	var req dto.AnchorScoreRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	out, err := h.blockchainSvc.AnchorScoreToChain(r.Context(), &req)
	if err != nil {
		log.Printf("[ERROR] Failed to anchor score on chain: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to anchor score on chain", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusCreated, out, "Score anchored on blockchain")
}

// E11: GetScoreAnchors returns the score anchoring history for a user
func (h *BlockchainHandler) GetScoreAnchors(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID", "VALIDATION_ERROR")
		return
	}

	anchors, err := h.blockchainSvc.GetScoreAnchors(r.Context(), uint(userID))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch score anchors", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, anchors, "OK")
}

// E11: GetLatestScoreAnchor returns the latest score anchor for a user
func (h *BlockchainHandler) GetLatestScoreAnchor(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID", "VALIDATION_ERROR")
		return
	}

	anchor, err := h.blockchainSvc.GetLatestScoreAnchor(r.Context(), uint(userID))
	if err != nil {
		if errors.Is(err, repository.ErrScoreAnchorNotFound) {
			respondError(w, http.StatusNotFound, "No score anchors found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to fetch latest score anchor", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, anchor, "OK")
}
