package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/saiyam0211/defellix/services/contract-service/internal/certificate"
	"github.com/saiyam0211/defellix/services/contract-service/internal/repository"
	"github.com/saiyam0211/defellix/services/contract-service/internal/service"
)

// CertificateHandler handles Section 65B certificate generation
type CertificateHandler struct {
	contractSvc *service.ContractService
	subSvc      *service.SubmissionService
}

func NewCertificateHandler(contractSvc *service.ContractService, subSvc *service.SubmissionService) *CertificateHandler {
	return &CertificateHandler{contractSvc: contractSvc, subSvc: subSvc}
}

func (h *CertificateHandler) RegisterRoutes(r chi.Router, authMw func(http.Handler) http.Handler) {
	r.With(authMw).Get("/api/v1/contracts/{id}/certificate", h.GenerateCertificate)
}

func (h *CertificateHandler) userID(r *http.Request) uint {
	return r.Context().Value("user_id").(uint)
}

// GenerateCertificate generates a Section 65B certificate for a signed/completed contract
func (h *CertificateHandler) GenerateCertificate(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 32)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid contract ID", "BAD_REQUEST")
		return
	}

	contract, err := h.contractSvc.GetRawContract(r.Context(), uint(id), h.userID(r))
	if err != nil {
		if errors.Is(err, repository.ErrContractNotFound) {
			respondError(w, http.StatusNotFound, "Contract not found", "NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to get contract", "INTERNAL_ERROR")
		return
	}

	// Only allow certificate generation for signed or completed contracts
	if contract.Status != "signed" && contract.Status != "completed" {
		respondError(w, http.StatusBadRequest, "Certificate can only be generated for signed or completed contracts", "BAD_REQUEST")
		return
	}

	// Fetch all submissions for the contract to build the timeline
	submissions, _ := h.subSvc.GetSubmissions(r.Context(), uint(id), h.userID(r))

	htmlBytes, err := certificate.GenerateSection65BHTML(&certificate.Section65BData{
		Contract:    contract,
		Submissions: submissions,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate certificate", "INTERNAL_ERROR")
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Disposition", "inline; filename=section65b_certificate.html")
	w.WriteHeader(http.StatusOK)
	w.Write(htmlBytes)
}
