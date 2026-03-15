package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
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
		FreelancerUserID:   freelancerUserID,
		ProjectCategory:    req.ProjectCategory,
		ProjectName:        req.ProjectName,
		Description:        req.Description,
		DueDate:            req.DueDate,
		TotalAmount:        req.TotalAmount,
		Currency:           currency,
		PRDFileURL:         req.PRDFileURL,
		SubmissionCriteria: req.SubmissionCriteria,
		ClientName:         req.ClientName,
		ClientCompanyName:  req.ClientCompanyName,
		ClientEmail:        req.ClientEmail,
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
		Status:             domain.ContractStatusDraft,
		ClientViewToken:    uuid.New().String(),
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
	c, err := s.repo.FindByClientViewToken(ctx, token)
	if err != nil {
		return err
	}
	if c.Status != domain.ContractStatusSent {
		return repository.ErrContractNotFound
	}
	if !strings.EqualFold(strings.TrimSpace(c.ClientEmail), strings.TrimSpace(req.Email)) {
		return errors.New("email does not match the registered client email for this contract")
	}

	if c.LastOTPSentAt != nil && time.Since(*c.LastOTPSentAt) < 60*time.Second {
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
			ClientID:        0, // Client may not be a platform user
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
		ID:                  c.ID,
		ProjectCategory:     c.ProjectCategory,
		ProjectName:         c.ProjectName,
		Description:         c.Description,
		DueDate:             c.DueDate,
		TotalAmount:         c.TotalAmount,
		Currency:            c.Currency,
		PRDFileURL:          c.PRDFileURL,
		SubmissionCriteria:  c.SubmissionCriteria,
		ClientName:          c.ClientName,
		ClientCompanyName:   c.ClientCompanyName,
		ClientEmail:         c.ClientEmail,
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
		Status:              c.Status,
		IsRevised:           c.IsRevised,
		SentAt:              c.SentAt,
		ClientReviewComment: c.ClientReviewComment,
		Milestones:          milestonesToResponse(c.Milestones),
		CreatedAt:           c.CreatedAt,
		UpdatedAt:           c.UpdatedAt,
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
	if s.shareableLinkBaseURL == "" {
		return ""
	}
	if c.Status == domain.ContractStatusSent && c.ClientViewToken != "" {
		return s.shareableLinkBaseURL + "/" + c.ClientViewToken
	}
	return s.shareableLinkBaseURL + "/" + strconv.FormatUint(uint64(c.ID), 10)
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
		ID:                 c.ID,
		FreelancerUserID:   c.FreelancerUserID,
		ProjectCategory:    c.ProjectCategory,
		ProjectName:        c.ProjectName,
		Description:        c.Description,
		DueDate:            c.DueDate,
		TotalAmount:        c.TotalAmount,
		Currency:           c.Currency,
		PRDFileURL:         c.PRDFileURL,
		SubmissionCriteria: c.SubmissionCriteria,
		ClientName:         c.ClientName,
		ClientCompanyName:  c.ClientCompanyName,
		ClientEmail:        c.ClientEmail,
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
		Status:             c.Status,
		IsRevised:          c.IsRevised,
		SentAt:             c.SentAt,
		ShareableLink:      shareableLink,
		ClientReviewComment: c.ClientReviewComment,
		Milestones:         milestonesToResponse(ms),
		CreatedAt:          c.CreatedAt,
		UpdatedAt:          c.UpdatedAt,
	}
}

func (s *ContractService) contractToResponse(c *domain.Contract) *dto.ContractResponse {
	return s.toResponse(c, c.Milestones)
}

func milestonesToResponse(ms []domain.ContractMilestone) []dto.MilestoneResponse {
	out := make([]dto.MilestoneResponse, len(ms))
	for i := range ms {
		out[i] = dto.MilestoneResponse{
			ID:               ms[i].ID,
			OrderIndex:       ms[i].OrderIndex,
			Title:            ms[i].Title,
			Description:      ms[i].Description,
			Amount:           ms[i].Amount,
			DueDate:          ms[i].DueDate,
			Status:           ms[i].Status,
			CreatedAt:        ms[i].CreatedAt,
			UpdatedAt:        ms[i].UpdatedAt,
		}
	}
	return out
}
