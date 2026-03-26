package service

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ledongthuc/pdf"
	"github.com/saiyam0211/defellix/services/contract-service/internal/blockchain"
	"github.com/saiyam0211/defellix/services/contract-service/internal/domain"
	"github.com/saiyam0211/defellix/services/contract-service/internal/dto"
	"github.com/saiyam0211/defellix/services/contract-service/internal/notification"
	"github.com/saiyam0211/defellix/services/contract-service/internal/repository"
)

var (
	ErrNotDraft           = errors.New("contract is not in draft status")
	ErrAlreadySent        = errors.New("contract was already sent")
	ErrAlreadySigned      = errors.New("contract was already signed")
	ErrAlreadyPending     = errors.New("contract is already pending review")
	ErrInvalidCompanyAddr = errors.New("company_address must be 'Remote', a full address, or a valid URL")
)

type ContractService struct {
	repo                 repository.ContractRepository
	shareableLinkBaseURL string
	notifier             notification.ContractNotifier
	draftExpiryDays      int
	blockchainClient     blockchain.Client
}

// NewContractService creates the contract service. shareableLinkBaseURL is used for shareable_link when status is sent (e.g. https://app.ourdomain.com/contract).
// draftExpiryDays is used by DeleteExpiredDrafts; if <= 0, 14 is used.
// blockchainClient is used to write contracts to chain on sign; can be nil if blockchain-service not configured.
func NewContractService(repo repository.ContractRepository, shareableLinkBaseURL string, notifier notification.ContractNotifier, draftExpiryDays int, blockchainClient blockchain.Client) *ContractService {
	if draftExpiryDays <= 0 {
		draftExpiryDays = 14
	}
	return &ContractService{
		repo:                 repo,
		shareableLinkBaseURL: strings.TrimSuffix(shareableLinkBaseURL, "/"),
		notifier:             notifier,
		draftExpiryDays:      draftExpiryDays,
		blockchainClient:     blockchainClient,
	}
}

func (s *ContractService) Create(ctx context.Context, freelancerUserID uint, req *dto.CreateContractRequest) (*dto.ContractResponse, error) {
	currency := req.Currency
	if currency == "" {
		currency = "INR"
	}

	// Validate milestone amounts sum to total amount
	var sum float64
	for _, m := range req.Milestones {
		sum += m.Amount
	}
	// Use small epsilon for float comparison
	if stringifyAmount(sum) != stringifyAmount(req.TotalAmount) {
		return nil, fmt.Errorf("sum of milestone amounts (%f) does not match total amount (%f)", sum, req.TotalAmount)
	}
	c := &domain.Contract{
		FreelancerUserID:       freelancerUserID,
		FreelancerName:         req.FreelancerName,
		ProjectCategory:        req.ProjectCategory,
		ProjectName:            req.ProjectName,
		Description:            req.Description,
		DueDate:                req.DueDate,
		TotalAmount:            req.TotalAmount,
		Currency:               currency,
		PRDFileURL:             req.PRDFileURL,
		SubmissionCriteria:     req.SubmissionCriteria,
		ClientName:             req.ClientName,
		ClientCompanyName:      req.ClientCompanyName,
		ClientEmail:            req.ClientEmail,
		ClientPhone:            req.ClientPhone,
		ClientCountry:          req.ClientCountry,
		TermsAndConditions:     req.TermsAndConditions,
		StartDate:              req.StartDate,
		RevisionPolicy:         req.RevisionPolicy,
		OutOfScopeWork:         req.OutOfScopeWork,
		IntellectualProperty:   req.IntellectualProperty,
		EstimatedDuration:      req.EstimatedDuration,
		PaymentMethod:          req.PaymentMethod,
		AdvancePaymentRequired: req.AdvancePaymentRequired,
		AdvancePaymentAmount:   req.AdvancePaymentAmount,
		Status:                 domain.ContractStatusDraft,
		ClientViewToken:        uuid.New().String(),
	}
	ms := milestonesFromInput(req.Milestones)
	if err := s.repo.Create(ctx, c, ms); err != nil {
		return nil, err
	}
	return s.toResponse(c, ms), nil
}

func (s *ContractService) GetByID(ctx context.Context, id uint, freelancerUserID uint) (*dto.ContractResponse, error) {
	c, err := s.repo.GetByID(ctx, id, freelancerUserID)
	if err != nil {
		return nil, err
	}
	return s.contractToResponse(c), nil
}

// GetRawContract returns the raw domain contract for internal use (e.g. certificate generation).
func (s *ContractService) GetRawContract(ctx context.Context, id uint, freelancerUserID uint) (*domain.Contract, error) {
	return s.repo.GetByID(ctx, id, freelancerUserID)
}

func (s *ContractService) List(ctx context.Context, freelancerUserID uint, status string, page, limit int) ([]*dto.ContractResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	list, total, err := s.repo.ListByFreelancer(ctx, freelancerUserID, status, page, limit)
	if err != nil {
		return nil, 0, err
	}
	out := make([]*dto.ContractResponse, len(list))
	for i, c := range list {
		out[i] = s.contractToResponse(c)
	}
	return out, total, nil
}

