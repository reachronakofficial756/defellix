package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/saiyam0211/defellix/services/contract-service/internal/domain"
	"github.com/saiyam0211/defellix/services/contract-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/contract-service/internal/repository"
	"github.com/saiyam0211/defellix/services/contract-service/internal/service"
)

type SubmissionHandler struct {
	validator *middleware.Validator
	svc       *service.SubmissionService
}

func NewSubmissionHandler(svc *service.SubmissionService) *SubmissionHandler {
	return &SubmissionHandler{
		validator: middleware.NewValidator(),
		svc:       svc,
	}
}

func (h *SubmissionHandler) userID(r *http.Request) uint {
	return r.Context().Value("user_id").(uint)
}

func (h *SubmissionHandler) RegisterRoutes(r chi.Router, authMw func(http.Handler) http.Handler) {
	// Freelancer Routes (Auth Required)
	r.Route("/api/v1/contracts/{id}/submissions", func(r chi.Router) {
		r.With(authMw).Post("/", h.Create)
		r.With(authMw).Get("/", h.List)
		r.With(authMw).Put("/{sub_id}", h.Update)
	})

	// Client Routes (Public, token required)
	r.Post("/api/v1/public/contracts/{token}/submissions/{sub_id}/review", h.Review)
}

func (h *SubmissionHandler) Create(w http.ResponseWriter, r *http.Request) {
	contractID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid contract ID", "BAD_REQUEST")
		return
	}

	var req domain.SubmissionRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	out, err := h.svc.CreateSubmission(r.Context(), uint(contractID), h.userID(r), &req)
	if err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		if errors.Is(err, service.ErrNotParticipant) {
			respondError(w, http.StatusForbidden, err.Error(), "FORBIDDEN")
			return
		}
		if errors.Is(err, service.ErrContractNotSigned) {
			respondError(w, http.StatusBadRequest, err.Error(), "BAD_REQUEST")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to submit work", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusCreated, out, "Work submitted successfully")
}

func (h *SubmissionHandler) Update(w http.ResponseWriter, r *http.Request) {
	contractID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid contract ID", "BAD_REQUEST")
		return
	}

	subID, err := strconv.ParseUint(chi.URLParam(r, "sub_id"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid submission ID", "BAD_REQUEST")
		return
	}

	var req domain.UpdateSubmissionRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	out, err := h.svc.UpdateSubmission(r.Context(), uint(contractID), uint(subID), h.userID(r), &req)
	if err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			respondError(w, http.StatusNotFound, "Contract/Submission not found", "NOT_FOUND")
			return
		}
		if errors.Is(err, service.ErrNotParticipant) {
			respondError(w, http.StatusForbidden, err.Error(), "FORBIDDEN")
			return
		}
		respondError(w, http.StatusBadRequest, err.Error(), "BAD_REQUEST")
		return
	}
	respondSuccess(w, http.StatusOK, out, "Work updated successfully")
}

func (h *SubmissionHandler) List(w http.ResponseWriter, r *http.Request) {
	contractID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid contract ID", "BAD_REQUEST")
		return
	}

	list, err := h.svc.GetSubmissions(r.Context(), uint(contractID), h.userID(r))
	if err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		if errors.Is(err, service.ErrNotParticipant) {
			respondError(w, http.StatusForbidden, err.Error(), "FORBIDDEN")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to fetch submissions", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, list, "OK")
}

func (h *SubmissionHandler) Review(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		respondError(w, http.StatusBadRequest, "Missing token", "BAD_REQUEST")
		return
	}

	subID, err := strconv.ParseUint(chi.URLParam(r, "sub_id"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid submission ID", "BAD_REQUEST")
		return
	}

	var req domain.SubmissionReviewRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	err = h.svc.ClientReviewSubmission(r.Context(), token, uint(subID), &req)
	if err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to submit review: "+err.Error(), "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, map[string]string{"message": "Review submitted successfully"}, "OK")
}
