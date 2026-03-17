# Defellix Credibility Score — Deep Research & Algorithm Proposals

> Researched and authored as a Senior PM exercise. Draws from FICO credit scoring, Upwork JSS, Stanford's EigenTrust, Bayesian reputation systems (Wilson score / Beta distribution), Octan Network's adaptive PageRank, and Defellix's own research docs on trust-as-a-service for Indian freelancers.

---

## Executive Summary

The Credibility Score is Defellix's **primary disruptive USP** — a tamper-proof, on-chain reputation number that answers one question: *"Can I trust this freelancer with my project and money?"*

This document proposes **4 distinct algorithm architectures** for computing:
1. **Per-Project Score** — how well did the freelancer perform on *this* contract?
2. **Overall Profile Score** — how trustworthy is this freelancer *as a whole*?

Each algorithm also defines: **default onboarding score**, **deduction mechanics**, and **tier classification**.

---

## Core Design Principles

Before diving into algorithms, every proposal adheres to these non-negotiable principles derived from Defellix's research:

| Principle | Rationale |
|---|---|
| **Verifiable & tamper-proof** | Stored on-chain (Base L2), immutable. No one can delete a bad review. |
| **Portable** | Score travels with the freelancer's DID — not locked to Defellix. |
| **Deductions matter as much as gains** | Unlike Upwork where you only accumulate, here bad behavior *actively hurts*. |
| **Recency bias** | Recent performance weighted heavier — people improve, people decline. |
| **Cold-start fairness** | New freelancers get a minimal but non-zero score — enough to get started, low enough to incentivize proving themselves. |
| **Multi-dimensional** | No single factor can dominate — prevents gaming. |
| **Resistant to collusion** | Cross-validation, Bayesian priors, and transitive trust prevent fake review farming. |

---

## Per-Project Score — Universal Inputs

All 4 algorithms use these **raw signals** from each completed contract. These are the measurable events on the platform:

### Positive Signals (Earned)

| Signal | What it Measures | How Captured |
|---|---|---|
| `milestone_completion_rate` | % of milestones delivered and approved | Smart contract state |
| `on_time_delivery` | Was each milestone submitted ≤ `due_date`? | Timestamp comparison |
| `client_public_rating` | 1–5 star rating from client (public) | Post-contract form |
| `client_private_rating` | 0–10 NPS-style (private, anonymous) | Post-contract form |
| `client_recommend` | "Would you hire again?" binary | Post-contract form |
| `scope_adherence` | Did final deliverables match SoW? | Client confirmation |
| `communication_score` | Response time to messages (avg hours) | Platform messaging data |
| `revision_efficiency` | Revisions used / revisions allowed | Contract metadata |
| `budget_adherence` | Final amount ≤ agreed amount | Payment data |
| `contract_value` | Total $ value of the contract | Payment data |

### Negative Signals (Deducted)

| Signal | Penalty Trigger | Severity |
|---|---|---|
| `late_milestone` | Submission after `due_date` | Medium per late day |
| `missed_milestone` | Never submitted | High |
| `dispute_raised` | Client opens formal dispute | High |
| `dispute_lost` | Freelancer loses dispute resolution | Critical |
| `contract_abandoned` | Freelancer stops responding/working | Critical |
| `scope_exceeded_unilateral` | Freelancer adds charges without approval | Medium |
| `refund_issued` | Partial or full refund from escrow | High |
| `contract_terminated_by_client` | Client ends contract early citing freelancer fault | High |
| `NDA_violation` | Verified breach of confidentiality | Critical — permanent flag |

---

## Overall Profile Score — Universal Inputs

Beyond individual projects, the overall score incorporates **profile-level signals** that measure the freelancer's holistic platform behavior:

### Identity & Verification Signals