func (s *ContractService) Update(ctx context.Context, id uint, freelancerUserID uint, req *dto.UpdateContractRequest) (*dto.ContractResponse, error) {
	c, err := s.repo.GetByID(ctx, id, freelancerUserID)
	if err != nil {
		return nil, err
	}
	if c.Status != domain.ContractStatusDraft && c.Status != domain.ContractStatusPending {
		return nil, ErrNotDraft
	}

	// If the contract was pending client review, and freelancer updates it, flag it as revised
	if c.Status == domain.ContractStatusPending {
		c.IsRevised = true
	}

	applyUpdate(c, req)

	var finalMilestones []domain.ContractMilestone
	if len(req.Milestones) > 0 {
		existingMap := make(map[uint]domain.ContractMilestone)
		for _, em := range c.Milestones {
			existingMap[em.ID] = em
		}

		for _, mReq := range req.Milestones {
			var m domain.ContractMilestone
			if mReq.ID != nil && *mReq.ID > 0 {
				existing, exists := existingMap[*mReq.ID]
				if !exists {
					return nil, fmt.Errorf("milestone ID %d does not belong to this contract", *mReq.ID)
				}
				m = existing

				if mReq.Title != nil {
					m.Title = *mReq.Title
				}
				if mReq.Description != nil {
					m.Description = *mReq.Description
				}
				if mReq.Amount != nil {
					m.Amount = *mReq.Amount
				}
				if mReq.DueDate != nil {
					m.DueDate = mReq.DueDate
				}
				if mReq.SubmissionCriteria != nil {
					if b, err := json.Marshal(mReq.SubmissionCriteria); err == nil {
						m.SubmissionCriteria = string(b)
					}
				}
				if mReq.CompletionCriteriaTC != nil {
					m.CompletionCriteriaTC = *mReq.CompletionCriteriaTC
				}
			} else {
				// New milestone, require Title and Amount
				if mReq.Title == nil {
					return nil, errors.New("title is required for new milestones")
				}
				if mReq.Amount == nil {
					return nil, errors.New("amount is required for new milestones")
				}
				m.Title = *mReq.Title
				m.Amount = *mReq.Amount
				if mReq.Description != nil {
					m.Description = *mReq.Description
				}
				m.DueDate = mReq.DueDate
				if mReq.SubmissionCriteria != nil {
					if b, err := json.Marshal(mReq.SubmissionCriteria); err == nil {
						m.SubmissionCriteria = string(b)
					}
				} else {
					m.SubmissionCriteria = "null"
				}
				if mReq.CompletionCriteriaTC != nil {
					m.CompletionCriteriaTC = *mReq.CompletionCriteriaTC
				}
				m.Status = "pending"
			}
			finalMilestones = append(finalMilestones, m)
		}
	} else {
		finalMilestones = c.Milestones
	}

	// Validate milestone amounts if milestones are updated or total amount is updated
	if len(req.Milestones) > 0 || req.TotalAmount != nil {
		var sum float64
		for _, m := range finalMilestones {
			sum += m.Amount
		}
		if stringifyAmount(sum) != stringifyAmount(c.TotalAmount) {
			return nil, fmt.Errorf("sum of milestone amounts (%f) does not match total amount (%f)", sum, c.TotalAmount)
		}
	}

	if len(req.Milestones) > 0 {
		if err := s.repo.Update(ctx, c, finalMilestones); err != nil {
			return nil, err
		}
		c.Milestones = finalMilestones
	} else {
		if err := s.repo.UpdateContractOnly(ctx, c); err != nil {
			return nil, err
		}
	}
	return s.contractToResponse(c), nil
}

func (s *ContractService) UpdateIsPublic(ctx context.Context, id uint, freelancerUserID uint, isPublic bool) error {
	return s.repo.UpdateIsPublic(ctx, id, freelancerUserID, isPublic)
}

func (s *ContractService) GetPublicByFreelancer(ctx context.Context, freelancerUserID uint) ([]*dto.ContractResponse, error) {
	list, err := s.repo.GetPublicByFreelancer(ctx, freelancerUserID)
	if err != nil {
		return nil, err
	}
	out := make([]*dto.ContractResponse, len(list))
	for i, c := range list {
		out[i] = s.contractToResponse(c)
	}
	return out, nil
}

func (s *ContractService) Send(ctx context.Context, id uint, freelancerUserID uint) (*dto.ContractResponse, error) {
	c, err := s.repo.GetByID(ctx, id, freelancerUserID)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	switch c.Status {
	case domain.ContractStatusSent:
		return nil, ErrAlreadySent
	case domain.ContractStatusDraft:
		clientToken := uuid.New().String()
		if err := s.repo.UpdateStatusSentAtAndClientToken(ctx, id, freelancerUserID, domain.ContractStatusSent, &now, clientToken); err != nil {
			return nil, err
		}
		c.Status = domain.ContractStatusSent
		c.SentAt = &now
		c.ClientViewToken = clientToken
		shareableLink := s.buildShareableLinkForContract(c)
		go s.notifier.NotifyContractSent(context.Background(), id, c.ClientEmail, shareableLink)
		return s.contractToResponse(c), nil
	case domain.ContractStatusPending:
		if err := s.repo.UpdateStatusAndSentAt(ctx, id, freelancerUserID, domain.ContractStatusSent, &now); err != nil {
			return nil, err
		}
		c.Status = domain.ContractStatusSent
		c.SentAt = &now

		// Ensure the client receives the updated contract notification
		shareableLink := s.buildShareableLinkForContract(c)
		go s.notifier.NotifyContractSent(context.Background(), id, c.ClientEmail, shareableLink)

		return s.contractToResponse(c), nil
	default:
		return nil, ErrNotDraft
	}
}

// GetByClientToken returns the contract for the client view (no auth). Token is the client_view_token from the link.
func (s *ContractService) GetByClientToken(ctx context.Context, token string) (*dto.PublicContractViewResponse, error) {
	c, err := s.repo.FindByClientViewToken(ctx, token)
	if err != nil {
		return nil, err
	}
	return toPublicViewResponse(c), nil
}

// SendForReview sets status to pending and stores the client's comment. Allowed only when status is sent.
func (s *ContractService) SendForReview(ctx context.Context, token string, req *dto.SendForReviewRequest) error {
	c, err := s.repo.FindByClientViewToken(ctx, token)
	if err != nil {
		return err
	}
	if c.Status == domain.ContractStatusPending {
		return ErrAlreadyPending
	}
	if c.Status != domain.ContractStatusSent {
		return repository.ErrContractNotFound
	}
	return s.repo.UpdateToPendingByToken(ctx, token, strings.TrimSpace(req.Comment))
}

// SendSignOTP generates and emails a 6-digit OTP to the client for signature verification.
func (s *ContractService) SendSignOTP(ctx context.Context, token string, req *dto.SendOTPRequest) error {
	fmt.Printf("[SendSignOTP Debug] Started for token %s, email %s\n", token, req.Email)
	c, err := s.repo.FindByClientViewToken(ctx, token)
	if err != nil {
		fmt.Printf("[SendSignOTP Debug] FindByClientViewToken failed: %v\n", err)
		return err
	}
	fmt.Printf("[SendSignOTP Debug] Found contract: ID %d, Status %s\n", c.ID, c.Status)
	if c.Status != domain.ContractStatusSent && c.Status != domain.ContractStatusSigned && c.Status != domain.ContractStatusActive {
		fmt.Printf("[SendSignOTP Debug] Invalid status: %s\n", c.Status)
		return repository.ErrContractNotFound
	}
	if !strings.EqualFold(strings.TrimSpace(c.ClientEmail), strings.TrimSpace(req.Email)) {
		fmt.Printf("[SendSignOTP Debug] Email mismatch: expected %s, got %s\n", c.ClientEmail, req.Email)
		return errors.New("email does not match the registered client email for this contract")
	}

	if c.LastOTPSentAt != nil && time.Since(*c.LastOTPSentAt) < 60*time.Second {
		fmt.Printf("[SendSignOTP Debug] Cooldown active\n")
		return errors.New("OTP cooldown in effect, please wait 60 seconds before requesting a new one")
	}

	max := big.NewInt(1000000)
	n, _ := rand.Int(rand.Reader, max)
	otp := fmt.Sprintf("%06d", n.Int64())
	expiresAt := time.Now().Add(10 * time.Minute)

	if err := s.repo.SaveSignOTP(ctx, token, otp, expiresAt); err != nil {
		return err
	}

	s.notifier.SendSigningOTP(context.Background(), c.ClientEmail, otp, c.ProjectName)
	return nil
}

