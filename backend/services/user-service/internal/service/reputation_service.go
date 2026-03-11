package service

import (
	"context"
	"errors"

	"github.com/saiyam0211/defellix/services/user-service/internal/domain"
	"github.com/saiyam0211/defellix/services/user-service/internal/repository"
)

type ReputationService struct {
	repRepo  repository.ReputationRepository
	userRepo repository.UserRepository
}

func NewReputationService(repRepo repository.ReputationRepository, userRepo repository.UserRepository) *ReputationService {
	return &ReputationService{
		repRepo:  repRepo,
		userRepo: userRepo,
	}
}

// CalculateAndSaveScore processes the incoming reputation request, calculates the score, 
// saves the individual record, and updates the user's aggregate profile score.
func (s *ReputationService) CalculateAndSaveScore(ctx context.Context, req *domain.ReputationRequest) (*domain.Reputation, error) {
	// 1. Basic Validation
	if req.ClientRating < 1 || req.ClientRating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}

	// 2. Base Score Calculation (e.g. 1 star = 10 points, 5 stars = 50 points)
	baseScore := req.ClientRating * 10
	
	// 3. Deadline Bonus
	deadlineBonus := 0
	if req.SubmittedAt.Before(req.ContractDeadline) || req.SubmittedAt.Equal(req.ContractDeadline) {
		deadlineBonus = 10
	}

	// 4. Revision Penalty
	revisionPenalty := req.RevisionCount * 5

	// 5. Final Calculation
	finalScore := baseScore + deadlineBonus - revisionPenalty
	if finalScore < 0 {
		finalScore = 0 // Floor at 0
	}

	// 6. Save the Reputation Record
	rep := &domain.Reputation{
		FreelancerID:    req.FreelancerID,
		ContractID:      req.ContractID,
		BaseRating:      req.ClientRating,
		DeadlineBonus:   deadlineBonus,
		RevisionPenalty: revisionPenalty,
		CalculatedScore: finalScore,
		ClientFeedback:  req.ClientFeedback,
	}

	if err := s.repRepo.Create(ctx, rep); err != nil {
		return nil, err
	}

	// 7. Update User Profile's Aggregate Score
	profile, err := s.userRepo.FindByUserID(ctx, req.FreelancerID)
	if err == nil && profile != nil { // Skip if profile somehow doesn't exist yet
		profile.AggregateReputationScore += finalScore
		// Just save the entire profile to apply the new score
		_ = s.userRepo.Update(ctx, profile)
	}

	return rep, nil
}