| Signal | Impact | How Captured |
|---|---|---|
| `kyc_verified` | Baseline trust boost | Aadhaar/PAN verification |
| `portfolio_items` | Proves capability | Self-uploaded, verified by clients |
| `skills_verified` | Platform skill assessments | Defellix skill tests |
| `linkedin_connected` | Cross-platform identity proof | OAuth integration |
| `education_credentials` | VC-based degree verification | Verifiable Credentials |
| `certification_count` | Industry certifications | VC-based |

### Behavioral Signals (Non-Project)

| Signal | Impact | How Captured |
|---|---|---|
| `profile_completeness` | Minor positive | % of fields filled |
| `platform_tenure` | Minor positive (length of credit history) | Registration date |
| `login_consistency` | Minor positive (platform engagement) | Auth logs |
| `community_contributions` | Minor positive (helps others) | Forum/dispute participation |
| `client_diversity` | Positive — not dependent on one client | Unique client count |
| `consecutive_negative_contracts` | Major penalty multiplier | Pattern detection |
| `account_warnings` | Deduction | Admin-issued flags |
| `inactivity_period` | Score decay over time if inactive | Last contract date |

---

## Algorithm 1: "FICO-Inspired" Weighted Pillar Model

> **Philosophy**: Inspired by the FICO credit score (300–850 range, 5 pillars with fixed weights). Deterministic, transparent, easy to explain to users.

### Per-Project Score (0–100)

```
ProjectScore = (Delivery × 0.35) + (Quality × 0.30) + (Professionalism × 0.20) + (Client Satisfaction × 0.15)
```

| Pillar | Weight | Components |
|---|---|---|
| **Delivery** | 35% | `milestone_completion_rate`, `on_time_delivery`, `scope_adherence` |
| **Quality** | 30% | `client_public_rating` (normalized to 0–1), `revision_efficiency`, `budget_adherence` |
| **Professionalism** | 20% | `communication_score`, no disputes, no abandonment |
| **Client Satisfaction** | 15% | `client_private_rating` (0–10 → 0–1), `client_recommend` |

**Deductions on project score:**
- Late milestone: −3 per milestone, per day late (capped at −15 per milestone)
- Dispute raised: −10
- Dispute lost: −25
- Contract abandoned: −40 (project score floors at 0)
- Refund issued: −20

### Overall Score (300–900)

```
OverallScore = BaseScore + ProjectContribution + IdentityBonus − Penalties − DecayPenalty
```

| Component | Calculation |
|---|---|
| **BaseScore** | 350 (new user after KYC) |
| **ProjectContribution** | Weighted moving average of all ProjectScores, weighted by `contract_value` and recency factor `e^(−λt)` where `t` = months since completion, `λ` = 0.05 |
| **IdentityBonus** | +20 (KYC) + +10 (LinkedIn) + +5 per verified credential (capped at +50) |
| **Penalties** | Accumulated deductions: −30 per dispute lost, −50 per abandonment, −15 per account warning |
| **DecayPenalty** | If no contract completed in 90 days: −2/month (capped at −60) |

**Cold start**: New user with KYC verified = **370**. With LinkedIn + 2 certifications = **395**. Minimum possible = **300**.

### Tier Classification

| Score | Tier | Badge |
|---|---|---|
| 300–449 | **Newcomer** | 🌱 |
| 450–549 | **Building** | 🔨 |
| 550–699 | **Rising Talent** | ⭐ |
| 700–799 | **Trusted Pro** | 💎 |
| 800–900 | **Elite** | 👑 |

### Strengths & Weaknesses

| ✅ Strengths | ❌ Weaknesses |
|---|---|
| Very transparent — users know exactly what affects their score | Static weights don't adapt to market conditions |
| Easy to implement and explain | Simple weighted average can be gamed by doing many tiny cheap projects |
| FICO familiarity makes it intuitive | Doesn't account for the *quality* of the client giving the review |

---

## Algorithm 2: "Bayesian Trust" — Beta Distribution + Wilson Confidence

> **Philosophy**: Inspired by academic reputation systems. Uses Bayesian updating with beta distributions to model uncertainty. New freelancers have high uncertainty (wide distribution) that narrows with more data. The Wilson lower-bound prevents gaming with few projects.