// Sign records client sign with required company_address and optional metadata. Allowed only when status is sent.
// Requires OTP validation.
// After sign, writes contract to blockchain (async) and updates blockchain metadata.
func (s *ContractService) Sign(ctx context.Context, token string, req *dto.SignRequest) (*dto.PublicContractViewResponse, error) {
	if err := validateCompanyAddress(req.CompanyAddress); err != nil {
		return nil, err
	}
	c, err := s.repo.FindByClientViewToken(ctx, token)
	if err != nil {
		return nil, err
	}
	if c.Status == domain.ContractStatusSigned {
		return nil, ErrAlreadySigned
	}
	if c.Status != domain.ContractStatusSent {
		return nil, repository.ErrContractNotFound
	}

	if c.SignOTP == "" {
		return nil, errors.New("please request an OTP before signing")
	}
	if c.SignOTP != req.OTP {
		return nil, errors.New("invalid OTP")
	}
	if c.OTPExpiresAt == nil || time.Now().After(*c.OTPExpiresAt) {
		return nil, errors.New("OTP has expired, please request a new one")
	}

	meta := signMetadataFromRequest(req)
	meta["otp_verified"] = true
	metaJSON, _ := json.Marshal(meta)
	now := time.Now()
	if err := s.repo.UpdateToSigned(ctx, c.ID, &now, strings.TrimSpace(req.CompanyAddress), string(metaJSON)); err != nil {
		return nil, err
	}
	c.Status = domain.ContractStatusSigned
	c.ClientSignedAt = &now
	c.ClientCompanyAddress = strings.TrimSpace(req.CompanyAddress)

	return toPublicViewResponse(c), nil
}

// ProcessOutbox processes pending blockchain write tasks. Designed to be called by a cron job.
func (s *ContractService) ProcessOutbox(ctx context.Context) {
	if s.blockchainClient == nil {
		return
	}

	tasks, err := s.repo.FetchPendingOutboxTasks(ctx, 10)
	if err != nil || len(tasks) == 0 {
		return
	}

	for _, task := range tasks {
		// Mark as processing
		if err := s.repo.MarkOutboxTaskProcessing(ctx, task.ID); err != nil {
			continue
		}

		c, err := s.repo.GetContractInternal(ctx, task.ContractID)
		if err != nil {
			_ = s.repo.UpdateOutboxTaskResult(ctx, task.ID, domain.OutboxStatusFailed, fmt.Sprintf("fetch contract: %v", err), task.RetryCount+1)
			continue
		}

		contractHash := blockchain.ComputeContractHash(
			c.ID,
			"", // freelancer email not stored on contract; would need to fetch from user-service
			c.ClientEmail,
			c.TotalAmount,
			c.Currency,
			c.ProjectName,
			c.DueDate,
		)

		req := blockchain.WriteContractRequest{
			ContractID:      c.ID,
			FreelancerID:    c.FreelancerUserID,
			ClientID:        0,  // Client may not be a platform user
			FreelancerEmail: "", // Would need to fetch from user-service
			ClientEmail:     c.ClientEmail,
			TotalAmount:     c.TotalAmount,
			Currency:        c.Currency,
			ProjectName:     c.ProjectName,
			ContractHash:    contractHash,
		}
		if c.DueDate != nil {
			req.DueDate = c.DueDate.Format(time.RFC3339)
		}

		resp, err := s.blockchainClient.WriteContract(ctx, req)
		if err != nil {
			_ = s.repo.UpdateOutboxTaskResult(ctx, task.ID, domain.OutboxStatusFailed, err.Error(), task.RetryCount+1)
			continue
		}

		// Success
		_ = s.repo.UpdateBlockchainMetadata(
			ctx,
			c.ID,
			resp.TransactionHash,
			resp.TransactionID,
			resp.Network,
			resp.Status,
			resp.BlockNumber,
			resp.GasUsed,
		)
		_ = s.repo.UpdateOutboxTaskResult(ctx, task.ID, domain.OutboxStatusSuccess, "", task.RetryCount+1)
	}
}

func validateCompanyAddress(s string) error {
	s = strings.TrimSpace(s)
	if s == "" {
		return ErrInvalidCompanyAddr
	}
	if strings.EqualFold(s, "Remote") {
		return nil
	}
	if len(s) > 500 {
		return ErrInvalidCompanyAddr
	}
	// if it looks like a URL, validate
	if strings.HasPrefix(s, "http://") || strings.HasPrefix(s, "https://") {
		if u, err := url.Parse(s); err != nil || u.Host == "" {
			return ErrInvalidCompanyAddr
		}
	}
	return nil
}

func signMetadataFromRequest(req *dto.SignRequest) map[string]interface{} {
	m := make(map[string]interface{})
	if req.Email != "" {
		m["email"] = strings.TrimSpace(req.Email)
	}
	if req.Phone != "" {
		m["phone"] = strings.TrimSpace(req.Phone)
	}
	if req.CompanyName != "" {
		m["company_name"] = strings.TrimSpace(req.CompanyName)
	}
	if req.GSTNumber != "" {
		m["gst_number"] = strings.TrimSpace(req.GSTNumber)
	}
	if req.BusinessEmail != "" {
		m["business_email"] = strings.TrimSpace(req.BusinessEmail)
	}
	if req.Instagram != "" {
		m["instagram"] = strings.TrimSpace(req.Instagram)
	}
	if req.LinkedIn != "" {
		m["linkedin"] = strings.TrimSpace(req.LinkedIn)
	}
	return m
}

