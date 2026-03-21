package service

import "math"

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Hybrid C+D Credibility Score Calculator
// Combines Multi-Dimensional Radar (Algorithm C) with ELO+PageRank hybrid (D)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// DimensionScores holds the 6 credibility dimensions (each 0-1000)
type DimensionScores struct {
	Delivery        int `json:"delivery"`         // On-time delivery rate
	Quality         int `json:"quality"`           // Client ratings on quality
	Professionalism int `json:"professionalism"`   // Communication, responsiveness
	Reliability     int `json:"reliability"`       // Contract completion rate, no ghosting
	Expertise       int `json:"expertise"`         // Complexity of work, repeat clients
	Verification    int `json:"verification"`      // Profile completeness, identity verification
}

// ProjectSignals captures all signals from a single project/contract for scoring
type ProjectSignals struct {
	ClientRating          float64 // 1-5 stars overall
	DeliveryRating        float64 // 1-5 stars
	QualityRating         float64 // 1-5 stars
	CommunicationRating   float64 // 1-5 stars
	MilestoneRatings      []float64 // Individual milestone ratings
	OnTime                bool    // Was the final deliverable on time?
	DaysEarlyOrLate       int     // Positive = early, negative = late
	RevisionCount         int     // Number of revisions requested
	ContractValueUSD      float64 // Contract value (for weighting)
	CompletedSuccessfully bool    // Did the contract complete (not cancelled)?
	WasGhosted            bool    // Did freelancer ghost?
	DaysToComplete        int     // Actual days to complete
	EstimatedDays         int     // Originally estimated days
	ProjectAgeMonths      int     // Months since project completed (for time decay)
	VelocityDampener      float64 // 0.0-1.0 dampener for rapid/micro contracts (default 1.0)
}

// ProfileSignals captures profile-level signals for initial + verification scoring
type ProfileSignals struct {
	HasPhoto         bool
	HasBio           bool
	HasSkills        bool
	SkillCount       int
	HasGitHub        bool
	HasLinkedIn      bool
	HasPortfolio     bool
	HasInstagram     bool
	IsEmailVerified  bool
	IsPhoneVerified  bool
	HasProjects      bool
	ProjectCount     int
	AccountAgeMonths int
}

// ── Dimension-level scoring functions ────────────────────────────────────────

// CalculateDeliveryScore measures on-time delivery reliability
// Input: per-project on-time data
// Output: 0-1000
func CalculateDeliveryScore(projects []ProjectSignals) int {
	if len(projects) == 0 {
		return 0
	}

	totalWeight := 0.0
	weightedScore := 0.0

	for _, p := range projects {
		if !p.CompletedSuccessfully {
			continue
		}
		// Time decay: recent projects matter more
		decay := timeDecay(p.ProjectAgeMonths)
		// Value weight: bigger contracts matter more
		valWeight := valueWeight(p.ContractValueUSD)
		// Velocity dampener: penalizes rapid/micro contracts
		dampener := p.VelocityDampener
		if dampener <= 0 {
			dampener = 1.0
		}
		weight := decay * valWeight * dampener

		// Base delivery score from rating (0-200 base)
		score := p.DeliveryRating / 5.0 * 200.0

		// On-time bonus (+100)
		if p.OnTime {
			score += 100.0
			// Extra bonus for early delivery
			if p.DaysEarlyOrLate > 0 {
				earlyBonus := math.Min(float64(p.DaysEarlyOrLate)*5.0, 50.0)
				score += earlyBonus
			}
		} else {
			// Late penalty
			latePenalty := math.Min(float64(-p.DaysEarlyOrLate)*10.0, 100.0)
			score -= latePenalty
		}

		// Low revision count bonus
		if p.RevisionCount <= 1 {
			score += 30.0
		} else if p.RevisionCount >= 4 {
			score -= float64(p.RevisionCount-3) * 10.0
		}

		score = clamp(score, 0, 350)

		weightedScore += score * weight
		totalWeight += weight
	}

	if totalWeight == 0 {
		return 0
	}
	// Normalize to 0-1000 (max raw is ~350, scale up)
	raw := weightedScore / totalWeight
	return int(clamp(raw/350.0*1000.0, 0, 1000))
}