### Per-Project Score (0–100)

Same formula as Algorithm 1 for individual project computation. The difference is in how projects roll up to the overall score.

### Overall Score (300–900)

Instead of a simple weighted average, the system maintains a **beta distribution** for each freelancer:

```
α = sum of positive outcomes (successful contracts, good ratings)
β = sum of negative outcomes (disputes, bad ratings, penalties)

Raw reputation = α / (α + β)                    # Expected value
Wilson lower bound = (p̂ + z²/2n − z√(p̂(1−p̂)/n + z²/4n²)) / (1 + z²/n)
    where p̂ = α/(α+β), n = α+β, z = 1.96 (95% confidence)
```

The **Wilson lower bound** is the actual displayed score, mapped to 300–900:

```
OverallScore = 300 + (WilsonLowerBound × 600)
```

**How interactions update α and β:**

| Event | α increment | β increment |
|---|---|---|
| Contract completed, ProjectScore ≥ 80 | +3.0 × value_weight | +0 |
| Contract completed, ProjectScore 60–79 | +1.5 × value_weight | +0.5 × value_weight |
| Contract completed, ProjectScore 40–59 | +0.5 × value_weight | +1.5 × value_weight |
| Contract completed, ProjectScore < 40 | +0 | +3.0 × value_weight |
| Dispute lost | +0 | +5.0 |
| Contract abandoned | +0 | +8.0 |
| Client recommends rehire | +1.0 | +0 |
| Verified credential added | +0.5 | +0 |
| 90 days inactivity | +0 | +0.3 (monthly decay) |

Where `value_weight = log2(1 + contract_value / 500)` — higher-value contracts carry more weight.

**Cold start**: New user starts with `α = 2, β = 3` (prior: weak negative → score ≈ 340). After KYC: `α = 3, β = 3` → score ≈ 360. This Bayesian prior means the system starts skeptical and gains confidence as evidence accumulates.

### Strengths & Weaknesses

| ✅ Strengths | ❌ Weaknesses |
|---|---|
| **Mathematically rigorous** — handles uncertainty properly | Harder to explain to users (beta distribution is not intuitive) |
| **Self-correcting** — few data points = wide uncertainty = conservative score | Score moves slowly with many contracts (high n) — hard to recover |
| **Wilson bound prevents gaming** — 2 projects with 5-star won't outrank 50 projects with 4.5-star | Requires careful tuning of priors and increment values |
| **Naturally anti-fraud** — fake reviews from new accounts (low n) have minimal impact | |

---

## Algorithm 3: "EigenTrust Hybrid" — Graph-Based Transitive Trust

> **Philosophy**: Inspired by Stanford's EigenTrust and Google PageRank. Trust is not just about *your* performance — it's about *who* trusts you and how trustworthy *they* are. A 5-star review from a high-reputation client is worth more than one from a brand-new account.

### Per-Project Score (0–100)

Same base formula as Algorithm 1, but with a **Client Quality Multiplier**:

```
AdjustedProjectScore = BaseProjectScore × ClientQualityMultiplier
```

Where `ClientQualityMultiplier` = `0.7 + (0.3 × ClientTrustRank)`. ClientTrustRank is the client's own normalized trust score (0–1), computed from their payment history, dispute rate, and how many successful contracts they've completed.

This means:
- A review from a verified, long-term client with many successful contracts counts for **more**
- A review from a brand-new client with no history counts for **less**
- A review from a client with dispute history counts for **even less**

### Overall Score (300–900)

Uses iterative eigenvector computation on a bipartite trust graph:

```
1. Build trust matrix T where T[i][j] = normalized trust from entity j → entity i
2. Normalize each column of T (each entity's outgoing trust sums to 1)
3. Initialize trust vector t⁰ = uniform distribution
4. Iterate: t^(k+1) = (1 − d) × T × t^k + d × p
   where d = 0.15 (damping factor), p = pre-trusted distribution (KYC-verified users)
5. Converge when ||t^(k+1) − t^k|| < ε
6. Map converged trust value to 300–900 range
```