func toPublicViewResponse(c *domain.Contract) *dto.PublicContractViewResponse {
	return &dto.PublicContractViewResponse{
		ID:                     c.ID,
		FreelancerName:         c.FreelancerName,
		ProjectCategory:        c.ProjectCategory,
		ProjectName:            c.ProjectName,
		Description:            c.Description,
		DueDate:                c.DueDate,
		TotalAmount:            c.TotalAmount,
		Currency:               c.Currency,
		PRDFileURL:             c.PRDFileURL,
		SubmissionCriteria:     c.SubmissionCriteria,
		ClientName:             c.ClientName,
		ClientCompanyName:      c.ClientCompanyName,
		ClientEmail:            c.ClientEmail,
		ClientPhone:            c.ClientPhone,
		ClientCountry:          c.ClientCountry,
		TermsAndConditions:     c.TermsAndConditions,
		StartDate:              c.StartDate,
		RevisionPolicy:         c.RevisionPolicy,
		OutOfScopeWork:         c.OutOfScopeWork,
		IntellectualProperty:   c.IntellectualProperty,
		EstimatedDuration:      c.EstimatedDuration,
		PaymentMethod:          c.PaymentMethod,
		AdvancePaymentRequired: c.AdvancePaymentRequired,
		AdvancePaymentAmount:   c.AdvancePaymentAmount,
		Status:                 c.Status,
		IsRevised:              c.IsRevised,
		SentAt:                 c.SentAt,
		ClientSignedAt:         c.ClientSignedAt,
		ClientReviewComment:    c.ClientReviewComment,
		ClientViewToken:        c.ClientViewToken,
		Milestones:             milestonesToResponse(c.Milestones),
		CreatedAt:              c.CreatedAt,
		UpdatedAt:              c.UpdatedAt,
	}
}

func (s *ContractService) Delete(ctx context.Context, id uint, freelancerUserID uint) error {
	c, err := s.repo.GetByID(ctx, id, freelancerUserID)
	if err != nil {
		return err
	}
	if c.Status != domain.ContractStatusDraft {
		return ErrNotDraft
	}
	return s.repo.Delete(ctx, id, freelancerUserID)
}

// DeleteExpiredDrafts permanently deletes draft contracts older than draftExpiryDays. Returns the number deleted.
// Used by the scheduled draft-cleanup job.
func (s *ContractService) DeleteExpiredDrafts(ctx context.Context) (int64, error) {
	cutoff := time.Now().Add(-time.Duration(s.draftExpiryDays) * 24 * time.Hour)
	return s.repo.DeleteDraftsOlderThan(ctx, cutoff)
}

func (s *ContractService) buildShareableLink(contractID uint) string {
	if s.shareableLinkBaseURL == "" {
		return ""
	}
	return s.shareableLinkBaseURL + "/" + strconv.FormatUint(uint64(contractID), 10)
}

// buildShareableLinkForContract returns the client-facing link: base/token when token is set, else base/id.
func (s *ContractService) buildShareableLinkForContract(c *domain.Contract) string {
	if c.Status == domain.ContractStatusDraft || c.ClientViewToken == "" {
		return ""
	}
	return fmt.Sprintf("%s/%s", s.shareableLinkBaseURL, c.ClientViewToken)
}

func milestonesFromInput(in []dto.MilestoneInput) []domain.ContractMilestone {
	out := make([]domain.ContractMilestone, len(in))
	for i := range in {
		subCriteriaStr := "null"
		if in[i].SubmissionCriteria != nil {
			if b, err := json.Marshal(in[i].SubmissionCriteria); err == nil {
				subCriteriaStr = string(b)
			}
		}

		out[i] = domain.ContractMilestone{
			OrderIndex:           i,
			Title:                in[i].Title,
			Description:          in[i].Description,
			Amount:               in[i].Amount,
			DueDate:              in[i].DueDate,
			SubmissionCriteria:   subCriteriaStr,
			CompletionCriteriaTC: in[i].CompletionCriteriaTC,
			Status:               "pending",
		}
	}
	return out
}

func applyUpdate(c *domain.Contract, req *dto.UpdateContractRequest) {
	if req.ProjectCategory != nil {
		c.ProjectCategory = *req.ProjectCategory
	}
	if req.ProjectName != nil {
		c.ProjectName = *req.ProjectName
	}
	if req.Description != nil {
		c.Description = *req.Description
	}
	if req.DueDate != nil {
		c.DueDate = req.DueDate
	}
	if req.TotalAmount != nil {
		c.TotalAmount = *req.TotalAmount
	}
	if req.Currency != nil {
		c.Currency = *req.Currency
	}
	if req.PRDFileURL != nil {
		c.PRDFileURL = *req.PRDFileURL
	}
	if req.SubmissionCriteria != nil {
		c.SubmissionCriteria = *req.SubmissionCriteria
	}
	if req.ClientName != nil {
		c.ClientName = *req.ClientName
	}
	if req.ClientCompanyName != nil {
		c.ClientCompanyName = *req.ClientCompanyName
	}
	if req.ClientEmail != nil {
		c.ClientEmail = *req.ClientEmail
	}
	if req.ClientPhone != nil {
		c.ClientPhone = *req.ClientPhone
	}
	if req.ClientCountry != nil {
		c.ClientCountry = *req.ClientCountry
	}
	if req.TermsAndConditions != nil {
		c.TermsAndConditions = *req.TermsAndConditions
	}
	if req.StartDate != nil {
		c.StartDate = req.StartDate
	}
	if req.RevisionPolicy != nil {
		c.RevisionPolicy = *req.RevisionPolicy
	}
	if req.OutOfScopeWork != nil {
		c.OutOfScopeWork = *req.OutOfScopeWork
	}
	if req.IntellectualProperty != nil {
		c.IntellectualProperty = *req.IntellectualProperty
	}
	if req.EstimatedDuration != nil {
		c.EstimatedDuration = *req.EstimatedDuration
	}
	if req.PaymentMethod != nil {
		c.PaymentMethod = *req.PaymentMethod
	}
	if req.AdvancePaymentRequired != nil {
		c.AdvancePaymentRequired = *req.AdvancePaymentRequired
	}
	if req.AdvancePaymentAmount != nil {
		c.AdvancePaymentAmount = *req.AdvancePaymentAmount
	}
	if req.IsPublic != nil {
		c.IsPublic = *req.IsPublic
	}
}

