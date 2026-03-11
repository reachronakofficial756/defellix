package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/saiyam0211/defellix/services/user-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/user-service/internal/service"
)

// ContractLinkRequest is the payload sent from the contract-service when a contract is completed
type ContractLinkRequest struct {
	FreelancerUserID uint    `json:"freelancer_user_id" validate:"required"`
	ContractID       uint    `json:"contract_id" validate:"required"`
	ProjectName      string  `json:"project_name" validate:"required"`
	ClientName       string  `json:"client_name" validate:"required"`
	TotalAmount      float64 `json:"total_amount" validate:"required"`
	Currency         string  `json:"currency"`
	CompletionDate   string  `json:"completion_date"`
	Rating           int     `json:"rating"`
}

// ContractLinkHandler handles saving completed contract summaries to user profiles
type ContractLinkHandler struct {
	validator      *middleware.Validator
	profileService *service.ProfileService
}

func NewContractLinkHandler(profileService *service.ProfileService) *ContractLinkHandler {
	return &ContractLinkHandler{
		validator:      middleware.NewValidator(),
		profileService: profileService,
	}
}

func (h *ContractLinkHandler) RegisterRoutes(r chi.Router) {
	// Internal route: only called by other Defellix microservices
	r.Post("/api/v1/users/internal/contracts", h.LinkContract)
}

func (h *ContractLinkHandler) LinkContract(w http.ResponseWriter, r *http.Request) {
	var req ContractLinkRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	err := h.profileService.AddCompletedContract(r.Context(), req.FreelancerUserID, service.CompletedContractData{
		ContractID:     req.ContractID,
		ProjectName:    req.ProjectName,
		ClientName:     req.ClientName,
		TotalAmount:    req.TotalAmount,
		Currency:       req.Currency,
		CompletionDate: req.CompletionDate,
		Rating:         req.Rating,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		return
	}

	resp := map[string]string{"message": "Contract linked to profile successfully"}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}