**Trust edges in the graph:**

| Edge Type | Weight |
|---|---|
| Client → Freelancer (successful project) | `ProjectScore / 100` |
| Client → Freelancer (dispute lost by freelancer) | `−0.5` |
| Freelancer → Client (payment received on time) | `0.3` |
| Verified credential issuer → Freelancer | `0.2` |
| Community endorsement (peer → peer) | `0.1` |

**Deduction mechanics:**
- Disputes cascade through the graph — losing a dispute against a high-trust client tanks your score harder
- Abandonment removes ALL positive edges from that contract
- NDA violation sets a permanent "trust poison" flag that halves all incoming trust edges

**Cold start**: New users inherit a base trust from the "pre-trusted set" (the `p` vector). Score ≈ 350–380 depending on verification level.

### Strengths & Weaknesses

| ✅ Strengths | ❌ Weaknesses |
|---|---|
| **Most fraud-resistant** — fake review farms from new accounts have near-zero trust propagation | Computationally expensive — needs periodic batch recomputation |
| **Network effects** — working with high-trust clients lifts your score faster | Very hard to explain to users ("why did my score change?") |
| **Colluder-resistant** — EigenTrust isolates colluding clusters | Cold-start is harsh — new freelancers are at a real disadvantage |
| **Captures "quality of reviewer"** — not all 5-star reviews are equal | Requires sufficient network density to work well |

---

## Algorithm 4: "Composite Adaptive" — The Recommended Hybrid ⭐

> **Philosophy**: Combines the best of all three. FICO-style transparency for per-project scoring, Bayesian confidence for overall profile, and EigenTrust-style client quality weighting to prevent fraud. Adds time-decay, streak bonuses, and milestone-level granularity unique to Defellix's smart contract architecture.

### Per-Project Score (0–100)

```
ProjectScore = Σ(pillar_weight × pillar_score) − penalties + streak_bonus
```

| Pillar | Weight | Sub-signals (all 0–1 normalized) |
|---|---|---|
| **Delivery Execution** | 30% | `milestone_hit_rate` (% on-time), `scope_match` (client confirms deliverables match SoW), `completion_rate` |
| **Output Quality** | 25% | `client_public_rating / 5`, `revision_efficiency` (revisions_used / revisions_allowed, inverted), `budget_adherence` |
| **Client Perception** | 25% | `private_nps / 10`, `recommend_binary`, weighted by `ClientQualityMultiplier` |
| **Engagement Quality** | 20% | `avg_response_time` (mapped: <2h = 1.0, <12h = 0.7, <24h = 0.4, >24h = 0.1), `proactive_updates` (milestone updates without being asked), `contract_duration_health` (no stalls >7 days) |

**Penalty table:**

| Violation | Points Deducted | Can Recover? |
|---|---|---|
| Milestone 1–3 days late | −2 per milestone | Yes |
| Milestone 4–7 days late | −5 per milestone | Yes |
| Milestone >7 days late | −10 per milestone | Yes |
| Scope mismatch (client disputes SoW adherence) | −8 | Yes |
| Dispute raised by client | −12 | Yes |
| Dispute lost | −25 | Partially (with future positive contracts) |
| Contract abandoned (no response >14 days) | Score = 0 for this project | No — this project is permanently 0 |
| NDA/ethical violation | Score = 0 + overall profile flag | No |

**Streak bonus:**
- 3 consecutive projects with ProjectScore ≥ 80: +5 bonus on next project
- 5 consecutive: +8
- 10 consecutive: +12

### Overall Score (300–900)

Three-layer computation:

```
Layer 1: Confidence-Weighted Performance (CWP)
Layer 2: Identity & Verification Boost (IVB)  
Layer 3: Behavioral Adjustments (BA)

OverallScore = clamp(300, 900, CWP + IVB + BA)
```