func (s *ContractService) toResponse(c *domain.Contract, ms []domain.ContractMilestone) *dto.ContractResponse {
	shareable := s.buildShareableLinkForContract(c)
	return s.toResponseWithShareable(c, ms, shareable)
}

// stringifyAmount helps compare floats safely with 2 decimals
func stringifyAmount(v float64) string {
	return fmt.Sprintf("%.2f", v)
}

func (s *ContractService) toResponseWithShareable(c *domain.Contract, ms []domain.ContractMilestone, shareableLink string) *dto.ContractResponse {
	return &dto.ContractResponse{
		ID:                     c.ID,
		FreelancerUserID:       c.FreelancerUserID,
		ProjectCategory:        c.ProjectCategory,
		ProjectName:            c.ProjectName,
		Description:            c.Description,
		DueDate:                c.DueDate,
		TotalAmount:            c.TotalAmount,
		Currency:               c.Currency,
		PRDFileURL:             c.PRDFileURL,
		SubmissionCriteria:     c.SubmissionCriteria,
		ClientName:             c.ClientName,
		ClientCompanyName:      c.ClientCompanyName,
		ClientEmail:            c.ClientEmail,
		ClientPhone:            c.ClientPhone,
		ClientCountry:          c.ClientCountry,
		TermsAndConditions:     c.TermsAndConditions,
		StartDate:              c.StartDate,
		RevisionPolicy:         c.RevisionPolicy,
		OutOfScopeWork:         c.OutOfScopeWork,
		IntellectualProperty:   c.IntellectualProperty,
		EstimatedDuration:      c.EstimatedDuration,
		PaymentMethod:          c.PaymentMethod,
		AdvancePaymentRequired: c.AdvancePaymentRequired,
		AdvancePaymentAmount:   c.AdvancePaymentAmount,
		Status:                 c.Status,
		IsRevised:              c.IsRevised,
		DraftCount:             c.DraftCount,
		SentAt:                 c.SentAt,
		ClientSignedAt:         c.ClientSignedAt,
		ClientViewToken:        c.ClientViewToken,
		ShareableLink:          shareableLink,
		ClientReviewComment:    c.ClientReviewComment,
		IsPublic:               c.IsPublic,
		Milestones:             milestonesToResponse(ms),
		CreatedAt:              c.CreatedAt,
		UpdatedAt:              c.UpdatedAt,
	}
}

func (s *ContractService) contractToResponse(c *domain.Contract) *dto.ContractResponse {
	return s.toResponse(c, c.Milestones)
}

func milestonesToResponse(ms []domain.ContractMilestone) []dto.MilestoneResponse {
	out := make([]dto.MilestoneResponse, len(ms))
	for i := range ms {
		out[i] = dto.MilestoneResponse{
			ID:                   ms[i].ID,
			OrderIndex:           ms[i].OrderIndex,
			Title:                ms[i].Title,
			Description:          ms[i].Description,
			Amount:               ms[i].Amount,
			DueDate:              ms[i].DueDate,
			SubmissionCriteria:   ms[i].SubmissionCriteria,
			CompletionCriteriaTC: ms[i].CompletionCriteriaTC,
			Status:               ms[i].Status,
			LastDraftAt:          ms[i].LastDraftAt,
			CreatedAt:            ms[i].CreatedAt,
			UpdatedAt:            ms[i].UpdatedAt,
		}

		if ms[i].LatestSubmission != nil {
			var subData map[string]interface{}
			_ = json.Unmarshal([]byte(ms[i].LatestSubmission.SubmittedData), &subData)

			out[i].LatestSubmission = &dto.SubmissionResponse{
				ID:              ms[i].LatestSubmission.ID,
				Status:          ms[i].LatestSubmission.Status,
				SubmittedData:   subData,
				Description:     ms[i].LatestSubmission.Description,
				RevisionHistory: ms[i].LatestSubmission.RevisionHistory,
				SubmittedAt:     ms[i].LatestSubmission.SubmittedAt,
			}
		}
	}
	return out
}

func (s *ContractService) ExtractFromPRD(ctx context.Context, prdURL string) (*dto.ExtractedContract, string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, prdURL, nil)
	if err != nil {
		return nil, "", fmt.Errorf("invalid PRD URL: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("failed to download PRD: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return nil, "", fmt.Errorf("failed to download PRD: status %d", resp.StatusCode)
	}

	rawBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", fmt.Errorf("failed to read PRD: %w", err)
	}

	return s.ExtractFromPRDBytes(ctx, rawBytes)
}

