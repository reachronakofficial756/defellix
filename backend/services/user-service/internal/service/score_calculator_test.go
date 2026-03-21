package service

import (
	"testing"
)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Unit Tests for the Credibility Score Calculator
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── CalculateDeliveryScore ──────────────────────────────────────────────────

func TestDeliveryScore_NoProjects(t *testing.T) {
	score := CalculateDeliveryScore(nil)
	if score != 0 {
		t.Errorf("Expected 0 for no projects, got %d", score)
	}
}

func TestDeliveryScore_Perfect5Star_OnTime(t *testing.T) {
	projects := []ProjectSignals{{
		DeliveryRating:        5.0,
		OnTime:                true,
		DaysEarlyOrLate:       5,
		RevisionCount:         0,
		ContractValueUSD:      5000,
		CompletedSuccessfully: true,
		ProjectAgeMonths:      0,
	}}
	score := CalculateDeliveryScore(projects)
	if score < 900 {
		t.Errorf("Expected high delivery score for perfect project, got %d", score)
	}
}

func TestDeliveryScore_Late_Delivery(t *testing.T) {
	projects := []ProjectSignals{{
		DeliveryRating:        3.0,
		OnTime:                false,
		DaysEarlyOrLate:       -7,
		RevisionCount:         3,
		ContractValueUSD:      2000,
		CompletedSuccessfully: true,
		ProjectAgeMonths:      0,
	}}
	score := CalculateDeliveryScore(projects)
	if score > 400 {
		t.Errorf("Expected low delivery score for late + revisions, got %d", score)
	}
}

func TestDeliveryScore_SkipsIncompleteProjects(t *testing.T) {
	projects := []ProjectSignals{
		{DeliveryRating: 5.0, OnTime: true, CompletedSuccessfully: false},
		{DeliveryRating: 3.0, OnTime: true, CompletedSuccessfully: true, ContractValueUSD: 1000},
	}
	score := CalculateDeliveryScore(projects)
	// Should only reflect the one completed project (3-star on-time = ~714)
	if score > 800 {
		t.Errorf("Should exclude incomplete project, got %d", score)
	}
}

// ── CalculateQualityScore ──────────────────────────────────────────────────

func TestQualityScore_NoProjects(t *testing.T) {
	score := CalculateQualityScore(nil)
	if score != 0 {
		t.Errorf("Expected 0 for no projects, got %d", score)
	}
}

func TestQualityScore_Perfect(t *testing.T) {
	projects := []ProjectSignals{{
		QualityRating:         5.0,
		MilestoneRatings:      []float64{5.0, 5.0, 5.0},
		RevisionCount:         0,
		CompletedSuccessfully: true,
		ContractValueUSD:      5000,
	}}
	score := CalculateQualityScore(projects)
	if score < 900 {
		t.Errorf("Expected high quality score, got %d", score)
	}
}

func TestQualityScore_LowWithRevisions(t *testing.T) {
	projects := []ProjectSignals{{
		QualityRating:         2.0,
		RevisionCount:         5,
		CompletedSuccessfully: true,
		ContractValueUSD:      1000,
	}}
	score := CalculateQualityScore(projects)
	if score > 400 {
		t.Errorf("Expected low quality score with revisions, got %d", score)
	}
}

// ── CalculateProfessionalismScore ──────────────────────────────────────────

func TestProfessionalismScore_NoProjects(t *testing.T) {
	score := CalculateProfessionalismScore(nil)
	if score != 0 {
		t.Errorf("Expected 0, got %d", score)
	}
}

func TestProfessionalismScore_GhostingPenalty(t *testing.T) {
	projects := []ProjectSignals{{
		CommunicationRating:   5.0,
		ClientRating:          5.0,
		WasGhosted:            true,
		CompletedSuccessfully: false,
		ContractValueUSD:      5000,
	}}
	score := CalculateProfessionalismScore(projects)
	if score > 200 {
		t.Errorf("Ghosting should severely penalize professionalism, got %d", score)
	}
}

// ── CalculateReliabilityScore ──────────────────────────────────────────────

func TestReliabilityScore_NoProjects(t *testing.T) {
	score := CalculateReliabilityScore(nil)
	if score != 0 {
		t.Errorf("Expected 0, got %d", score)
	}
}