// CalculateQualityScore measures quality of deliverables
func CalculateQualityScore(projects []ProjectSignals) int {
	if len(projects) == 0 {
		return 0
	}

	totalWeight := 0.0
	weightedScore := 0.0

	for _, p := range projects {
		if !p.CompletedSuccessfully {
			continue
		}
		decay := timeDecay(p.ProjectAgeMonths)
		valWeight := valueWeight(p.ContractValueUSD)
		dampener := p.VelocityDampener
		if dampener <= 0 {
			dampener = 1.0
		}
		weight := decay * valWeight * dampener

		// Quality rating contributes heavily
		score := p.QualityRating / 5.0 * 300.0

		// Average milestone ratings bonus
		if len(p.MilestoneRatings) > 0 {
			avg := average(p.MilestoneRatings)
			score += avg / 5.0 * 100.0

			// E10: Milestone consistency bonus/penalty based on variance
			if len(p.MilestoneRatings) >= 2 {
				variance := 0.0
				for _, r := range p.MilestoneRatings {
					diff := r - avg
					variance += diff * diff
				}
				variance /= float64(len(p.MilestoneRatings))
				if variance < 0.5 {
					score += 50.0 // Consistent quality across milestones
				} else if variance > 2.0 {
					score -= 30.0 // Inconsistent quality
				}
			}
		}

		// Low revisions = high quality signal
		if p.RevisionCount == 0 {
			score += 50.0
		} else if p.RevisionCount >= 3 {
			score -= float64(p.RevisionCount) * 15.0
		}

		score = clamp(score, 0, 500)

		weightedScore += score * weight
		totalWeight += weight
	}

	if totalWeight == 0 {
		return 0
	}
	raw := weightedScore / totalWeight
	return int(clamp(raw/500.0*1000.0, 0, 1000))
}

// CalculateProfessionalismScore measures communication and conduct
func CalculateProfessionalismScore(projects []ProjectSignals) int {
	if len(projects) == 0 {
		return 0
	}

	totalWeight := 0.0
	weightedScore := 0.0

	for _, p := range projects {
		decay := timeDecay(p.ProjectAgeMonths)
		valWeight := valueWeight(p.ContractValueUSD)
		dampener := p.VelocityDampener
		if dampener <= 0 {
			dampener = 1.0
		}
		weight := decay * valWeight * dampener

		score := 0.0
		if p.CompletedSuccessfully {
			score += p.CommunicationRating / 5.0 * 300.0

			// Overall client satisfaction signal
			score += p.ClientRating / 5.0 * 100.0
		}

		// Ghosting is a severe penalty
		if p.WasGhosted {
			score -= 400.0
		}

		score = clamp(score, -200, 400)

		weightedScore += score * weight
		totalWeight += weight
	}

	if totalWeight == 0 {
		return 0
	}
	// Shift range from [-200, 400] → [0, 600] → normalize to 0-1000
	raw := (weightedScore/totalWeight + 200.0) / 600.0 * 1000.0
	return int(clamp(raw, 0, 1000))
}

// CalculateReliabilityScore measures contract completion reliability
func CalculateReliabilityScore(projects []ProjectSignals) int {
	if len(projects) == 0 {
		return 0
	}

	completed := 0
	ghosted := 0
	total := len(projects)

	for _, p := range projects {
		if p.CompletedSuccessfully {
			completed++
		}
		if p.WasGhosted {
			ghosted++
		}
	}

	completionRate := float64(completed) / float64(total)
	ghostRate := float64(ghosted) / float64(total)

	// Completion rate is primary signal (0-700)
	score := completionRate * 700.0

	// Volume bonus: more completed contracts = more reliable (max +200)
	volumeBonus := math.Min(float64(completed)*20.0, 200.0)
	score += volumeBonus

	// Ghosting penalty: severe
	score -= ghostRate * 500.0

	// Consistency bonus: all projects completed = +100
	if completed == total && total >= 3 {
		score += 100.0
	}

	return int(clamp(score, 0, 1000))
}

