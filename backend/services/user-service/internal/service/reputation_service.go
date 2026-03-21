package service

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/saiyam0211/defellix/services/user-service/internal/domain"
	"github.com/saiyam0211/defellix/services/user-service/internal/repository"
	"gorm.io/datatypes"
)

type ReputationService struct {
	repRepo          repository.ReputationRepository
	userRepo         repository.UserRepository
	notifRepo        repository.NotificationRepository
	scoreHistoryRepo repository.ScoreHistoryRepository
}

func NewReputationService(repRepo repository.ReputationRepository, userRepo repository.UserRepository, notifRepo repository.NotificationRepository, scoreHistoryRepo repository.ScoreHistoryRepository) *ReputationService {
	return &ReputationService{
		repRepo:          repRepo,
		userRepo:         userRepo,
		notifRepo:        notifRepo,
		scoreHistoryRepo: scoreHistoryRepo,
	}
}

// GetUserScoreBreakdown fetches the user profile with score data for the GET reputation endpoint
func (s *ReputationService) GetUserScoreBreakdown(ctx context.Context, userID uint) (*domain.User, error) {
	return s.userRepo.FindByUserID(ctx, userID)
}

// CalculateAndSaveScore processes the incoming reputation request, calculates dimension scores,
// saves the individual record, and recalculates the user's full credibility score.
func (s *ReputationService) CalculateAndSaveScore(ctx context.Context, req *domain.ReputationRequest) (*domain.Reputation, error) {
	// 1. Basic Validation
	if req.ClientRating < 1 || req.ClientRating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}

	// 2. Determine on-time status
	onTime := req.SubmittedAt.Before(req.ContractDeadline) || req.SubmittedAt.Equal(req.ContractDeadline)
	daysEarlyOrLate := req.DaysEarlyOrLate
	if daysEarlyOrLate == 0 {
		diff := req.ContractDeadline.Sub(req.SubmittedAt).Hours() / 24
		daysEarlyOrLate = int(diff) // positive = early, negative = late
	}

	// ── E6: Velocity Throttle ──
	// Check how many contracts this freelancer completed in the last 7 days
	velocityDampener := 1.0
	recentReps, recentErr := s.repRepo.GetRecentByFreelancerID(ctx, req.FreelancerID, 7)
	if recentErr == nil && len(recentReps) >= 3 {
		velocityDampener = 0.5
		log.Printf("[E6] Velocity throttle: freelancer %d has %d contracts in 7 days, applying 0.5x dampener", req.FreelancerID, len(recentReps))
	}

	// Micro-contract cap: contracts under $100 contribute very little
	if req.ContractValueUSD > 0 && req.ContractValueUSD < 100 {
		velocityDampener *= 0.3
		log.Printf("[E6] Micro-contract cap: contract %d value $%.2f < $100, applying 0.3x dampener", req.ContractID, req.ContractValueUSD)
	}

	// 3. Calculate per-project dimension scores
	signals := ProjectSignals{
		ClientRating:          float64(req.ClientRating),
		DeliveryRating:        float64(maxInt(req.DeliveryRating, req.ClientRating)),
		QualityRating:         float64(maxInt(req.QualityRating, req.ClientRating)),
		CommunicationRating:   float64(maxInt(req.CommunicationRating, req.ClientRating)),
		OnTime:                onTime,
		DaysEarlyOrLate:       daysEarlyOrLate,
		RevisionCount:         req.RevisionCount,
		ContractValueUSD:      req.ContractValueUSD,
		CompletedSuccessfully: !req.WasGhosted,
		WasGhosted:            req.WasGhosted,
		DaysToComplete:        req.ActualDays,
		EstimatedDays:         req.EstimatedDays,
		ProjectAgeMonths:      0, // Current project
		VelocityDampener:      velocityDampener,
	}

	// Convert milestone ratings
	for _, r := range req.MilestoneRatings {
		signals.MilestoneRatings = append(signals.MilestoneRatings, float64(r))
	}

	singleProject := []ProjectSignals{signals}

	deliveryScore := CalculateDeliveryScore(singleProject)
	qualityScore := CalculateQualityScore(singleProject)
	profScore := CalculateProfessionalismScore(singleProject)

	// 4. Legacy compatibility calculation
	baseScore := req.ClientRating * 10
	deadlineBonus := 0
	if onTime {
		deadlineBonus = 10
	}
	revisionPenalty := req.RevisionCount * 5
	finalScore := baseScore + deadlineBonus - revisionPenalty
	if finalScore < 0 {
		finalScore = 0
	}

	// 5. Save the Reputation Record
	rep := &domain.Reputation{
		FreelancerID:           req.FreelancerID,
		ContractID:             req.ContractID,
		BaseRating:             req.ClientRating,
		DeadlineBonus:          deadlineBonus,
		RevisionPenalty:        revisionPenalty,
		CalculatedScore:        finalScore,
		DeliveryScore:          deliveryScore,
		QualityScore:           qualityScore,
		ProfessionalismScore:   profScore,
		ContractValue:          req.ContractValueUSD,
		OnTime:                 onTime,
		ClientFeedback:         req.ClientFeedback,
		DeliveryRatingRaw:      req.DeliveryRating,
		QualityRatingRaw:       req.QualityRating,
		CommunicationRatingRaw: req.CommunicationRating,
		RevisionCount:          req.RevisionCount,
		DaysEarlyOrLate:        daysEarlyOrLate,
		ClientEmail:            req.ClientEmail,
	}

	// E10: Persist milestone ratings as JSON
	if len(req.MilestoneRatings) > 0 {
		msJSON, _ := json.Marshal(req.MilestoneRatings)
		rep.MilestoneRatingsJSON = string(msJSON)
	}

	if err := s.repRepo.Create(ctx, rep); err != nil {
		return nil, err
	}

	// 6. Recalculate full user credibility score from all reputation records
	if err := s.RecalculateUserScore(ctx, req.FreelancerID); err != nil {
		// Log the error but don't fail the whole operation
		_ = err
	}

	return rep, nil
}