// ExtractFromPRDBytes intercepts a PRD document from memory and generates the contract structure
// using the Groq LLM API. It avoids network 401/404 CDN delivery blocks by processing the file internally.
// The returned plainText is the extracted PRD body (capped) for optional client-side session caching and milestone AI context.
func (s *ContractService) ExtractFromPRDBytes(ctx context.Context, rawBytes []byte) (*dto.ExtractedContract, string, error) {
	groqAPIKey := os.Getenv("GROQ_API_KEY")
	groqModel := os.Getenv("GROQ_MODEL")
	if groqModel == "" {
		groqModel = "llama-3.3-70b-versatile"
	}
	if groqAPIKey == "" {
		return nil, "", errors.New("GROQ_API_KEY not configured")
	}

	var rawText string
	// Attempt to parse as PDF first
	reader, err := pdf.NewReader(bytes.NewReader(rawBytes), int64(len(rawBytes)))
	if err == nil {
		b, err := reader.GetPlainText()
		if err == nil {
			buf := new(bytes.Buffer)
			if _, err := buf.ReadFrom(b); err == nil {
				rawText = buf.String()
			}
		}
	}

	// Fallback to raw string if PDF parsing yielded nothing or failed (e.g., standard text/markdown files)
	if strings.TrimSpace(rawText) == "" {
		rawText = string(rawBytes)
	}

	if len(rawText) > 100000 {
		rawText = rawText[:100000]
	}
	plainTextForClient := rawText

	systemPrompt := `You are an AI assistant that extracts structured contract data from PRD documents.
Extract the following fields from the provided PRD text and return ONLY a valid JSON object (no extra text):

{
  "project_title": "string",
  "project_type": "string (e.g. Web Development, Mobile App, Design, Marketing, Writing, Data Science, Other)",
  "project_description": "string",
  "terms_and_conditions": "string",
  "start_date": "YYYY-MM-DD or empty",
  "deadline": "YYYY-MM-DD or empty",
  "client": {
    "name": "string or empty",
    "email": "string or empty",
    "phone": "string or empty",
    "company": "string or empty",
    "country": "string or empty"
  },
  "scope": "string",
  "deliverables": "string",
  "payment_terms": "string"
}

If a field is not found, use an empty string or omit it. Ensure all dates are in YYYY-MM-DD format.`

	groqPayload := map[string]interface{}{
		"model": groqModel,
		"messages": []map[string]interface{}{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": "Extract contract data from this PRD:\n\n" + rawText},
		},
		"temperature":     0.2,
		"max_tokens":      2048,
		"response_format": map[string]string{"type": "json_object"},
	}

	payloadBytes, err := json.Marshal(groqPayload)
	if err != nil {
		return nil, plainTextForClient, fmt.Errorf("failed to marshal Groq request: %w", err)
	}

	groqReq, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, plainTextForClient, fmt.Errorf("failed to create Groq request: %w", err)
	}
	groqReq.Header.Set("Content-Type", "application/json")
	groqReq.Header.Set("Authorization", "Bearer "+groqAPIKey)

	groqResp, err := http.DefaultClient.Do(groqReq)
	if err != nil {
		return nil, plainTextForClient, fmt.Errorf("failed to call Groq: %w", err)
	}
	defer groqResp.Body.Close()
	if groqResp.StatusCode >= 300 {
		body, _ := io.ReadAll(groqResp.Body)
		return nil, plainTextForClient, fmt.Errorf("Groq API error %d: %s", groqResp.StatusCode, string(body))
	}

	var groqOut struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(groqResp.Body).Decode(&groqOut); err != nil {
		return nil, plainTextForClient, fmt.Errorf("failed to parse Groq response: %w", err)
	}
	if len(groqOut.Choices) == 0 {
		return nil, plainTextForClient, errors.New("Groq returned no choices")
	}

	content := groqOut.Choices[0].Message.Content

	var extracted dto.ExtractedContract
	if err := json.Unmarshal([]byte(content), &extracted); err != nil {
		return nil, plainTextForClient, fmt.Errorf("failed to parse extracted JSON: %w", err)
	}

	return &extracted, plainTextForClient, nil
}

// SuggestMilestones calls Groq to propose milestone breakdowns for Indian freelancer–client workflows.
func (s *ContractService) SuggestMilestones(ctx context.Context, req *dto.SuggestMilestonesRequest) (*dto.SuggestMilestonesResponse, error) {
	groqAPIKey := os.Getenv("GROQ_API_KEY")
	groqModel := os.Getenv("GROQ_MODEL")
	if groqModel == "" {
		groqModel = "llama-3.3-70b-versatile"
	}
	if groqAPIKey == "" {
		return nil, errors.New("GROQ_API_KEY not configured")
	}

	currency := req.Currency
	if currency == "" {
		currency = "INR"
	}

	systemPrompt := `You are an expert freelance contract advisor for the Indian market (Indian freelancers and Indian/international clients, INR-friendly payment schedules, milestone-based payouts common on Upwork-style and direct contracts).

Given project context and a FIXED total contract amount, output ONLY valid JSON (no markdown) with this exact shape:
{"milestones":[{"title":"string","description":"string","amount":number,"due_date":"YYYY-MM-DD or empty","submission_criteria":"Link|Video|Docs|Photos","completion_criteria_tc":"short string"}]}

Rules:
- Create between 4 and 8 milestones unless the project is very small (minimum 3 milestones).
- The sum of all "amount" fields MUST equal the given total_amount exactly (2 decimal places).
- Order milestones logically (kickoff/deposit → design/build → review → final delivery/handover).
- Amounts should reflect realistic phase splits for Indian freelancers (e.g. 15–30% upfront or first milestone, progressive payments, final milestone for delivery/UAT).
- Spread due_date values between start and deadline when dates are provided; otherwise leave due_date empty strings.
- Descriptions should be concrete and tied to scope/deliverables.
- submission_criteria should be one of: Link, Video, Docs, Photos`

	userPayload := fmt.Sprintf(`Project name: %s
Category: %s
Description: %s
Total amount: %.2f %s
Start date: %s
Deadline: %s
Estimated duration: %s
Core deliverable / submission expectation: %s
Out of scope: %s
Revision policy: %s
IP terms: %s
Terms snippet: %s
PRD was uploaded by user: %v
Preferred payment method (if any): %s`,
		req.ProjectName, req.ProjectCategory, req.Description, req.TotalAmount, currency,
		req.StartDate, req.Deadline, req.EstimatedDuration,
		req.CoreDeliverable, req.OutOfScopeWork, req.RevisionPolicy,
		req.IntellectualProperty, truncateRunes(req.TermsAndConditions, 3000), req.PrdUploaded,
		req.PaymentMethod)

	if strings.TrimSpace(req.PrdExtractedText) != "" {
		userPayload += "\n\n--- Full PRD document excerpt (from user session; use for milestone phasing and deliverables) ---\n"
		userPayload += truncateRunes(req.PrdExtractedText, 12000)
	}

	groqPayload := map[string]interface{}{
		"model": groqModel,
		"messages": []map[string]interface{}{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPayload},
		},
		"temperature":     0.35,
		"max_tokens":      4096,
		"response_format": map[string]string{"type": "json_object"},
	}

	payloadBytes, err := json.Marshal(groqPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal Groq request: %w", err)
	}

	groqReq, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create Groq request: %w", err)
	}
	groqReq.Header.Set("Content-Type", "application/json")
	groqReq.Header.Set("Authorization", "Bearer "+groqAPIKey)

	groqResp, err := http.DefaultClient.Do(groqReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call Groq: %w", err)
	}
	defer groqResp.Body.Close()
	if groqResp.StatusCode >= 300 {
		body, _ := io.ReadAll(groqResp.Body)
		return nil, fmt.Errorf("Groq API error %d: %s", groqResp.StatusCode, string(body))
	}

	var groqOut struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(groqResp.Body).Decode(&groqOut); err != nil {
		return nil, fmt.Errorf("failed to parse Groq response: %w", err)
	}
	if len(groqOut.Choices) == 0 {
		return nil, errors.New("Groq returned no choices")
	}

	content := groqOut.Choices[0].Message.Content
	var parsed struct {
		Milestones []dto.SuggestedMilestoneAI `json:"milestones"`
	}
	if err := json.Unmarshal([]byte(content), &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse milestone JSON: %w", err)
	}
	if len(parsed.Milestones) == 0 {
		return nil, errors.New("model returned no milestones")
	}

	normalizeSuggestedMilestoneAmounts(parsed.Milestones, req.TotalAmount)

	return &dto.SuggestMilestonesResponse{Milestones: parsed.Milestones}, nil
}

