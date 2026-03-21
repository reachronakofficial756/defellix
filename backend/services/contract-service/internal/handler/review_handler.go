package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/saiyam0211/defellix/services/contract-service/internal/domain"
	"github.com/saiyam0211/defellix/services/contract-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/contract-service/internal/notification"
	"github.com/saiyam0211/defellix/services/contract-service/internal/repository"
)

type ReviewHandler struct {
	validator    *middleware.Validator
	contractRepo repository.ContractRepository
	reviewRepo   repository.ReviewRepository
	subRepo      repository.SubmissionRepository
	notifier     notification.ContractNotifier
}

func NewReviewHandler(contractRepo repository.ContractRepository, reviewRepo repository.ReviewRepository, subRepo repository.SubmissionRepository, notifier notification.ContractNotifier) *ReviewHandler {
	return &ReviewHandler{
		validator:    middleware.NewValidator(),
		contractRepo: contractRepo,
		reviewRepo:   reviewRepo,
		subRepo:      subRepo,
		notifier:     notifier,
	}
}

func (h *ReviewHandler) RegisterRoutes(r chi.Router, authMw func(http.Handler) http.Handler) {
	// Public routes (client uses token, no auth)
	r.Get("/api/v1/public/contracts/{token}/review-data", h.GetReviewData)
	r.Post("/api/v1/public/contracts/{token}/review", h.SubmitReview)
	// Freelancer route: see reviews for own contracts
	r.With(authMw).Get("/api/v1/contracts/{id}/review", h.GetContractReview)
}

// GetReviewData fetches contract summary for the review page
func (h *ReviewHandler) GetReviewData(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		respondError(w, http.StatusBadRequest, "Missing token", "BAD_REQUEST")
		return
	}

	contract, err := h.contractRepo.FindByClientViewToken(r.Context(), token)
	if err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to fetch contract", "INTERNAL_ERROR")
		return
	}

	// Only allow review for completed contracts
	if contract.Status != "completed" {
		respondError(w, http.StatusBadRequest, "Contract is not yet completed", "BAD_REQUEST")
		return
	}

	// Check if already reviewed
	existing, _ := h.reviewRepo.GetByContractID(r.Context(), contract.ID)
	if existing != nil {
		respondSuccess(w, http.StatusOK, map[string]interface{}{
			"contract":     contract,
			"already_reviewed": true,
			"review":       existing,
		}, "Review already submitted")
		return
	}

	respondSuccess(w, http.StatusOK, map[string]interface{}{
		"contract":     contract,
		"already_reviewed": false,
	}, "OK")
}