// RecalculateUserScore recalculates the user's full credibility score from all their reputation records
func (s *ReputationService) RecalculateUserScore(ctx context.Context, userID uint) error {
	profile, err := s.userRepo.FindByUserID(ctx, userID)
	if err != nil || profile == nil {
		return errors.New("user profile not found")
	}

	// Fetch all reputation records
	reps, err := s.repRepo.GetByFreelancerID(ctx, userID)
	if err != nil {
		return err
	}

	// Build project signals from reputation records
	var allProjects []ProjectSignals
	aggregateScore := 0

	for _, rep := range reps {
		monthsAgo := int(time.Since(rep.CreatedAt).Hours() / 24 / 30)

		// Use real per-dimension ratings when available, fall back to BaseRating
		delivRating := rep.BaseRating
		if rep.DeliveryRatingRaw > 0 {
			delivRating = rep.DeliveryRatingRaw
		}
		qualRating := rep.BaseRating
		if rep.QualityRatingRaw > 0 {
			qualRating = rep.QualityRatingRaw
		}
		commRating := rep.BaseRating
		if rep.CommunicationRatingRaw > 0 {
			commRating = rep.CommunicationRatingRaw
		}

		// E6: Calculate velocity dampener for historical records
		recordDampener := 1.0
		neighborCount := 0
		for _, other := range reps {
			if other.ID == rep.ID {
				continue
			}
			diff := rep.CreatedAt.Sub(other.CreatedAt)
			if diff < 0 {
				diff = -diff
			}
			if diff <= 7*24*time.Hour {
				neighborCount++
			}
		}
		if neighborCount >= 3 {
			recordDampener = 0.5
		}
		if rep.ContractValue > 0 && rep.ContractValue < 100 {
			recordDampener *= 0.3
		}

		p := ProjectSignals{
			ClientRating:          float64(rep.BaseRating),
			DeliveryRating:        float64(delivRating),
			QualityRating:         float64(qualRating),
			CommunicationRating:   float64(commRating),
			OnTime:                rep.OnTime,
			DaysEarlyOrLate:       rep.DaysEarlyOrLate,
			RevisionCount:         rep.RevisionCount,
			ContractValueUSD:      rep.ContractValue,
			CompletedSuccessfully: true,
			ProjectAgeMonths:      monthsAgo,
			VelocityDampener:      recordDampener,
		}

		// E10: Populate MilestoneRatings from persisted JSON
		if rep.MilestoneRatingsJSON != "" {
			var msRatings []int
			if json.Unmarshal([]byte(rep.MilestoneRatingsJSON), &msRatings) == nil {
				for _, r := range msRatings {
					p.MilestoneRatings = append(p.MilestoneRatings, float64(r))
				}
			}
		}

		allProjects = append(allProjects, p)
		aggregateScore += rep.CalculatedScore
	}

	// E9: Repeat client bonus — count distinct client emails with 2+ contracts
	clientContractCount := make(map[string]int)
	for _, rep := range reps {
		if rep.ClientEmail != "" {
			clientContractCount[rep.ClientEmail]++
		}
	}
	repeatClientBonus := 0
	for _, count := range clientContractCount {
		if count >= 2 {
			repeatClientBonus += 50
		}
	}
	if repeatClientBonus > 150 {
		repeatClientBonus = 150 // capped at 3 repeat clients
	}

	// Calculate profile/verification signals
	profileSignals := buildProfileSignals(profile)

	// Calculate dimension scores across all projects
	dims := DimensionScores{
		Delivery:        CalculateDeliveryScore(allProjects),
		Quality:         CalculateQualityScore(allProjects),
		Professionalism: CalculateProfessionalismScore(allProjects),
		Reliability:     clampInt(CalculateReliabilityScore(allProjects)+repeatClientBonus, 0, 1000),
		Expertise:       CalculateExpertiseScore(allProjects),
		Verification:    CalculateVerificationScore(profileSignals),
	}

	// If no projects, use initial score
	if len(allProjects) == 0 {
		_, dims = CalculateInitialScore(profileSignals)
	}

	// ── E2: Generate and apply deduction events from reputation data ──
	var deductions []DeductionEvent
	for _, rep := range reps {
		// Low rating deduction (1-2 stars)
		if rep.BaseRating <= 2 {
			deductions = append(deductions, DeductionEvent{
				EventType:     "low_rating",
				Severity:      1.0,
				ContractValue: rep.ContractValue,
				Rating:        rep.BaseRating,
			})
		}

		// Late delivery deduction
		if !rep.OnTime && rep.DaysEarlyOrLate < 0 {
			daysOverdue := -rep.DaysEarlyOrLate
			deductions = append(deductions, DeductionEvent{
				EventType:     "overdue",
				Severity:      float64(daysOverdue) / 30.0,
				ContractValue: rep.ContractValue,
				DaysOverdue:   daysOverdue,
			})
		}
	}

	if len(deductions) > 0 {
		dims = ApplyDeductions(dims, deductions)
	}

	// Apply inactivity decay based on last activity
	if len(reps) > 0 {
		lastActivity := reps[0].CreatedAt
		for _, rep := range reps {
			if rep.CreatedAt.After(lastActivity) {
				lastActivity = rep.CreatedAt
			}
		}
		monthsInactive := int(time.Since(lastActivity).Hours() / 24 / 30)
		if monthsInactive > 3 {
			dims = ApplyInactivityDecay(dims, monthsInactive)
		}
	}

	completedProjects := 0
	for _, p := range allProjects {
		if p.CompletedSuccessfully {
			completedProjects++
		}
	}

	overallScore := CalculateOverallScore(dims, completedProjects)
	tier := GetTierLabel(overallScore)

	// Save dimension scores as JSON
	dimsJSON, _ := json.Marshal(dims)

	// E8: Capture old score/tier for notification comparison
	oldScore := profile.CredibilityScore
	oldTier := profile.ScoreTier

	// Update user profile
	profile.CredibilityScore = overallScore
	profile.ScoreTier = tier
	profile.DimensionScores = datatypes.JSON(dimsJSON)
	profile.AggregateReputationScore = aggregateScore

	if err := s.userRepo.Update(ctx, profile); err != nil {
		return err
	}

	// E8: Emit score_updated notification if score changed
	if overallScore != oldScore && s.notifRepo != nil {
		direction := "increased"
		if overallScore < oldScore {
			direction = "decreased"
		}
		title := fmt.Sprintf("Credibility score %s: %d → %d", direction, oldScore, overallScore)
		message := fmt.Sprintf("Your credibility score %s from %d to %d", direction, oldScore, overallScore)
		if oldTier != tier {
			message += fmt.Sprintf(". Tier changed: %s → %s", oldTier, tier)
		}

		notif := &domain.ScoreNotification{
			UserID:   userID,
			Type:     "score_updated",
			Title:    title,
			Message:  message,
			OldScore: oldScore,
			NewScore: overallScore,
			OldTier:  oldTier,
			NewTier:  tier,
		}
		if err := s.notifRepo.Create(ctx, notif); err != nil {
			log.Printf("[E8] Failed to create score notification for user %d: %v", userID, err)
		}
	}

	// E12: Save score history snapshot if score changed
	if overallScore != oldScore && s.scoreHistoryRepo != nil {
		snapshot := &domain.ScoreHistory{
			UserID:              userID,
			OverallScore:        overallScore,
			ScoreTier:           tier,
			DimensionScoresJSON: datatypes.JSON(dimsJSON),
		}
		if err := s.scoreHistoryRepo.Create(ctx, snapshot); err != nil {
			log.Printf("[E12] Failed to save score history for user %d: %v", userID, err)
		}
	}

	// E11: Fire-and-forget blockchain score anchoring
	if overallScore != oldScore {
		go func() {
			timestamp := time.Now().UTC().Format(time.RFC3339)
			hashInput := string(dimsJSON) + timestamp
			hash := sha256.Sum256([]byte(hashInput))
			scoreHash := hex.EncodeToString(hash[:])

			anchorPayload := map[string]interface{}{
				"user_id":          userID,
				"dimension_scores": string(dimsJSON),
				"overall_score":    overallScore,
				"score_tier":       tier,
				"timestamp":        timestamp,
				"score_hash":       scoreHash,
			}
			payloadBytes, _ := json.Marshal(anchorPayload)
			resp, err := http.Post("http://blockchain-service:8084/api/v1/blockchain/anchor-score", "application/json", bytes.NewBuffer(payloadBytes))
			if err != nil {
				log.Printf("[E11] Failed to call blockchain-service for score anchoring: %v", err)
				return
			}
			defer resp.Body.Close()
			log.Printf("[E11] Score anchored on blockchain for user %d, status: %d", userID, resp.StatusCode)
		}()
	}

	return nil
}