// CalculateExpertiseScore measures growing expertise and complexity
func CalculateExpertiseScore(projects []ProjectSignals) int {
	if len(projects) == 0 {
		return 0
	}

	score := 0.0

	// Volume signals expertise (max 300 pts for 15+ projects)
	completedCount := 0
	totalValue := 0.0
	for _, p := range projects {
		if p.CompletedSuccessfully {
			completedCount++
			totalValue += p.ContractValueUSD
		}
	}
	score += math.Min(float64(completedCount)*20.0, 300.0)

	// Higher value contracts signal expertise (max 400)
	avgValue := 0.0
	if completedCount > 0 {
		avgValue = totalValue / float64(completedCount)
	}
	// Scale: avg < 500 USD = 0, avg > 5000 USD = 400
	valueScore := math.Min(math.Max(avgValue-500, 0)/4500.0*400.0, 400.0)
	score += valueScore

	// Recent high ratings signal growing expertise (max 300)
	recentHighRated := 0
	for _, p := range projects {
		if p.CompletedSuccessfully && p.ProjectAgeMonths <= 6 && p.ClientRating >= 4.0 {
			recentHighRated++
		}
	}
	score += math.Min(float64(recentHighRated)*60.0, 300.0)

	// E10: Multi-deliverable complexity bonus (+30 per 3 extra milestones, capped at +90)
	for _, p := range projects {
		if p.CompletedSuccessfully && len(p.MilestoneRatings) > 3 {
			extraMilestones := len(p.MilestoneRatings) - 3
			bonus := math.Min(float64(extraMilestones/3)*30.0, 90.0)
			score += bonus
		}
	}

	return int(clamp(score, 0, 1000))
}

// CalculateVerificationScore measures profile trust signals
func CalculateVerificationScore(profile ProfileSignals) int {
	score := 0.0

	// Photo (+80)
	if profile.HasPhoto {
		score += 80
	}
	// Bio (+80)
	if profile.HasBio {
		score += 80
	}
	// Skills (+60 base, +10 per skill up to 5)
	if profile.HasSkills {
		score += 60
		score += math.Min(float64(profile.SkillCount)*10.0, 50.0)
	}
	// Social links (+50 each, max 200)
	links := 0
	if profile.HasGitHub { links++ }
	if profile.HasLinkedIn { links++ }
	if profile.HasPortfolio { links++ }
	if profile.HasInstagram { links++ }
	score += math.Min(float64(links)*50.0, 200.0)

	// Verification
	if profile.IsEmailVerified {
		score += 100
	}
	if profile.IsPhoneVerified {
		score += 100
	}

	// Projects portfolio (+80)
	if profile.HasProjects && profile.ProjectCount > 0 {
		score += 80
	}

	// Account age (max 150, 10pts per month, capped at 15 months)
	score += math.Min(float64(profile.AccountAgeMonths)*10.0, 150.0)

	return int(clamp(score, 0, 1000))
}

// ── Composite Score ─────────────────────────────────────────────────────────

// DimensionWeights defines how much each dimension contributes to overall score
var DimensionWeights = map[string]float64{
	"delivery":        0.22,
	"quality":         0.25,
	"professionalism": 0.15,
	"reliability":     0.20,
	"expertise":       0.10,
	"verification":    0.08,
}

// CalculateOverallScore computes a weighted composite from dimension scores
func CalculateOverallScore(dims DimensionScores, completedProjects int) int {
	score := float64(dims.Delivery) * DimensionWeights["delivery"] +
		float64(dims.Quality) * DimensionWeights["quality"] +
		float64(dims.Professionalism) * DimensionWeights["professionalism"] +
		float64(dims.Reliability) * DimensionWeights["reliability"] +
		float64(dims.Expertise) * DimensionWeights["expertise"] +
		float64(dims.Verification) * DimensionWeights["verification"]

	// Confidence Multiplier (Algorithm D smoothing)
	// Prevents new freelancers from reaching 1000 after just 1 contract
	// 0 projects = 1.0 (Initial score phase uses base signals only, delivery/quality are 0)
	// 1 project = 0.50 multiplier (max score capped at ~500)
	// 2 projects = ~0.65 multiplier
	// 10+ projects = 1.0 multiplier
	confidence := 1.0
	if completedProjects > 0 && completedProjects < 10 {
		confidence = 0.5 + (math.Log10(float64(completedProjects)) * 0.5)
	}

	return int(clamp(score*confidence, 0, 1000))
}