func TestReliabilityScore_AllCompleted(t *testing.T) {
	projects := make([]ProjectSignals, 5)
	for i := range projects {
		projects[i] = ProjectSignals{CompletedSuccessfully: true}
	}
	score := CalculateReliabilityScore(projects)
	if score < 900 {
		t.Errorf("5/5 completed should give high reliability, got %d", score)
	}
}

func TestReliabilityScore_MixedWithGhosting(t *testing.T) {
	projects := []ProjectSignals{
		{CompletedSuccessfully: true},
		{CompletedSuccessfully: true},
		{CompletedSuccessfully: false, WasGhosted: true},
	}
	score := CalculateReliabilityScore(projects)
	if score > 600 {
		t.Errorf("Ghosting + incomplete should lower reliability, got %d", score)
	}
}

// ── CalculateExpertiseScore ────────────────────────────────────────────────

func TestExpertiseScore_NoProjects(t *testing.T) {
	score := CalculateExpertiseScore(nil)
	if score != 0 {
		t.Errorf("Expected 0, got %d", score)
	}
}

func TestExpertiseScore_HighValueContracts(t *testing.T) {
	projects := make([]ProjectSignals, 10)
	for i := range projects {
		projects[i] = ProjectSignals{
			CompletedSuccessfully: true,
			ContractValueUSD:      10000,
			ClientRating:          5.0,
			ProjectAgeMonths:      i,
		}
	}
	score := CalculateExpertiseScore(projects)
	if score < 800 {
		t.Errorf("10 high-value projects should give high expertise, got %d", score)
	}
}

// ── CalculateVerificationScore ─────────────────────────────────────────────

func TestVerificationScore_BareMinimum(t *testing.T) {
	score := CalculateVerificationScore(ProfileSignals{})
	if score != 0 {
		t.Errorf("Empty profile should give 0 verification, got %d", score)
	}
}

func TestVerificationScore_FullProfile(t *testing.T) {
	profile := ProfileSignals{
		HasPhoto:         true,
		HasBio:           true,
		HasSkills:        true,
		SkillCount:       5,
		HasGitHub:        true,
		HasLinkedIn:      true,
		HasPortfolio:     true,
		HasInstagram:     true,
		IsEmailVerified:  true,
		IsPhoneVerified:  true,
		HasProjects:      true,
		ProjectCount:     3,
		AccountAgeMonths: 24,
	}
	score := CalculateVerificationScore(profile)
	if score < 800 {
		t.Errorf("Full profile should give high verification score, got %d", score)
	}
}

// ── CalculateOverallScore + Confidence Multiplier ──────────────────────────

func TestOverallScore_NoProjects(t *testing.T) {
	dims := DimensionScores{
		Professionalism: 500,
		Reliability:     500,
		Verification:    400,
	}
	score := CalculateOverallScore(dims, 0)
	// (0*0.22 + 0*0.25 + 500*0.15 + 500*0.20 + 0*0.10 + 400*0.08) * 1.0 = 207
	if score < 180 || score > 230 {
		t.Errorf("Initial score should be ~207, got %d", score)
	}
}

func TestOverallScore_ConfidenceMultiplier_1Project(t *testing.T) {
	dims := DimensionScores{
		Delivery:        1000,
		Quality:         1000,
		Professionalism: 1000,
		Reliability:     1000,
		Expertise:       1000,
		Verification:    1000,
	}
	score := CalculateOverallScore(dims, 1)
	// With 1 project: confidence = 0.50, so max = 500
	if score > 510 {
		t.Errorf("1-project confidence should cap at ~500, got %d", score)
	}
}

func TestOverallScore_ConfidenceMultiplier_10Projects(t *testing.T) {
	dims := DimensionScores{
		Delivery:        1000,
		Quality:         1000,
		Professionalism: 1000,
		Reliability:     1000,
		Expertise:       1000,
		Verification:    1000,
	}
	score := CalculateOverallScore(dims, 10)
	// With 10+ projects: confidence = 1.0, so max = 1000
	if score != 1000 {
		t.Errorf("10-project confidence should allow full 1000, got %d", score)
	}
}

// ── CalculateInitialScore ──────────────────────────────────────────────────

func TestInitialScore_EmptyProfile(t *testing.T) {
	score, dims := CalculateInitialScore(ProfileSignals{})
	if score > 200 {
		t.Errorf("Empty profile initial score too high: %d", score)
	}
	if dims.Delivery != 0 || dims.Quality != 0 {
		t.Errorf("Delivery/Quality should be 0 with no projects, got %d/%d", dims.Delivery, dims.Quality)
	}
	if dims.Professionalism != 500 || dims.Reliability != 500 {
		t.Errorf("Prof/Reliability should start at 500, got %d/%d", dims.Professionalism, dims.Reliability)
	}
}