// buildProfileSignals creates ProfileSignals from User data
func buildProfileSignals(user *domain.User) ProfileSignals {
	// Parse skills count
	skillCount := 0
	if user.Skills != nil {
		var skills []interface{}
		if json.Unmarshal([]byte(user.Skills), &skills) == nil {
			skillCount = len(skills)
		}
	}

	// Parse projects count
	projectCount := 0
	if user.Projects != nil {
		var projects []interface{}
		if json.Unmarshal([]byte(user.Projects), &projects) == nil {
			projectCount = len(projects)
		}
	}

	// Calculate account age
	accountAgeMonths := int(time.Since(user.CreatedAt).Hours() / 24 / 30)

	return ProfileSignals{
		HasPhoto:         user.Photo != "",
		HasBio:           user.Bio != "",
		HasSkills:        skillCount > 0,
		SkillCount:       skillCount,
		HasGitHub:        user.GitHubLink != "",
		HasLinkedIn:      user.LinkedInLink != "",
		HasPortfolio:     user.PortfolioLink != "",
		HasInstagram:     user.InstagramLink != "",
		IsEmailVerified:  user.IsVerified,
		IsPhoneVerified:  user.Phone != "",
		HasProjects:      projectCount > 0,
		ProjectCount:     projectCount,
		AccountAgeMonths: accountAgeMonths,
	}
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}