// SuggestScope calls Groq to draft core_deliverable and out_of_scope_work from project + timeline + budget + optional PRD text.
func (s *ContractService) SuggestScope(ctx context.Context, req *dto.SuggestScopeRequest) (*dto.SuggestScopeResponse, error) {
	groqAPIKey := os.Getenv("GROQ_API_KEY")
	groqModel := os.Getenv("GROQ_MODEL")
	if groqModel == "" {
		groqModel = "llama-3.3-70b-versatile"
	}
	if groqAPIKey == "" {
		return nil, errors.New("GROQ_API_KEY not configured")
	}

	currency := req.Currency
	if currency == "" {
		currency = "INR"
	}

	systemPrompt := `You are an expert freelance contract writer for the Indian market (Indian freelancers, INR budgets, clear handoffs, Upwork-style clarity).

Output ONLY valid JSON (no markdown) with this exact shape:
{"core_deliverable":"string","out_of_scope_work":"string"}

Definitions:
- core_deliverable: Concrete, verifiable deliverables the freelancer will hand over (artifacts, URLs, repos, files, training, documentation) aligned with the project description, timeline, and budget. Use bullet-style sentences or short paragraphs; be specific (e.g. tech stack, environments, acceptance signals).
- out_of_scope_work: Explicit exclusions — what is NOT included (ongoing support hours, marketing spend, third-party fees, future phases, out-of-hours, legal advice, hardware, content the client must provide, etc.). Must complement core_deliverable (no contradiction).

Rules:
- Write in professional English; concise but complete.
- Respect the contract total and dates when inferring depth of work (smaller budgets → narrower scope).
- If PRD excerpt is provided, ground both fields in it; otherwise use project description.
- core_deliverable: at least 2 sentences or 3+ bullet lines worth of content.
- out_of_scope_work: at least 4 distinct exclusion items (phrases or short bullets).`

	userPayload := fmt.Sprintf(`Project name: %s
Category: %s
Description: %s
Total contract value: %.2f %s
Start date: %s
Deadline: %s
Estimated duration: %s
Revision policy: %s
IP / ownership terms: %s
Client name: %s
Client company: %s
PRD document was uploaded (session): %v`,
		req.ProjectName, req.ProjectCategory, req.Description, req.TotalAmount, currency,
		req.StartDate, req.Deadline, req.EstimatedDuration,
		req.RevisionPolicy, req.IntellectualProperty,
		req.ClientName, req.ClientCompany, req.PrdUploaded)

	if strings.TrimSpace(req.PrdExtractedText) != "" {
		userPayload += "\n\n--- PRD document excerpt (use for accurate scope vs exclusions) ---\n"
		userPayload += truncateRunes(req.PrdExtractedText, 12000)
	}

	groqPayload := map[string]interface{}{
		"model": groqModel,
		"messages": []map[string]interface{}{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPayload},
		},
		"temperature":     0.35,
		"max_tokens":      2048,
		"response_format": map[string]string{"type": "json_object"},
	}

	payloadBytes, err := json.Marshal(groqPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal Groq request: %w", err)
	}

	groqReq, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create Groq request: %w", err)
	}
	groqReq.Header.Set("Content-Type", "application/json")
	groqReq.Header.Set("Authorization", "Bearer "+groqAPIKey)

	groqResp, err := http.DefaultClient.Do(groqReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call Groq: %w", err)
	}
	defer groqResp.Body.Close()
	if groqResp.StatusCode >= 300 {
		body, _ := io.ReadAll(groqResp.Body)
		return nil, fmt.Errorf("Groq API error %d: %s", groqResp.StatusCode, string(body))
	}

	var groqOut struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(groqResp.Body).Decode(&groqOut); err != nil {
		return nil, fmt.Errorf("failed to parse Groq response: %w", err)
	}
	if len(groqOut.Choices) == 0 {
		return nil, errors.New("Groq returned no choices")
	}

	content := groqOut.Choices[0].Message.Content
	var parsed dto.SuggestScopeResponse
	if err := json.Unmarshal([]byte(content), &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse scope JSON: %w", err)
	}
	if strings.TrimSpace(parsed.CoreDeliverable) == "" || strings.TrimSpace(parsed.OutOfScopeWork) == "" {
		return nil, errors.New("model returned empty core_deliverable or out_of_scope_work")
	}

	return &parsed, nil
}

