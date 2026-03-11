package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/saiyam0211/defellix/services/contract-service/internal/dto"
	"github.com/saiyam0211/defellix/services/contract-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/contract-service/internal/repository"
	"github.com/saiyam0211/defellix/services/contract-service/internal/service"
)

type ContractHandler struct {
	validator *middleware.Validator
	svc       *service.ContractService
}

func NewContractHandler(svc *service.ContractService) *ContractHandler {
	return &ContractHandler{
		validator: middleware.NewValidator(),
		svc:       svc,
	}
}

func (h *ContractHandler) RegisterRoutes(r chi.Router, authMw func(http.Handler) http.Handler) {
	r.Route("/api/v1/contracts", func(r chi.Router) {
		r.With(authMw).Group(func(r chi.Router) {
			r.Post("/", h.Create)
			r.Get("/", h.List)
			r.Get("/{id}", h.GetByID)
			r.Put("/{id}", h.Update)
			r.Post("/{id}/send", h.Send)
			r.Delete("/{id}", h.Delete)
		})
	})
	// Public contract routes (no auth): client view, send-for-review, sign
	r.Route("/api/v1/public/contracts", func(r chi.Router) {
		r.Get("/{token}", h.GetByClientToken)
		r.Post("/{token}/send-for-review", h.SendForReview)
		r.Post("/{token}/send-otp", h.SendSignOTP)
		r.Post("/{token}/sign", h.Sign)
	})
}

func (h *ContractHandler) userID(r *http.Request) uint {
	return r.Context().Value("user_id").(uint)
}

func (h *ContractHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateContractRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}
	out, err := h.svc.Create(r.Context(), h.userID(r), &req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create contract", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusCreated, out, "Contract created as draft")
}

func (h *ContractHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid contract ID", "BAD_REQUEST")
		return
	}
	out, err := h.svc.GetByID(r.Context(), uint(id), h.userID(r))
	if err != nil {
		if err == repository.ErrContractNotFound {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to get contract", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, out, "OK")
}

func (h *ContractHandler) List(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}
	list, total, err := h.svc.List(r.Context(), h.userID(r), status, page, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to list contracts", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, map[string]interface{}{
		"contracts":   list,
		"total":       total,
		"page":        page,
		"limit":       limit,
	}, "OK")
}

func (h *ContractHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid contract ID", "BAD_REQUEST")
		return
	}
	var req dto.UpdateContractRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}
	out, err := h.svc.Update(r.Context(), uint(id), h.userID(r), &req)
	if err != nil {
		if err == repository.ErrContractNotFound {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		if err == service.ErrNotDraft {
			respondError(w, http.StatusBadRequest, "Only draft or pending contracts can be updated", "NOT_DRAFT")
			return
		}
		if strings.Contains(err.Error(), "does not match total amount") {
			respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to update contract", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, out, "Contract updated")
}

func (h *ContractHandler) Send(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid contract ID", "BAD_REQUEST")
		return
	}
	out, err := h.svc.Send(r.Context(), uint(id), h.userID(r))
	if err != nil {
		if err == repository.ErrContractNotFound {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		if err == service.ErrNotDraft {
			respondError(w, http.StatusBadRequest, "Only draft contracts can be sent", "NOT_DRAFT")
			return
		}
		if err == service.ErrAlreadySent {
			respondError(w, http.StatusBadRequest, "Contract was already sent", "ALREADY_SENT")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to send contract", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, out, "Contract sent to client")
}

func (h *ContractHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid contract ID", "BAD_REQUEST")
		return
	}
	if err := h.svc.Delete(r.Context(), uint(id), h.userID(r)); err != nil {
		if err == repository.ErrContractNotFound {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		if err == service.ErrNotDraft {
			respondError(w, http.StatusBadRequest, "Only draft contracts can be deleted", "NOT_DRAFT")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to delete contract", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, map[string]string{"message": "Contract deleted"}, "OK")
}

// GetByClientToken returns the contract for client view (no auth). Token from URL.
func (h *ContractHandler) GetByClientToken(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		respondError(w, http.StatusBadRequest, "Missing token", "BAD_REQUEST")
		return
	}
	out, err := h.svc.GetByClientToken(r.Context(), token)
	if err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to get contract", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, out, "OK")
}

// SendForReview submits the client's comment and sets status to pending (no auth).
func (h *ContractHandler) SendForReview(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		respondError(w, http.StatusBadRequest, "Missing token", "BAD_REQUEST")
		return
	}
	var req dto.SendForReviewRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}
	if err := h.svc.SendForReview(r.Context(), token, &req); err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		if errors.Is(err, service.ErrAlreadyPending) {
			respondError(w, http.StatusConflict, "Contract is already pending review", "ALREADY_PENDING")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to send for review", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, map[string]string{"message": "Sent for review"}, "OK")
}

// Sign records client sign (no auth). Required: company_address. Optional: email, phone, gst, etc. Blockchain in 3.4.
func (h *ContractHandler) Sign(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		respondError(w, http.StatusBadRequest, "Missing token", "BAD_REQUEST")
		return
	}
	var req dto.SignRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}
	out, err := h.svc.Sign(r.Context(), token, &req)
	if err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		if errors.Is(err, service.ErrAlreadySigned) {
			respondError(w, http.StatusConflict, "Contract was already signed", "ALREADY_SIGNED")
			return
		}
		if errors.Is(err, service.ErrInvalidCompanyAddr) {
			respondError(w, http.StatusBadRequest, err.Error(), "INVALID_COMPANY_ADDRESS")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to sign contract", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, out, "Contract signed")
}

// SendSignOTP handles generating and emailing an OTP to the client for signature verification
func (h *ContractHandler) SendSignOTP(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		respondError(w, http.StatusBadRequest, "Missing token", "BAD_REQUEST")
		return
	}
	var req dto.SendOTPRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}
	if err := h.svc.SendSignOTP(r.Context(), token, &req); err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusBadRequest, err.Error(), "BAD_REQUEST")
		return
	}
	respondSuccess(w, http.StatusOK, map[string]string{"message": "OTP sent successfully"}, "OTP_SENT")
}
