package handler

import (
	"errors"
	"net/http"

	"github.com/saiyam0211/defellix/services/blockchain-service/internal/dto"
	"github.com/saiyam0211/defellix/services/blockchain-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/blockchain-service/internal/repository"
	"github.com/saiyam0211/defellix/services/blockchain-service/internal/service"
)

type WalletHandler struct {
	validator   *middleware.Validator
	walletSvc   *service.WalletService
}

func NewWalletHandler(walletSvc *service.WalletService) *WalletHandler {
	return &WalletHandler{
		validator: middleware.NewValidator(),
		walletSvc: walletSvc,
	}
}

func (h *WalletHandler) CreateOrGetWallet(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateWalletRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	out, err := h.walletSvc.CreateOrGetWallet(r.Context(), req.UserID, req.UserType)
	if err != nil {
		if errors.Is(err, repository.ErrWalletNotFound) {
			respondError(w, http.StatusNotFound, "Wallet not found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to create/get wallet", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, out, "Wallet retrieved or created")
}

func (h *WalletHandler) GetWallet(w http.ResponseWriter, r *http.Request) {
	var req dto.GetWalletRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	out, err := h.walletSvc.GetWallet(r.Context(), req.UserID, req.UserType)
	if err != nil {
		if errors.Is(err, repository.ErrWalletNotFound) {
			respondError(w, http.StatusNotFound, "Wallet not found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to get wallet", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, out, "OK")
}