// SuggestTerms drafts comprehensive T&Cs for freelancer–client work (India-oriented), including anti-ghosting and integrity clauses.
func (s *ContractService) SuggestTerms(ctx context.Context, req *dto.SuggestTermsRequest) (*dto.SuggestTermsResponse, error) {
	groqAPIKey := os.Getenv("GROQ_API_KEY")
	groqModel := os.Getenv("GROQ_MODEL")
	if groqModel == "" {
		groqModel = "llama-3.3-70b-versatile"
	}
	if groqAPIKey == "" {
		return nil, errors.New("GROQ_API_KEY not configured")
	}

	currency := req.Currency
	if currency == "" {
		currency = "INR"
	}

	msJSON, err := json.MarshalIndent(req.Milestones, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to marshal milestones: %w", err)
	}

	systemPrompt := `You are a senior freelance-agreement drafter for Indian and cross-border remote work (INR and international clients). You write clear, professional contract TERMS (not legal advice).

Output ONLY valid JSON (no markdown fences) with this exact shape:
{"terms_and_conditions":"string"}

The string must be plain text using numbered sections and sub-bullets where helpful. It must be thorough (aim for substantial coverage, not one paragraph).

Required themes (integrate naturally; use headings like "1. Parties", "2. …"):
- **Disclaimer:** State that this document is a commercial agreement template, does not constitute lawyer-client advice, and parties may obtain independent legal counsel (India-relevant framing is fine).
- **Relationship:** Independent contractor / principal–service provider; not employment unless stated otherwise.
- **Services & scope:** Bind to the described project, core deliverables, and explicit out-of-scope items provided by the user.
- **Timeline & milestones:** Payments tied to milestone acceptance; reference the milestone list; late or non-delivery consequences in general terms.
- **Acceptance & revisions:** Tie to the stated revision policy; objective acceptance where possible.
- **Intellectual property:** Reflect the user's stated IP choice (client owns / shared / freelancer retains) in operative language.
- **Confidentiality:** Mutual confidentiality for business info, credentials, code, and documents; exceptions for legal requirements.
- **Ghosting, responsiveness, and abandonment:** Define reasonable communication expectations (e.g. business-day response times), escalation if a party is unresponsive, and right to pause work or terminate after written notice for prolonged silence or failure to provide required inputs—without encouraging illegal penalties; keep it commercial and balanced.
- **Integrity, cheating, and fraud:** Require good faith; accurate representations of identity and skills; original work or disclosed third-party components; no plagiarism or misrepresentation of deliverables; disclosure of subcontractors when used; no fraudulent invoices, payment evasion, or abusive chargebacks; consequences may include termination, forfeiture of unpaid amounts where appropriate, and remedies under applicable law.
- **Payment:** Currency, method context, milestone-based releases, late payment, taxes/GST mention where relevant as a general placeholder (not tax advice).
- **Warranties:** Limited warranties on deliverables; disclaimer of implied warranties where appropriate in a commercial freelance context (word carefully).
- **Liability:** Reasonable cap tied to fees paid under the agreement; exclude indirect/consequential damages except where non-waivable.
- **Indemnity:** Mutual or one-sided basics for IP infringement claims arising from materials each party supplies.
- **Termination:** For convenience with notice; for material breach; effect on payment for work completed and accepted.
- **Dispute resolution:** Good-faith negotiation, optional mediation, courts/seat in India or as fits the parties described (use neutral "courts of competent jurisdiction in India" unless user context clearly indicates otherwise).
- **Miscellaneous:** Entire agreement, amendments in writing, notices (email acceptable), severability, assignment restrictions, force majeure (brief).

Tone: firm, fair, and professional. Do not invent party legal names beyond placeholders ("Freelancer", "Client") and the names/emails supplied. Do not add cryptocurrency speculation or illegal clauses.`

	userPayload := fmt.Sprintf(`Freelancer display name (if any): %s
Client name: %s
Client company: %s
Client email: %s
Client phone: %s
Client country: %s

Project name: %s
Category: %s
Description: %s
Total contract value: %.2f %s
Start date: %s
Deadline: %s
Estimated duration: %s
Payment method: %s

Revision policy: %s
Intellectual property (as selected): %s

--- Core deliverables (in scope) ---
%s

--- Out of scope ---
%s

--- Milestones (JSON) ---
%s

PRD was uploaded (session flag): %v`,
		req.FreelancerName, req.ClientName, req.ClientCompany, req.ClientEmail, req.ClientPhone, req.ClientCountry,
		req.ProjectName, req.ProjectCategory, req.Description, req.TotalAmount, currency,
		req.StartDate, req.Deadline, req.EstimatedDuration, req.PaymentMethod,
		req.RevisionPolicy, req.IntellectualProperty,
		truncateRunes(req.CoreDeliverable, 8000),
		truncateRunes(req.OutOfScopeWork, 8000),
		string(msJSON),
		req.PrdUploaded)

	if strings.TrimSpace(req.ExistingTerms) != "" {
		userPayload += "\n\n--- Existing draft terms to refine or merge (preserve useful specifics; improve structure and gaps) ---\n"
		userPayload += truncateRunes(req.ExistingTerms, 6000)
	}

	if strings.TrimSpace(req.PrdExtractedText) != "" {
		userPayload += "\n\n--- PRD document excerpt ---\n"
		userPayload += truncateRunes(req.PrdExtractedText, 10000)
	}

	groqPayload := map[string]interface{}{
		"model": groqModel,
		"messages": []map[string]interface{}{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPayload},
		},
		"temperature":     0.25,
		"max_tokens":      8192,
		"response_format": map[string]string{"type": "json_object"},
	}

	payloadBytes, err := json.Marshal(groqPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal Groq request: %w", err)
	}

	groqReq, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create Groq request: %w", err)
	}
	groqReq.Header.Set("Content-Type", "application/json")
	groqReq.Header.Set("Authorization", "Bearer "+groqAPIKey)

	groqResp, err := http.DefaultClient.Do(groqReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call Groq: %w", err)
	}
	defer groqResp.Body.Close()
	if groqResp.StatusCode >= 300 {
		body, _ := io.ReadAll(groqResp.Body)
		return nil, fmt.Errorf("Groq API error %d: %s", groqResp.StatusCode, string(body))
	}

	var groqOut struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(groqResp.Body).Decode(&groqOut); err != nil {
		return nil, fmt.Errorf("failed to parse Groq response: %w", err)
	}
	if len(groqOut.Choices) == 0 {
		return nil, errors.New("Groq returned no choices")
	}

	content := groqOut.Choices[0].Message.Content
	var parsed dto.SuggestTermsResponse
	if err := json.Unmarshal([]byte(content), &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse terms JSON: %w", err)
	}
	if strings.TrimSpace(parsed.TermsAndConditions) == "" {
		return nil, errors.New("model returned empty terms_and_conditions")
	}

	// Match CreateContractRequest validation (max 10000 on string — truncate by runes for safety).
	parsed.TermsAndConditions = truncateRunes(parsed.TermsAndConditions, 10000)

	return &parsed, nil
}

func truncateRunes(s string, max int) string {
	if len(s) <= max {
		return s
	}
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max]) + "…"
}

func normalizeSuggestedMilestoneAmounts(m []dto.SuggestedMilestoneAI, target float64) {
	n := len(m)
	if n == 0 || target <= 0 {
		return
	}
	var sum float64
	for i := range m {
		if m[i].Amount < 0 {
			m[i].Amount = 0
		}
		sum += m[i].Amount
	}
	if sum <= 0.0001 {
		each := math.Round(target/float64(n)*100) / 100
		var running float64
		for i := 0; i < n-1; i++ {
			m[i].Amount = each
			running += each
		}
		m[n-1].Amount = math.Round((target-running)*100) / 100
		return
	}
	var newSum float64
	for i := 0; i < n-1; i++ {
		m[i].Amount = math.Round(m[i].Amount*(target/sum)*100) / 100
		newSum += m[i].Amount
	}
	m[n-1].Amount = math.Round((target-newSum)*100) / 100
	if m[n-1].Amount < 0 {
		m[n-1].Amount = 0
	}
}