// CalculateInitialScore computes baseline score for new users from profile signals
// Uses neutral baselines for Professionalism (500) and Reliability (500) as per Algorithm C spec
func CalculateInitialScore(profile ProfileSignals) (int, DimensionScores) {
	verif := CalculateVerificationScore(profile)

	// Expertise from profile signals
	expertiseScore := 0.0
	if profile.HasSkills {
		expertiseScore += math.Min(float64(profile.SkillCount)*10.0, 50.0)
	}
	if profile.HasGitHub {
		expertiseScore += 30.0 // Implies open-source work
	}
	if profile.HasProjects && profile.ProjectCount > 0 {
		expertiseScore += math.Min(float64(profile.ProjectCount)*20.0, 100.0)
	}

	dims := DimensionScores{
		Delivery:        0,                                    // No projects yet → 0
		Quality:         0,                                    // No projects yet → 0
		Professionalism: 500,                                  // Neutral starting point
		Reliability:     500,                                  // Neutral starting point
		Expertise:       int(clamp(expertiseScore, 0, 1000)),
		Verification:    verif,
	}

	overall := CalculateOverallScore(dims, 0)
	return overall, dims
}

// ── Deduction Events ─────────────────────────────────────────────────────────

// DeductionEvent represents a negative scoring event
type DeductionEvent struct {
	EventType     string  // "cancellation", "ghosting", "dispute_lost", "low_rating", "overdue", "inactivity"
	Severity      float64 // 0.0-1.0 scale of severity
	ContractValue float64 // Contract value for scaling deductions
	DaysOverdue   int     // For overdue events
	Rating        int     // For low rating events (1-2)
}

// ApplyDeductions applies penalty deductions to dimension scores based on events
// Returns the adjusted dimensions
func ApplyDeductions(dims DimensionScores, events []DeductionEvent) DimensionScores {
	result := dims

	for _, e := range events {
		switch e.EventType {
		case "cancellation":
			// Contract cancelled by freelancer — heavy reliability hit
			valuePenalty := math.Min(e.ContractValue/1000.0*10.0, 50.0)
			result.Reliability = int(clamp(float64(result.Reliability)-30.0-valuePenalty, 0, 1000))
			result.Professionalism = int(clamp(float64(result.Professionalism)-15.0, 0, 1000))

		case "ghosting":
			// Freelancer ghosted — severe across multiple dimensions
			result.Delivery = int(clamp(float64(result.Delivery)-100.0, 0, 1000))
			result.Professionalism = int(clamp(float64(result.Professionalism)-300.0, 0, 1000))
			result.Reliability = int(clamp(float64(result.Reliability)-500.0, 0, 1000))

		case "dispute_lost":
			// Dispute filed and lost — affects trust across the board
			result.Delivery = int(clamp(float64(result.Delivery)-100.0, 0, 1000))
			result.Quality = int(clamp(float64(result.Quality)-200.0, 0, 1000))
			result.Professionalism = int(clamp(float64(result.Professionalism)-200.0, 0, 1000))
			result.Reliability = int(clamp(float64(result.Reliability)-300.0, 0, 1000))

		case "low_rating":
			// 1-2 star rating — primarily quality + professionalism
			if e.Rating <= 1 {
				result.Quality = int(clamp(float64(result.Quality)-300.0, 0, 1000))
				result.Professionalism = int(clamp(float64(result.Professionalism)-100.0, 0, 1000))
			} else if e.Rating == 2 {
				result.Quality = int(clamp(float64(result.Quality)-150.0, 0, 1000))
				result.Professionalism = int(clamp(float64(result.Professionalism)-50.0, 0, 1000))
			}

		case "overdue":
			// Milestone overdue — delivery and reliability hit
			if e.DaysOverdue > 7 {
				result.Delivery = int(clamp(float64(result.Delivery)-150.0, 0, 1000))
				result.Reliability = int(clamp(float64(result.Reliability)-100.0, 0, 1000))
			} else if e.DaysOverdue > 3 {
				result.Delivery = int(clamp(float64(result.Delivery)-100.0, 0, 1000))
			} else {
				result.Delivery = int(clamp(float64(result.Delivery)-50.0, 0, 1000))
			}

		case "inactivity":
			// 90+ day inactivity — gradual passive decay
			monthsInactive := e.DaysOverdue / 30
			if monthsInactive > 3 {
				decayPerMonth := 20.0 // −20 per month after 3 months
				totalDecay := float64(monthsInactive-3) * decayPerMonth
				totalDecay = math.Min(totalDecay, 200.0) // Cap at −200

				result.Delivery = int(clamp(float64(result.Delivery)-totalDecay*0.3, 0, 1000))
				result.Quality = int(clamp(float64(result.Quality)-totalDecay*0.2, 0, 1000))
				result.Professionalism = int(clamp(float64(result.Professionalism)-totalDecay*0.1, 0, 1000))
				result.Reliability = int(clamp(float64(result.Reliability)-totalDecay*0.2, 0, 1000))
			}

		case "profile_removed":
			// User removed profile information — verification hit
			result.Verification = int(clamp(float64(result.Verification)-50.0*e.Severity, 0, 1000))

		case "fraud":
			// Fraudulent activity detected — score reset
			result.Delivery = 50
			result.Quality = 50
			result.Professionalism = 50
			result.Reliability = 50
			result.Expertise = 50
			result.Verification = 50
		}
	}

	return result
}