func TestInitialScore_FullProfile(t *testing.T) {
	profile := ProfileSignals{
		HasPhoto:         true,
		HasBio:           true,
		HasSkills:        true,
		SkillCount:       5,
		HasGitHub:        true,
		HasLinkedIn:      true,
		HasPortfolio:     true,
		HasInstagram:     true,
		IsEmailVerified:  true,
		IsPhoneVerified:  true,
		HasProjects:      true,
		ProjectCount:     3,
		AccountAgeMonths: 12,
	}
	score, _ := CalculateInitialScore(profile)
	// Full profile should give a decent starting score
	if score < 150 || score > 350 {
		t.Errorf("Full profile initial score should be 150-350, got %d", score)
	}
}

// ── ApplyDeductions ────────────────────────────────────────────────────────

func TestApplyDeductions_LowRating(t *testing.T) {
	dims := DimensionScores{
		Delivery: 800, Quality: 800, Professionalism: 800,
		Reliability: 800, Expertise: 800, Verification: 800,
	}
	events := []DeductionEvent{{
		EventType: "low_rating",
		Rating:    1,
	}}
	result := ApplyDeductions(dims, events)
	if result.Quality >= dims.Quality {
		t.Errorf("Low rating should reduce quality, before=%d after=%d", dims.Quality, result.Quality)
	}
	if result.Professionalism >= dims.Professionalism {
		t.Errorf("Low rating should reduce professionalism, before=%d after=%d", dims.Professionalism, result.Professionalism)
	}
}

func TestApplyDeductions_Ghosting(t *testing.T) {
	dims := DimensionScores{
		Delivery: 800, Quality: 800, Professionalism: 800,
		Reliability: 800, Expertise: 800, Verification: 800,
	}
	events := []DeductionEvent{{EventType: "ghosting"}}
	result := ApplyDeductions(dims, events)
	if result.Reliability >= 400 {
		t.Errorf("Ghosting should severely hit reliability, got %d", result.Reliability)
	}
}

func TestApplyDeductions_Fraud(t *testing.T) {
	dims := DimensionScores{
		Delivery: 900, Quality: 900, Professionalism: 900,
		Reliability: 900, Expertise: 900, Verification: 900,
	}
	events := []DeductionEvent{{EventType: "fraud"}}
	result := ApplyDeductions(dims, events)
	if result.Delivery != 50 || result.Quality != 50 {
		t.Errorf("Fraud should reset all to 50, got delivery=%d quality=%d", result.Delivery, result.Quality)
	}
}

// ── ApplyInactivityDecay ──────────────────────────────────────────────────

func TestInactivityDecay_NoDecayUnder3Months(t *testing.T) {
	dims := DimensionScores{
		Delivery: 800, Quality: 800, Professionalism: 800, Reliability: 800,
	}
	result := ApplyInactivityDecay(dims, 2)
	if result.Delivery != dims.Delivery {
		t.Errorf("Should not decay within 3 months, delivery changed from %d to %d", dims.Delivery, result.Delivery)
	}
}

func TestInactivityDecay_After6Months(t *testing.T) {
	dims := DimensionScores{
		Delivery: 800, Quality: 800, Professionalism: 800, Reliability: 800,
	}
	result := ApplyInactivityDecay(dims, 6) // 3 months past grace period
	if result.Delivery >= dims.Delivery {
		t.Errorf("Should decay after 6 months: before=%d after=%d", dims.Delivery, result.Delivery)
	}
}

// ── Tier Labels ──────────────────────────────────────────────────────────

func TestGetTierLabel(t *testing.T) {
	cases := []struct {
		score    int
		expected string
	}{
		{950, "Elite"},
		{850, "Trusted Expert"},
		{700, "Proven Professional"},
		{550, "Growing Professional"},
		{400, "Established"},
		{200, "Rising Talent"},
		{75, "Verified Newcomer"},
		{10, "Starter"},
	}
	for _, c := range cases {
		got := GetTierLabel(c.score)
		if got != c.expected {
			t.Errorf("GetTierLabel(%d) = %q, want %q", c.score, got, c.expected)
		}
	}
}