#### Layer 1: Confidence-Weighted Performance (max contribution: 750 pts)

Uses a **modified Bayesian approach** with recency-weighted contract values:

```python
for each contract i:
    weight_i = contract_value_i × recency_factor_i × client_quality_i
    
    recency_factor_i = e^(−0.04 × months_since_completion)  # Half-life ≈ 17 months
    client_quality_i = 0.6 + (0.4 × client_trust_score)     # Range: 0.6 – 1.0

weighted_avg_score = Σ(ProjectScore_i × weight_i) / Σ(weight_i)
confidence = 1 − (1 / (1 + 0.3 × sqrt(n_contracts)))       # Approaches 1 as n grows

CWP = 300 + (weighted_avg_score / 100) × 450 × confidence
```

This means:
- With **0 contracts**: CWP = 300 (base)
- With **1 contract** (score 85): CWP ≈ 395
- With **10 contracts** (avg 85): CWP ≈ 610
- With **50 contracts** (avg 90): CWP ≈ 700

#### Layer 2: Identity & Verification Boost (max: +80 pts)

| Verification Item | Bonus | One-Time? |
|---|---|---|
| KYC (Aadhaar/PAN) | +20 | Yes |
| LinkedIn connected | +10 | Yes |
| Portfolio (≥5 items) | +10 | Yes |
| Each verified skill test passed | +5 (max +20) | Yes |
| Each VC-based credential | +5 (max +15) | Yes |
| Profile 100% complete | +5 | Yes |

#### Layer 3: Behavioral Adjustments (can be positive or negative)

**Positive adjustments:**

| Behavior | Adjustment |
|---|---|
| Streak of 5+ successful contracts | +10 |
| Client diversity (worked with 10+ unique clients) | +10 |
| Platform tenure > 12 months with activity | +5 |
| Community contribution (dispute resolution participation) | +5 |
| Referred freelancers who also achieve Rising Talent | +5 |

**Negative adjustments (deductions):**

| Behavior | Deduction | Recovery Mechanism |
|---|---|---|
| Dispute lost | −25 per occurrence | −5 removed per subsequent contract with score ≥ 80 |
| Contract abandoned | −40 per occurrence | −8 removed per subsequent contract with score ≥ 85 |
| 2+ consecutive contracts with score < 50 | −20 | Cleared after 3 consecutive contracts ≥ 70 |
| Account warning from admin | −15 | Cleared after 6 months without incident |
| Inactivity > 90 days | −2/month (max −30) | Immediately restored upon contract completion |
| Profile flagged for suspicious activity | −50 (pending investigation) | Restored if cleared, permanent if confirmed |

### Default Onboarding Score

```
Sign up (no verification):              300 (minimum, cannot use platform fully)
+ KYC verified:                         +20 → 320
+ LinkedIn connected:                   +10 → 330
+ Profile 100% complete:                +5 → 335
+ 1 skill test passed:                  +5 → 340
+ Portfolio with 3+ items:              +5 → 345
+ VC-based degree/certification:        +5 → 350

Typical new user after onboarding:      340–355
```

This positions new freelancers in the **Newcomer tier** (300–449), giving them enough credibility to get their first contract while incentivizing them to verify more and complete projects to climb.

### Tier Classification (same as Algorithm 1)

| Score | Tier | Visual Badge | Platform Benefits |
|---|---|---|---|
| 300–449 | **Newcomer** | 🌱 Sprout | Max 2 active contracts, limited visibility |
| 450–549 | **Building** | 🔨 Builder | Max 4 active contracts, standard search ranking |
| 550–699 | **Rising Talent** | ⭐ Star | Unlimited contracts, priority in search, green badge |
| 700–799 | **Trusted Pro** | 💎 Diamond | Featured in "Top Freelancers", dispute resolution priority |
| 800–900 | **Elite** | 👑 Crown | Homepage feature, early access to premium contracts, NFT badge |