// ApplyInactivityDecay applies monthly passive score decay for inactive users
// Returns adjusted dimensions
func ApplyInactivityDecay(dims DimensionScores, monthsInactive int) DimensionScores {
	if monthsInactive <= 3 {
		return dims // No decay for first 3 months
	}

	result := dims
	// −2 points per month per dimension (after 3-month grace period)
	decay := float64(monthsInactive-3) * 2.0
	decay = math.Min(decay, 100.0) // Cap total decay at 100

	result.Delivery = int(clamp(float64(result.Delivery)-decay, 0, 1000))
	result.Quality = int(clamp(float64(result.Quality)-decay, 0, 1000))
	result.Professionalism = int(clamp(float64(result.Professionalism)-decay*0.5, 0, 1000))
	result.Reliability = int(clamp(float64(result.Reliability)-decay, 0, 1000))

	return result
}

// ── Tier Labels ────────────────────────────────────────────────────────────

func GetTierLabel(score int) string {
	switch {
	case score >= 900:
		return "Elite"
	case score >= 800:
		return "Trusted Expert"
	case score >= 650:
		return "Proven Professional"
	case score >= 500:
		return "Growing Professional"
	case score >= 300:
		return "Established"
	case score >= 150:
		return "Rising Talent"
	case score >= 50:
		return "Verified Newcomer"
	default:
		return "Starter"
	}
}

// ── Helper functions ───────────────────────────────────────────────────────

// timeDecay applies exponential decay: recent projects are weighted more
// Half-life of ~12 months
func timeDecay(monthsAgo int) float64 {
	lambda := 0.693 / 12.0 // ln(2) / half-life
	return math.Exp(-lambda * float64(monthsAgo))
}

// valueWeight gives higher weight to more valuable contracts
// Logarithmic scaling to prevent extreme disparity
func valueWeight(valueUSD float64) float64 {
	if valueUSD <= 0 {
		return 1.0
	}
	// Log scaling: 100 USD = 1.0, 1000 USD = 1.5, 10000 USD = 2.0
	return 1.0 + math.Log10(valueUSD/100.0+1)*0.5
}

func clamp(v, min, max float64) float64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

func clampInt(v, min, max int) int {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

func average(vals []float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range vals {
		sum += v
	}
	return sum / float64(len(vals))
}