// ── Helper Functions ───────────────────────────────────────────────────────

func TestTimeDecay(t *testing.T) {
	decay0 := timeDecay(0)
	decay12 := timeDecay(12)
	decay24 := timeDecay(24)

	if decay0 != 1.0 {
		t.Errorf("0 months should have decay 1.0, got %f", decay0)
	}
	// 12-month half-life → decay at 12 months should be ~0.5
	if decay12 < 0.45 || decay12 > 0.55 {
		t.Errorf("12 months should have decay ~0.5, got %f", decay12)
	}
	// 24 months → ~0.25
	if decay24 < 0.20 || decay24 > 0.30 {
		t.Errorf("24 months should have decay ~0.25, got %f", decay24)
	}
}

func TestValueWeight(t *testing.T) {
	w0 := valueWeight(0)
	w100 := valueWeight(100)
	w10000 := valueWeight(10000)

	if w0 != 1.0 {
		t.Errorf("$0 should give weight 1.0, got %f", w0)
	}
	if w100 >= w10000 {
		t.Errorf("$100 weight (%f) should be less than $10000 weight (%f)", w100, w10000)
	}
}

func TestClamp(t *testing.T) {
	if clamp(50, 0, 100) != 50 {
		t.Error("50 within range should return 50")
	}
	if clamp(-10, 0, 100) != 0 {
		t.Error("-10 should clamp to 0")
	}
	if clamp(200, 0, 100) != 100 {
		t.Error("200 should clamp to 100")
	}
}

// ── Simulation: Solo Freelancer Persona ────────────────────────────────────

func TestSimulation_SoloFreelancer_1Contract(t *testing.T) {
	// Solo freelancer completes 1 perfect contract
	projects := []ProjectSignals{{
		ClientRating:          5.0,
		DeliveryRating:        5.0,
		QualityRating:         5.0,
		CommunicationRating:   5.0,
		OnTime:                true,
		DaysEarlyOrLate:       3,
		RevisionCount:         0,
		ContractValueUSD:      5000,
		CompletedSuccessfully: true,
		ProjectAgeMonths:      0,
	}}

	dims := DimensionScores{
		Delivery:        CalculateDeliveryScore(projects),
		Quality:         CalculateQualityScore(projects),
		Professionalism: CalculateProfessionalismScore(projects),
		Reliability:     CalculateReliabilityScore(projects),
		Expertise:       CalculateExpertiseScore(projects),
		Verification:    500, // Decent profile
	}

	score := CalculateOverallScore(dims, 1)
	// With confidence multiplier at 0.50, should be around 350-450
	if score > 500 {
		t.Errorf("1 perfect contract should not exceed 500 (confidence cap), got %d", score)
	}
	if score < 300 {
		t.Errorf("1 perfect contract should be at least 300, got %d", score)
	}
	t.Logf("Solo freelancer (1 contract): score=%d tier=%s", score, GetTierLabel(score))
}

// ── Simulation: Agency Persona ─────────────────────────────────────────────

func TestSimulation_Agency_10Contracts(t *testing.T) {
	// Agency completes 10 contracts with mixed results
	projects := make([]ProjectSignals, 10)
	for i := range projects {
		projects[i] = ProjectSignals{
			ClientRating:          4.5,
			DeliveryRating:        4.0,
			QualityRating:         5.0,
			CommunicationRating:   4.0,
			OnTime:                i < 8, // 2 late
			DaysEarlyOrLate:       2,
			RevisionCount:         1,
			ContractValueUSD:      3000,
			CompletedSuccessfully: true,
			ProjectAgeMonths:      i,
		}
	}

	dims := DimensionScores{
		Delivery:        CalculateDeliveryScore(projects),
		Quality:         CalculateQualityScore(projects),
		Professionalism: CalculateProfessionalismScore(projects),
		Reliability:     CalculateReliabilityScore(projects),
		Expertise:       CalculateExpertiseScore(projects),
		Verification:    700,
	}

	score := CalculateOverallScore(dims, 10)
	// 10+ projects unlocks full confidence, decent ratings should give 600-800
	if score < 500 || score > 850 {
		t.Errorf("Agency (10 mixed contracts) should be 500-850, got %d", score)
	}
	t.Logf("Agency (10 contracts): score=%d tier=%s", score, GetTierLabel(score))
}

// ── E6: Velocity Throttle Tests ────────────────────────────────────────────

