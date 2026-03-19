package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/saiyam0211/defellix/services/contract-service/internal/domain"
	"github.com/saiyam0211/defellix/services/contract-service/internal/notification"
	"github.com/saiyam0211/defellix/services/contract-service/internal/repository"
)

var (
	ErrContractNotSigned = errors.New("contract must be signed before submitting work")
	ErrNotParticipant    = errors.New("you are not a participant in this contract")
	ErrSubmissionExists  = errors.New("an active submission already exists for this milestone")
)

type SubmissionService struct {
	subRepo      repository.SubmissionRepository
	contractRepo repository.ContractRepository
	notifier     notification.ContractNotifier
	baseURL      string
}

func NewSubmissionService(subRepo repository.SubmissionRepository, contractRepo repository.ContractRepository, notifier notification.ContractNotifier, baseURL string) *SubmissionService {
	return &SubmissionService{
		subRepo:      subRepo,
		contractRepo: contractRepo,
		notifier:     notifier,
		baseURL:      baseURL,
	}
}

// CreateSubmission allows a freelancer to submit work against a signed contract
func (s *SubmissionService) CreateSubmission(ctx context.Context, contractID uint, freelancerID uint, req *domain.SubmissionRequest) (*domain.Submission, error) {
	// Verify contract exists and belongs to freelancer
	contract, err := s.contractRepo.GetByID(ctx, contractID, freelancerID)
	if err != nil {
		return nil, err
	}
	if contract.FreelancerUserID != freelancerID {
		return nil, ErrNotParticipant
	}
	if contract.Status != "signed" && contract.Status != "active" {
		return nil, ErrContractNotSigned
	}

	if req.MilestoneID != nil {
		var selectedMilestone *domain.ContractMilestone
		for i, m := range contract.Milestones {
			if m.ID == *req.MilestoneID {
				selectedMilestone = &contract.Milestones[i]
				break
			}
		}
		if selectedMilestone == nil {
			return nil, errors.New("milestone not found in this contract")
		}
		if selectedMilestone.Status == "approved" {
			return nil, errors.New("cannot submit work for an already approved milestone")
		}

		// Prevent duplicate pending submissions for the same milestone
		hasActive, err := s.subRepo.HasActiveSubmissionForMilestone(ctx, *req.MilestoneID)
		if err == nil && hasActive {
			return nil, ErrSubmissionExists
		}
	}

	// Build the JSON payload
	var submittedDataJSON string = "{}"
	if len(req.SubmittedData) > 0 {
		b, err := json.Marshal(req.SubmittedData)
		if err == nil {
			submittedDataJSON = string(b)
		}
	}

	status := domain.SubmissionStatusDraft
	if req.Status != "" {
		status = req.Status
	}

	sub := &domain.Submission{
		ContractID:      contractID,
		MilestoneID:     req.MilestoneID,
		FreelancerID:    freelancerID,
		SubmittedData:   submittedDataJSON,
		Description:     req.Description,
		Status:          status,
		RevisionHistory: "[]",
	}

	err = s.subRepo.Create(ctx, sub)
	if err != nil {
		return nil, err
	}

	// If successfully submitted for review, notify client and update milestone status
	if status == domain.SubmissionStatusPending {
		if req.MilestoneID != nil {
			_ = s.contractRepo.UpdateMilestoneStatus(ctx, *req.MilestoneID, "submitted")
		}
		baseFrontend := strings.TrimSuffix(s.baseURL, "/review-contract")
		reviewLink := fmt.Sprintf("%s/review-milestone/%s", baseFrontend, contract.ClientViewToken)
		s.notifier.NotifyWorkSubmitted(ctx, contractID, contract.ClientEmail, contract.ProjectName, reviewLink)
	}

	return sub, nil
}

// UpdateSubmission allows the freelancer to update a draft or resubmit a revision
func (s *SubmissionService) UpdateSubmission(ctx context.Context, contractID uint, submissionID uint, freelancerID uint, req *domain.UpdateSubmissionRequest) (*domain.Submission, error) {
	contract, err := s.contractRepo.GetByID(ctx, contractID, freelancerID)
	if err != nil {
		return nil, err
	}
	if contract.FreelancerUserID != freelancerID {
		return nil, ErrNotParticipant
	}

	sub, err := s.subRepo.GetByID(ctx, submissionID)
	if err != nil {
		return nil, err
	}
	if sub.ContractID != contract.ID || sub.FreelancerID != freelancerID {
		return nil, ErrNotParticipant
	}

	if sub.Status != domain.SubmissionStatusDraft && sub.Status != domain.SubmissionStatusRevision {
		return nil, errors.New("cannot edit a submission that is actively under review or already accepted")
	}

	if req.Description != nil {
		sub.Description = *req.Description
	}

	if len(req.SubmittedData) > 0 {
		b, err := json.Marshal(req.SubmittedData)
		if err == nil {
			sub.SubmittedData = string(b)
		}
	}

	oldStatus := sub.Status
	if req.Status != nil && *req.Status != "" {
		sub.Status = *req.Status
	}

	err = s.subRepo.Update(ctx, sub)
	if err != nil {
		return nil, err
	}

	// Notify client and update milestone status if transiting to pending_review
	if oldStatus != domain.SubmissionStatusPending && sub.Status == domain.SubmissionStatusPending {
		if sub.MilestoneID != nil {
			_ = s.contractRepo.UpdateMilestoneStatus(ctx, *sub.MilestoneID, "submitted")
		}
		baseFrontend := strings.TrimSuffix(s.baseURL, "/review-contract")
		reviewLink := fmt.Sprintf("%s/review-milestone/%s", baseFrontend, contract.ClientViewToken)
		s.notifier.NotifyWorkSubmitted(ctx, contractID, contract.ClientEmail, contract.ProjectName, reviewLink)
	}

	return sub, nil
}

