package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/saiyam0211/defellix/services/user-service/internal/domain"
	"github.com/saiyam0211/defellix/services/user-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/user-service/internal/repository"
	"github.com/saiyam0211/defellix/services/user-service/internal/service"
)

type ReputationHandler struct {
	validator        *middleware.Validator
	svc              *service.ReputationService
	scoreHistoryRepo repository.ScoreHistoryRepository
}

func NewReputationHandler(svc *service.ReputationService, scoreHistoryRepo repository.ScoreHistoryRepository) *ReputationHandler {
	return &ReputationHandler{
		validator:        middleware.NewValidator(),
		svc:              svc,
		scoreHistoryRepo: scoreHistoryRepo,
	}
}

func (h *ReputationHandler) RegisterRoutes(r chi.Router) {
	// Internal route callable only by other defellix microservices (e.g. from contract-service)
	r.Post("/api/v1/users/internal/reputation", h.ProcessReputation)

	// Public: get a user's score breakdown
	r.Get("/api/v1/users/{id}/reputation", h.GetReputation)

	// Internal: recalculate score for a user (called on profile create/update)
	r.Post("/api/v1/users/internal/recalculate-score/{id}", h.RecalculateScore)

	// E12: Score history timeline
	r.Get("/api/v1/users/me/score-history", h.GetScoreHistory)
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

	respondSuccess(w, http.StatusCreated, out, "Reputation processed successfully")
}

// GetReputation returns the full score breakdown for a user
func (h *ReputationHandler) GetReputation(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID", "VALIDATION_ERROR")
		return
	}

	// Fetch user profile to get score data
	profile, err := h.svc.GetUserScoreBreakdown(r.Context(), uint(id))
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found", "NOT_FOUND")
		return
	}

	// Parse dimension scores from JSON
	var dims service.DimensionScores
	if profile.DimensionScores != nil {
		json.Unmarshal([]byte(profile.DimensionScores), &dims)
	}

	breakdown := map[string]interface{}{
		"user_id":           profile.ID,
		"credibility_score": profile.CredibilityScore,
		"score_tier":        profile.ScoreTier,
		"dimensions":        dims,
		"tier_labels": map[string]string{
			"900-1000": "Elite",
			"800-899":  "Trusted Expert",
			"650-799":  "Proven Professional",
			"500-649":  "Growing Professional",
			"300-499":  "Established",
			"150-299":  "Rising Talent",
			"50-149":   "Verified Newcomer",
			"0-49":     "Starter",
		},
	}

	respondSuccess(w, http.StatusOK, breakdown, "Reputation breakdown retrieved")
}

// RecalculateScore triggers a full score recalculation for a user
func (h *ReputationHandler) RecalculateScore(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID", "VALIDATION_ERROR")
		return
	}

	if err := h.svc.RecalculateUserScore(r.Context(), uint(id)); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, nil, "Score recalculated successfully")
}

// GetScoreHistory returns the score timeline for the authenticated user
func (h *ReputationHandler) GetScoreHistory(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-Id")
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil || userID == 0 {
		respondError(w, http.StatusUnauthorized, "Authentication required", "UNAUTHORIZED")
		return
	}

	history, err := h.scoreHistoryRepo.GetByUserID(r.Context(), uint(userID), 52)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch score history", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, history, "Score history retrieved")
}
