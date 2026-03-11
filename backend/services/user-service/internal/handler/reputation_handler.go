package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/saiyam0211/defellix/services/user-service/internal/domain"
	"github.com/saiyam0211/defellix/services/user-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/user-service/internal/service"
)

type ReputationHandler struct {
	validator *middleware.Validator
	svc       *service.ReputationService
}

func NewReputationHandler(svc *service.ReputationService) *ReputationHandler {
	return &ReputationHandler{
		validator: middleware.NewValidator(),
		svc:       svc,
	}
}

func (h *ReputationHandler) RegisterRoutes(r chi.Router) {
	// Internal route callable only by other defellix microservices (e.g. from contract-service)
	r.Post("/api/v1/users/internal/reputation", h.ProcessReputation)
}

func (h *ReputationHandler) ProcessReputation(w http.ResponseWriter, r *http.Request) {
	var req domain.ReputationRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	out, err := h.svc.CalculateAndSaveScore(r.Context(), &req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusCreated, out, "Reputation processed generated successfully")
}
