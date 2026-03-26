package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
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
			// Literal paths MUST be registered before /{id} or Chi matches POST /suggest-milestones,
			// /suggest-scope, /suggest-terms, etc. to /{id} and returns 405 Method Not Allowed.
			r.Post("/prd-upload", h.UploadPRD)
			r.Post("/extract-from-prd", h.ExtractFromPRD)
			r.Post("/suggest-milestones", h.SuggestMilestones)
			// Nested route → POST /api/v1/contracts/suggest/scope (avoids /{id} collisions on single-segment paths).
			r.Route("/suggest", func(r chi.Router) {
				r.Post("/scope", h.SuggestScope)
				r.Post("/terms", h.SuggestTerms)
			})
			// Legacy single-segment aliases
			r.Post("/suggest-scope", h.SuggestScope)
			r.Post("/suggest-terms", h.SuggestTerms)
			r.Post("/", h.Create)
			r.Get("/", h.List)
			r.Get("/{id}", h.GetByID)
			r.Put("/{id}", h.Update)
			r.Patch("/{id}/visibility", h.UpdateVisibility)
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

	// Internal routes
	r.Route("/api/v1/internal/contracts", func(r chi.Router) {
		r.Get("/public/{freelancerUserID}", h.GetPublicByFreelancerInternal)
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
		if strings.Contains(err.Error(), "does not match total amount") {
			respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
			return
		}
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
		"contracts": list,
		"total":     total,
		"page":      page,
		"limit":     limit,
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

func (h *ContractHandler) UpdateVisibility(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid contract ID", "BAD_REQUEST")
		return
	}
	var req struct {
		IsPublic bool `json:"is_public"`
	}
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}
	if err := h.svc.UpdateIsPublic(r.Context(), uint(id), h.userID(r), req.IsPublic); err != nil {
		if err == repository.ErrContractNotFound {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to update visibility", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, map[string]bool{"is_public": req.IsPublic}, "Visibility updated")
}

// Removed to replace with a cleaner approach later if neededken returns the contract for client view (no auth). Token from URL.
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

// UploadPRD uploads a PRD file to Cloudinary and returns the secure URL
func (h *ContractHandler) UploadPRD(w http.ResponseWriter, r *http.Request) {
	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "file is required", "BAD_REQUEST")
		return
	}
	defer file.Close()

	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	uploadPreset := os.Getenv("CLOUDINARY_UPLOAD_PRESET")

	if cloudName == "" || (apiKey == "" && uploadPreset == "") {
		respondError(w, http.StatusInternalServerError, "Cloudinary not configured", "INTERNAL_ERROR")
		return
	}

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)

	// Read file into memory to enable multi-use (Upload to Cloudinary + Extract Text)
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to read uploaded file to memory", "INTERNAL_ERROR")
		return
	}

	fw, err := mw.CreateFormFile("file", header.Filename)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to build upload request", "INTERNAL_ERROR")
		return
	}
	if _, err := io.Copy(fw, bytes.NewReader(fileBytes)); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to stream file", "INTERNAL_ERROR")
		return
	}

	if uploadPreset != "" {
		_ = mw.WriteField("upload_preset", uploadPreset)
	} else {
		_ = mw.WriteField("api_key", apiKey)
	}

	_ = mw.WriteField("folder", "defellix/prds")
	_ = mw.WriteField("resource_type", "auto")

	mw.Close()

	uploadURL := "https://api.cloudinary.com/v1_1/" + url.PathEscape(cloudName) + "/auto/upload"
	req, err := http.NewRequest(http.MethodPost, uploadURL, &buf)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create upload request", "INTERNAL_ERROR")
		return
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		respondError(w, http.StatusBadGateway, "failed to upload to Cloudinary", "UPSTREAM_ERROR")
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		respondError(w, http.StatusBadGateway, string(body), "UPSTREAM_ERROR")
		return
	}

	var out struct {
		SecureURL string `json:"secure_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to parse Cloudinary response", "INTERNAL_ERROR")
		return
	}

	// ---------------------------------------------------------
	// NATIVE BYPASS: Read bytes directly into PDF parser
	// ---------------------------------------------------------
	extractedContractJSON, prdPlainText, err := h.svc.ExtractFromPRDBytes(r.Context(), fileBytes)
	if err != nil {
		// Even if extraction fails, the upload succeeded.
		// We can return the URL and let the frontend know extraction failed,
		// but since the frontend expects both in one, we return error if extraction is vital.
		// However, returning partial success is usually preferred. Let's return error on extraction fail.
		respondError(w, http.StatusInternalServerError, "Failed to extract contract: "+err.Error(), "EXTRACTION_FAILED")
		return
	}

	respondSuccess(w, http.StatusOK, map[string]interface{}{
		"prd_file_url":        out.SecureURL,
		"extracted_contract":  extractedContractJSON,
		"prd_extracted_text":  prdPlainText,
	}, "PRD uploaded and extracted successfully")
}

// ExtractFromPRD extracts contract fields from a PRD using Groq LLM
func (h *ContractHandler) ExtractFromPRD(w http.ResponseWriter, r *http.Request) {
	var req dto.ExtractFromPRDRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	extracted, prdPlainText, err := h.svc.ExtractFromPRD(r.Context(), req.PRDFileURL)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to extract PRD: "+err.Error(), "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, map[string]interface{}{
		"extracted_contract": extracted,
		"prd_extracted_text": prdPlainText,
	}, "PRD extracted")
}

// SuggestMilestones returns AI-generated milestone splits for the given project context.
func (h *ContractHandler) SuggestMilestones(w http.ResponseWriter, r *http.Request) {
	var req dto.SuggestMilestonesRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}
	out, err := h.svc.SuggestMilestones(r.Context(), &req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, out, "Milestone suggestions generated")
}

// SuggestScope returns AI-generated core deliverable and out-of-scope text from project context (+ optional PRD excerpt).
// Mounted at POST /suggest/scope (preferred) and POST /suggest-scope (legacy alias).
func (h *ContractHandler) SuggestScope(w http.ResponseWriter, r *http.Request) {
	var req dto.SuggestScopeRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}
	out, err := h.svc.SuggestScope(r.Context(), &req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, out, "Scope suggestions generated")
}

// SuggestTerms returns AI-generated terms & conditions from full project context (+ milestones, PRD excerpt).
// POST /suggest/terms and legacy POST /suggest-terms.
func (h *ContractHandler) SuggestTerms(w http.ResponseWriter, r *http.Request) {
	var req dto.SuggestTermsRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}
	out, err := h.svc.SuggestTerms(r.Context(), &req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error(), "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, out, "Terms suggestions generated")
}

func (h *ContractHandler) GetPublicByFreelancerInternal(w http.ResponseWriter, r *http.Request) {
	freelancerUserID, err := strconv.ParseUint(chi.URLParam(r, "freelancerUserID"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid freelancer user ID", "BAD_REQUEST")
		return
	}
	list, err := h.svc.GetPublicByFreelancer(r.Context(), uint(freelancerUserID))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get public contracts", "INTERNAL_ERROR")
		return
	}
	respondSuccess(w, http.StatusOK, list, "OK")
}