// GetSubmissions lists all submissions for a contract (freelancer view)
func (s *SubmissionService) GetSubmissions(ctx context.Context, contractID uint, freelancerID uint) ([]*domain.Submission, error) {
	contract, err := s.contractRepo.GetByID(ctx, contractID, freelancerID)
	if err != nil {
		return nil, err
	}
	if contract.FreelancerUserID != freelancerID {
		return nil, ErrNotParticipant
	}

	return s.subRepo.GetByContractID(ctx, contractID)
}

// ClientReviewSubmission allows the client to accept or request revision
func (s *SubmissionService) ClientReviewSubmission(ctx context.Context, clientToken string, submissionID uint, req *domain.SubmissionReviewRequest) error {
	// 1. Verify token matches contract
	contract, err := s.contractRepo.FindByClientViewToken(ctx, clientToken)
	if err != nil {
		return err
	}

	// 2. Fetch Submission
	sub, err := s.subRepo.GetByID(ctx, submissionID)
	if err != nil {
		return err
	}
	if sub.ContractID != contract.ID {
		return errors.New("submission does not belong to this contract")
	}

	// 3. OTP Verification
	if contract.SignOTP == "" {
		return errors.New("please request an OTP before submitting a review")
	}
	if contract.SignOTP != req.OTP {
		return errors.New("invalid OTP")
	}
	if contract.OTPExpiresAt == nil || time.Now().After(*contract.OTPExpiresAt) {
		return errors.New("OTP has expired, please request a new one")
	}

	// 4. Update Submission Status
	now := time.Now()
	sub.ReviewedAt = &now

	if req.Action == "accept" {
		sub.Status = "accepted"

		// If submission is linked to a milestone, mark milestone as approved
		allApproved := false
		if sub.MilestoneID != nil {
			s.contractRepo.UpdateMilestoneStatus(ctx, *sub.MilestoneID, "approved")

			// Check database for any unapproved milestones
			count, err := s.contractRepo.CountUnapprovedMilestones(ctx, contract.ID)
			if err == nil && count == 0 {
				allApproved = true
			}
		}

		if allApproved {
			contract.Status = "completed"
			s.contractRepo.UpdateContractOnly(ctx, contract)
		} else if contract.Status == "signed" {
			contract.Status = "active"
			s.contractRepo.UpdateContractOnly(ctx, contract)
		}

		// Send email to freelancer: "Work accepted!"
		// TODO: We need the freelancer's email. For now we use ClientEmail as placeholder.
		// In production, this would call the User Service to fetch the freelancer's email.
		s.notifier.NotifyWorkAccepted(ctx, contract.ID, contract.ClientEmail, contract.ProjectName, 5)

		// TODO: Trigger async call to User Service Reputation Engine
	} else if req.Action == "revision" {
		sub.Status = domain.SubmissionStatusRevision

		commentText := ""
		if req.Comment != nil {
			commentText = *req.Comment
		}

		// Parse existing history, prepend new comment
		var history []domain.RevisionComment
		if sub.RevisionHistory != "" && sub.RevisionHistory != "null" {
			_ = json.Unmarshal([]byte(sub.RevisionHistory), &history)
		}

		newRev := domain.RevisionComment{
			Comment:   commentText,
			CreatedAt: time.Now(),
		}
		// prepend to keep most recent at top
		history = append([]domain.RevisionComment{newRev}, history...)

		hBytes, _ := json.Marshal(history)
		sub.RevisionHistory = string(hBytes)

		// Mark the milestone itself as revision so the freelancer dashboard/notifications detect it
		if sub.MilestoneID != nil {
			_ = s.contractRepo.UpdateMilestoneStatus(ctx, *sub.MilestoneID, "revision")
		}

		// Send email to freelancer: "Client requested revision"
		s.notifier.NotifyRevisionRequested(ctx, contract.ID, contract.ClientEmail, contract.ProjectName, commentText)

		if req.NewDueDate != nil && sub.MilestoneID != nil {
			_ = s.contractRepo.UpdateMilestoneDueDate(ctx, *sub.MilestoneID, req.NewDueDate)
		}
	}

	return s.subRepo.Update(ctx, sub)
}

// MarkGhostedSubmissions automatically marks submissions that have been pending review for too long as ghosted.
func (s *SubmissionService) MarkGhostedSubmissions(ctx context.Context) (int64, error) {
	// 14 days cutoff
	cutoff := time.Now().Add(-14 * 24 * time.Hour)
	return s.subRepo.MarkGhostedSubmissionsOlderThan(ctx, cutoff)
}