// SubmitReview allows the client to submit a complete review with ratings and testimonial
func (h *ReviewHandler) SubmitReview(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		respondError(w, http.StatusBadRequest, "Missing token", "BAD_REQUEST")
		return
	}

	contract, err := h.contractRepo.FindByClientViewToken(r.Context(), token)
	if err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to fetch contract", "INTERNAL_ERROR")
		return
	}

	if contract.Status != "completed" {
		respondError(w, http.StatusBadRequest, "Contract is not yet completed", "BAD_REQUEST")
		return
	}

	// Prevent duplicate reviews
	existing, _ := h.reviewRepo.GetByContractID(r.Context(), contract.ID)
	if existing != nil {
		respondError(w, http.StatusConflict, "Review already submitted for this contract", "CONFLICT")
		return
	}

	var req domain.ContractReviewRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	review := &domain.ContractReview{
		ContractID:            contract.ID,
		FreelancerUserID:      contract.FreelancerUserID,
		ClientName:            contract.ClientName,
		ClientEmail:           contract.ClientEmail,
		ClientCompanyName:     contract.ClientCompanyName,
		OverallRating:         req.OverallRating,
		DeliveryRating:        req.DeliveryRating,
		QualityRating:         req.QualityRating,
		CommunicationRating:   req.CommunicationRating,
		Comment:               req.Comment,
		Testimonial:           req.Testimonial,
		AllowTestimonialPublic: req.AllowTestimonialPublic,
	}

	if err := h.reviewRepo.Create(r.Context(), review); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save review", "INTERNAL_ERROR")
		return
	}

	// Notify freelancer that they received a review
	h.notifier.NotifyReviewReceived(r.Context(), contract.ID, contract.ClientEmail, contract.ProjectName, req.OverallRating)

	// Calculate total revision count and on-time status from submissions
	totalRevisions := 0
	onTime := true
	daysEarlyOrLate := 0
	var latestSubmittedAt, contractDeadline interface{}
	contractDeadline = nil
	latestSubmittedAt = nil

	if submissions, subErr := h.subRepo.GetByContractID(r.Context(), contract.ID); subErr == nil {
		for _, s := range submissions {
			// Count revisions
			if s.RevisionHistory != "" && s.RevisionHistory != "null" {
				var history []domain.RevisionComment
				if json.Unmarshal([]byte(s.RevisionHistory), &history) == nil {
					totalRevisions += len(history)
				}
			}
		}

		// Determine on-time status from milestones
		if contract.Milestones != nil {
			for _, ms := range contract.Milestones {
				if ms.DueDate == nil {
					continue
				}
				// Find the latest accepted submission for this milestone
				for _, s := range submissions {
					if s.MilestoneID != nil && *s.MilestoneID == ms.ID && s.Status == "accepted" {
						diff := int(ms.DueDate.Sub(s.SubmittedAt).Hours() / 24)
						if diff < daysEarlyOrLate {
							daysEarlyOrLate = diff // Track worst case (most late)
						}
						if s.SubmittedAt.After(*ms.DueDate) {
							onTime = false
						}
						contractDeadline = ms.DueDate
						latestSubmittedAt = s.SubmittedAt
					}
				}
			}
		}
	}

	// Trigger reputation score recalculation via user-service
	go func() {
		reputationPayload := map[string]interface{}{
			"freelancer_user_id":    contract.FreelancerUserID,
			"contract_id":           contract.ID,
			"client_rating":         req.OverallRating,
			"delivery_rating":       req.DeliveryRating,
			"quality_rating":        req.QualityRating,
			"communication_rating":  req.CommunicationRating,
			"on_time":               onTime,
			"days_early_or_late":    daysEarlyOrLate,
			"revision_count":        totalRevisions,
			"contract_value":        contract.TotalAmount,
			"client_email":          contract.ClientEmail,
		}
		if contractDeadline != nil {
			reputationPayload["contract_deadline"] = contractDeadline
		}
		if latestSubmittedAt != nil {
			reputationPayload["submitted_at"] = latestSubmittedAt
		}

		payloadBytes, _ := json.Marshal(reputationPayload)
		// In Docker, the user-service is available at http://user-service:8082
		userServiceURL := "http://user-service:8082/api/v1/users/internal/reputation"
		resp, err := http.Post(userServiceURL, "application/json", bytes.NewBuffer(payloadBytes))
		if err != nil {
			fmt.Printf("[ReviewHandler] Failed to call user-service reputation: %v\n", err)
			return
		}
		defer resp.Body.Close()
		fmt.Printf("[ReviewHandler] Reputation recalculation triggered for user %d, status: %d\n", contract.FreelancerUserID, resp.StatusCode)
	}()

	respondSuccess(w, http.StatusCreated, review, "Review submitted successfully")
}

// GetContractReview allows the freelancer to see the review for a specific contract
func (h *ReviewHandler) GetContractReview(w http.ResponseWriter, r *http.Request) {
	contractIDStr := chi.URLParam(r, "id")
	if contractIDStr == "" {
		respondError(w, http.StatusBadRequest, "Missing contract ID", "BAD_REQUEST")
		return
	}

	var contractID uint
	_, err := fmt.Sscan(contractIDStr, &contractID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid contract ID", "BAD_REQUEST")
		return
	}

	review, err := h.reviewRepo.GetByContractID(r.Context(), contractID)
	if err != nil {
		if errors.Is(err, repository.ErrReviewNotFound) {
			respondError(w, http.StatusNotFound, "No review found for this contract", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to fetch review", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, review, "OK")
}