func TestVelocityDampener_DefaultIsNeutral(t *testing.T) {
	// VelocityDampener = 0 should be treated as 1.0 (no dampening)
	projectsNoDampener := []ProjectSignals{{
		DeliveryRating:        5.0,
		OnTime:                true,
		DaysEarlyOrLate:       5,
		RevisionCount:         0,
		ContractValueUSD:      5000,
		CompletedSuccessfully: true,
		VelocityDampener:      0, // unset, should default to 1.0
	}}
	projectsExplicit := []ProjectSignals{{
		DeliveryRating:        5.0,
		OnTime:                true,
		DaysEarlyOrLate:       5,
		RevisionCount:         0,
		ContractValueUSD:      5000,
		CompletedSuccessfully: true,
		VelocityDampener:      1.0, // explicitly set to 1.0
	}}
	scoreDefault := CalculateDeliveryScore(projectsNoDampener)
	scoreExplicit := CalculateDeliveryScore(projectsExplicit)
	if scoreDefault != scoreExplicit {
		t.Errorf("Default (0) and explicit 1.0 dampener should give same score, got %d vs %d", scoreDefault, scoreExplicit)
	}
}

func TestVelocityDampener_ReducesScoreContribution(t *testing.T) {
	// A good project + a bad project. Dampening the bad project should
	// reduce its weight, causing the overall score to be HIGHER (pulled toward the good project).
	goodProject := ProjectSignals{
		DeliveryRating: 5.0, QualityRating: 5.0, CommunicationRating: 5.0,
		ClientRating: 5.0, OnTime: true, DaysEarlyOrLate: 3,
		CompletedSuccessfully: true, ContractValueUSD: 5000,
		VelocityDampener: 1.0,
	}
	badProject := ProjectSignals{
		DeliveryRating: 1.0, QualityRating: 1.0, CommunicationRating: 1.0,
		ClientRating: 1.0, OnTime: false, DaysEarlyOrLate: -10,
		CompletedSuccessfully: true, ContractValueUSD: 5000,
		VelocityDampener: 1.0, RevisionCount: 5,
	}
	badProjectDampened := badProject
	badProjectDampened.VelocityDampener = 0.5 // dampened bad project carries less weight

	// Without dampener: good + bad = medium score
	undampenedDelivery := CalculateDeliveryScore([]ProjectSignals{goodProject, badProject})
	// With dampener on bad project: bad project carries less weight → higher overall
	dampenedDelivery := CalculateDeliveryScore([]ProjectSignals{goodProject, badProjectDampened})

	if dampenedDelivery <= undampenedDelivery {
		t.Errorf("Dampening a bad project should raise overall score: undampened=%d dampened=%d",
			undampenedDelivery, dampenedDelivery)
	}
	t.Logf("Delivery: undampened=%d dampened_bad=%d (dampener reduces bad project influence)", undampenedDelivery, dampenedDelivery)
}

func TestVelocityDampener_MicroContractCap(t *testing.T) {
	// A good project + a bad micro-contract. The micro-contract should have minimal
	// negative impact on the overall score when dampened.
	goodProject := ProjectSignals{
		DeliveryRating: 5.0, OnTime: true, DaysEarlyOrLate: 5,
		CompletedSuccessfully: true, ContractValueUSD: 5000,
		VelocityDampener: 1.0,
	}
	badMicro := ProjectSignals{
		DeliveryRating: 1.0, OnTime: false, DaysEarlyOrLate: -15,
		CompletedSuccessfully: true, ContractValueUSD: 50,
		VelocityDampener: 0.3, // micro-contract dampener
		RevisionCount: 6,
	}
	badMicroUndampened := badMicro
	badMicroUndampened.VelocityDampener = 1.0

	// With micro dampener: bad micro-contract barely affects overall score
	scoreDampened := CalculateDeliveryScore([]ProjectSignals{goodProject, badMicro})
	scoreUndampened := CalculateDeliveryScore([]ProjectSignals{goodProject, badMicroUndampened})

	// Dampened micro should result in higher score (less negative influence)
	if scoreDampened <= scoreUndampened {
		t.Errorf("Micro-contract dampener should reduce bad project influence: dampened=%d undampened=%d",
			scoreDampened, scoreUndampened)
	}
	t.Logf("With micro dampener=%d Without=%d", scoreDampened, scoreUndampened)
}