### Strengths & Weaknesses

| ✅ Strengths | ❌ Weaknesses |
|---|---|
| **Best of all worlds** — FICO transparency + Bayesian rigor + EigenTrust fraud resistance | Most complex to implement |
| **Granular deduction system** with clear recovery paths | Requires smart contract events feeding real-time data |
| **Client quality weighting** prevents fake review farming | Client trust score itself needs separate computation |
| **Streak bonuses** incentivize sustained excellence | Many tunable parameters — requires A/B testing to optimize |
| **Clear onboarding journey** — users see exactly how to improve | |
| **Decay + recovery** — score is always dynamic, always earned | |

---

## Comparison Matrix

| Feature | Algo 1 (FICO) | Algo 2 (Bayesian) | Algo 3 (EigenTrust) | Algo 4 (Composite) ⭐ |
|---|---|---|---|---|
| **Transparency** | ⬛⬛⬛⬛⬛ | ⬛⬛⬜⬜⬜ | ⬛⬜⬜⬜⬜ | ⬛⬛⬛⬛⬜ |
| **Fraud Resistance** | ⬛⬛⬜⬜⬜ | ⬛⬛⬛⬜⬜ | ⬛⬛⬛⬛⬛ | ⬛⬛⬛⬛⬜ |
| **Cold-Start Fairness** | ⬛⬛⬛⬛⬜ | ⬛⬛⬛⬜⬜ | ⬛⬛⬜⬜⬜ | ⬛⬛⬛⬛⬜ |
| **Mathematical Rigor** | ⬛⬛⬜⬜⬜ | ⬛⬛⬛⬛⬛ | ⬛⬛⬛⬛⬛ | ⬛⬛⬛⬛⬜ |
| **Implementation Effort** | ⬛⬜⬜⬜⬜ | ⬛⬛⬜⬜⬜ | ⬛⬛⬛⬛⬛ | ⬛⬛⬛⬜⬜ |
| **User Explainability** | ⬛⬛⬛⬛⬛ | ⬛⬛⬜⬜⬜ | ⬛⬜⬜⬜⬜ | ⬛⬛⬛⬛⬜ |
| **Deduction System** | ⬛⬛⬛⬜⬜ | ⬛⬛⬛⬜⬜ | ⬛⬛⬛⬛⬜ | ⬛⬛⬛⬛⬛ |
| **Recency Sensitivity** | ⬛⬛⬛⬜⬜ | ⬛⬛⬜⬜⬜ | ⬛⬛⬛⬜⬜ | ⬛⬛⬛⬛⬛ |

---

## Recommendation

> **Algorithm 4 (Composite Adaptive)** is the recommended approach for Defellix.

**Why it's the right choice for disrupting freelancing trust:**

1. **Transparent enough for users** — they can see their pillar scores and understand what to improve (unlike pure Bayesian/EigenTrust)
2. **Rigorous enough to be unchallengeable** — the confidence-weighted performance layer ensures statistical fairness
3. **Client quality weighting** — the lightweight EigenTrust element prevents the #1 attack vector: fake reviews from throwaway accounts
4. **Clear deduction + recovery** — freelancers know the consequences of bad behavior AND the path back
5. **On-chain compatible** — per-project scores anchor to smart contract events; overall recomputation can happen off-chain with on-chain commitments
6. **Aligns with Defellix's phased rollout** — can launch with Layers 1+2, add Layer 3 (client quality) in Phase 2

### Phased Implementation Strategy

| Phase | What Ships | Score Sophistication |
|---|---|---|
| **Phase 1** (MVP) | Per-project scoring + simple weighted average for overall | Algorithm 1 essentially |
| **Phase 2** (Trust V2) | Add Bayesian confidence + recency weighting + decay | Algorithm 4 Layers 1+2 |
| **Phase 3** (Full) | Add client quality multiplier + streak bonuses + full deduction system | Full Algorithm 4 |
