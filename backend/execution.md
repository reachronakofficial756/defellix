# Backend Execution Plan
## Defellix

**Mission:** Legalise freelancer contracts through blockchain and build lasting freelancer trust.  
**Principles:** Speed, security, scale. **Rules:** See [RULES_OF_BACKEND.md](./RULES_OF_BACKEND.md) — attach to every backend prompt.

**Created:** January 24, 2026  
**Technology:** Go microservices + PostgreSQL + Base L2  
**Where we are:** Phase 3 (Contract service) ✅ Complete — draft/send, auto-delete, shareable link, email trigger, client view/sign/send-for-review, wallets, blockchain on sign (mock/testnet ready; real Base L2 RPC pending). Phase 4 (submission, review, reputation) is next.

---

## 1. User flow (source of truth)

This section is the canonical user journey. Backend phases and deliverables are derived from it.

### 1.1 Login / Signup → Create profile → Dashboard

1. User lands on website → **Login** or **Signup**.
2. After auth → **Create profile** (name, photo, headline, skills, location, experience, social links, role, etc.).
3. User lands on **Dashboard** with:
   - Option to **Create contract**
   - Option to **Send contract to client**
   - Option to **Save contract as draft**

**Backend:** Auth service (login/signup), User service (profile CRUD, `user_name` for public URL, public profile by user_name, visibility).  
**Status:** ✅ Done (Auth + User services; `user_name`, public profile by user_name, and visibility flags implemented).

---

### 1.2 Create contract • Save as draft • Send to client

4. **Create contract** — Freelancer fills:
   - **Project:** category, name, description, due date, amount, PRD upload (e.g. PDF URL), submission criteria.
   - **Client:** name, company, email, phone.
   - **Milestones:** initial payment, project milestones, milestone descriptions, terms & conditions.

5. **Save as draft**
   - Contract is stored only in backend; status `draft`.
   - **Rule:** Drafts are **automatically deleted after 14 days** (scheduled job).

6. **Send to client**
   - Status becomes `sent`.
   - Contract is saved in backend and, **on client sign**, also recorded on blockchain (see below).
   - **Client** (email from contract) receives an **email** about the contract.
   - **Freelancer** gets a **shareable link** to copy and send to the client personally (e.g. `ourdomain.com/contract/:id` or signed tokenised link).

**Backend:** Contract service (create/update/list/get/send/delete), draft 14-day auto-delete job, shareable contract link, notification trigger for “contract sent”.  
**Status:** ⏳ CRUD + draft + send + auto-delete + shareable link + email trigger done; **not yet:** blockchain write on sign, client view/sign (3.3+).

---

### 1.3 Client: open contract → Sign or Send for review

7. **Client** opens the contract (frontend; link from email or shared URL).

8. **Two actions:**
   - **Sign contract**
   - **Send for review** (client writes a comment; contract goes back to freelancer in **pending** state; freelancer edits and sends again).

**Backend:** Contract service — client-facing read endpoint (by token or public link), “send for review” (comment + status `pending`), “sign” (see below).  
**Status:** ✅ Done: `GET/POST /api/v1/public/contracts/:token` (view, send-for-review, sign). Wallets and blockchain on sign in 3.4.

---

### 1.4 Client signs: details + wallet + blockchain

9. When client clicks **Sign**:
   - **Pre-filled:** email, phone (from freelancer’s contract).
   - **Optional** (more completion = extra trust/reputation points for freelancer): company (GST number with **GST validator**), business email verification, Instagram, LinkedIn.
   - **Required:** Company address — either “Remote” or full address or **Google Maps URL**.

10. **Wallets:** Freelancer and client wallets are **created and managed by the backend**. No blockchain knowledge or manual wallets for users.

11. **On sign:** Contract is recorded on the **blockchain network** with at least: transaction id, hashed details, timestamp, deadline, amount, gas fee, and any other data needed for legal/audit. Contract status becomes **signed**.

**Backend:** Contract service (client sign payload, validation, optional GST validator), Wallet/Blockchain service (create custodial wallets, submit contract record on-chain, return tx id/hash etc.).  
**Status:** ✅ Done: contract-service validates sign payload; blockchain-service creates wallets and writes to chain (mock/testnet ready; real Base L2 RPC pending). GST validator deferred.

---

### 1.5 After sign: submission → client review → reputation

12. **Freelancer submits project:**
   - One field **exactly as** the “submission criteria” defined by the freelancer in the contract.
   - One **detailed description** field.
   - On submit → **Client receives an email.**

13. **Client** can **Accept** or **Ask for revision**. Revisions loop until client accepts.

14. **Reputation** for that contract is computed from:
   - Client review (rating/feedback),
   - Whether the work was submitted before or after the deadline,
   - Whether it was accepted or not,
   - Other agreed factors.

15. **Contract is saved to the freelancer’s user profile** with all required details and linked for display and reputation.

**Backend:** Contract service (submission CRUD, accept/revision), Notification (email on submit), Reputation service (per-contract score, persisted and later synced to chain if planned). User service: link contract to profile, store visibility and summary.  
**Status:** ❌ Not started.

---

### 1.6 Public profile and visibility

16. **Freelancer** can choose:
   - Which **contracts** to show on the public profile,
   - Which **details** of each contract to show,
   - Which **profile** and **project** information is visible.

17. **Unique public profile URL:** `ourdomain.com/user_name` — `user_name` is set when creating/editing profile and must be unique.

**Backend:** User service — `user_name` (unique), visibility flags for profile / projects / contracts and per-contract visibility, public profile API by `user_name`.  
**Status:** ✅ Done for profile/projects/contracts visibility and public-by-username API; per-contract visibility and contract section on public profile to be added when contract data is linked (Phase 4).

---

## 2. Backend phases (mapped to user flow)

### Phase 1: Auth service — Login / Signup ✅ DONE

**Goal:** Secure login, signup, JWT, OAuth.

| Item | Status | Notes |
|------|--------|--------|
| HTTP server, Chi, validation, clean layout | ✅ | |
| PostgreSQL + GORM, User model | ✅ | |
| Register, Login, Refresh, /me | ✅ | |
| Password hashing (bcrypt), JWT | ✅ | |
| OAuth (Google, LinkedIn, GitHub) | ✅ | |

**Deliverables:**  
- [x] `POST /api/v1/auth/register`  
- [x] `POST /api/v1/auth/login`  
- [x] `POST /api/v1/auth/refresh`  
- [x] `GET /api/v1/auth/me`  
- [x] OAuth initiate/callback and token encryption  

---

### Phase 2: User service — Profile & dashboard readiness ✅ DONE

**Goal:** Profile CRUD, skills, projects, search; `user_name`, public profile, visibility.

| Item | Status | Notes |
|------|--------|--------|
| PostgreSQL (same DB), user_profiles | ✅ | |
| Create/update profile, skills, projects | ✅ | |
| Search freelancers | ✅ | |
| `user_name` (unique), set on profile | ✅ | For ourdomain.com/user_name; normalised [a-z0-9_], 3–30 chars |
| Public profile by user_name | ✅ | `GET /api/v1/public/profile/{user_name}` (no auth) |
| Visibility: profile / projects / contracts | ✅ | show_profile, show_projects, show_contracts on profile |

**Deliverables:**  
- [x] `GET/PUT /api/v1/users/me`, `POST /api/v1/users/me/profile`  
- [x] Skills, projects, portfolio APIs  
- [x] `GET /api/v1/users/:id`, `POST /api/v1/users/search`  
- [x] `user_name` in profile, uniqueness (create/update); 409 USER_NAME_TAKEN, 400 INVALID_USER_NAME  
- [x] `GET /api/v1/public/profile/{user_name}`  
- [x] Visibility flags (show_profile, show_projects, show_contracts); per-contract “show on profile” in Phase 4 when contracts are linked  

---

### Phase 3: Contract service — Draft, send, link, and lifecycle 🔄 IN PROGRESS

**Goal:** Create/save draft, send to client, shareable link, draft auto-delete, then client sign/review and blockchain on sign.

#### 3.1 Contract CRUD + draft + send (Week 4) ✅ DONE

| Item | Status | Notes |
|------|--------|--------|
| Create contract (draft) | ✅ | Project, client, milestones, terms |
| Update draft, list, get | ✅ | |
| Send to client (draft → sent) | ✅ | Status + sent_at only |
| Delete draft | ✅ | |

**Deliverables:**  
- [x] `POST /api/v1/contracts`  
- [x] `GET /api/v1/contracts`, `GET /api/v1/contracts/:id`  
- [x] `PUT /api/v1/contracts/:id` (draft only)  
- [x] `POST /api/v1/contracts/:id/send`  
- [x] `DELETE /api/v1/contracts/:id` (draft only)  

#### 3.2 Draft auto-delete & send experience ✅ DONE

| Item | Status | Notes |
|------|--------|--------|
| Auto-delete drafts older than 14 days | ✅ | Internal job in contract-service; `DRAFT_EXPIRY_DAYS`, `DRAFT_CLEANUP_INTERVAL_MINS` |
| Shareable contract link for freelancer | ✅ | `SHAREABLE_LINK_BASE_URL` + `/:id`; returned in send and get when status is sent |
| Email to client when contract is sent | ✅ | `ContractNotifier` trigger on send (no-op by default; plug in notification service later) |

**Deliverables:**  
- [x] Draft-cleanup job: `DeleteDraftsOlderThan` in repo; `DeleteExpiredDrafts` in service; `job.DraftCleanupRunner` started from main  
- [x] `shareable_link` in contract response when status is sent and `SHAREABLE_LINK_BASE_URL` is set  
- [x] `NotifyContractSent` trigger on send (internal/notification; NoopNotifier default)  
- [x] Env: `SHAREABLE_LINK_BASE_URL`, `DRAFT_EXPIRY_DAYS`, `DRAFT_CLEANUP_INTERVAL_MINS`  

#### 3.3 Client: view, sign, send for review ✅ DONE (GST validator deferred)

| Item | Status | Notes |
|------|--------|--------|
| Client view contract by link/token | ✅ | `GET /api/v1/public/contracts/:token` (no auth); token = UUID set on send |
| Client sign: required/optional fields | ✅ | `POST .../sign`; company_address required (Remote / address / URL); email, phone, gst, etc. optional; stored in client_sign_metadata |
| GST number validator | ⏸️ | Deferred; optional fields accepted and stored; pluggable validator later |
| Send for review (comment, status pending) | ✅ | `POST .../send-for-review`; status→pending; freelancer can update (allowed when pending) and re-send (pending→sent) |

**Deliverables:**  
- [x] `client_view_token` (UUID) set on send; shareable_link = base + token  
- [x] `GET /api/v1/public/contracts/:token` — public view (no auth)  
- [x] `POST /api/v1/public/contracts/:token/send-for-review` — body `{ "comment": "..." }`  
- [x] `POST /api/v1/public/contracts/:token/sign` — body: `company_address` required; optional email, phone, company_name, gst_number, business_email, instagram, linkedin  
- [x] Update/Put draft allowed when status = pending (freelancer edits before re-send); Send allowed when pending (re-send)  
- [x] Domain: status `pending`; columns client_view_token, client_review_comment, client_signed_at, client_company_address, client_sign_metadata  

#### 3.4 Wallets & blockchain on sign ✅ DONE (mock/testnet ready; real Base L2 pending)

| Item | Status | Notes |
|------|--------|--------|
| Auto-create custodial wallet (freelancer) | ✅ | blockchain-service `POST /api/v1/wallets`; wallets table; encrypted private keys |
| Auto-create custodial wallet (client) | ✅ | Same; created on-demand when contract is signed |
| On client sign → write contract to chain | ✅ | contract-service calls blockchain-service async; mock/testnet mode (real Base L2 RPC pending) |
| Persist blockchain metadata on contract | ✅ | Contract domain: blockchain_tx_hash, blockchain_tx_id, blockchain_block_num, blockchain_gas_used, blockchain_network, blockchain_status |

**Deliverables:**  
- [x] blockchain-service microservice (separate from contract-service)  
- [x] `wallets` table: user_id, user_type, address, encrypted_private_key  
- [x] `contract_records` table: contract_id, transaction_hash, block_number, gas_used, status  
- [x] `POST /api/v1/wallets` — create or get wallet (auth required)  
- [x] `POST /api/v1/blockchain/contracts` — write contract to chain (auth required)  
- [x] Contract domain: blockchain metadata fields  
- [x] Contract-service integration: calls blockchain-service on sign (async)  
- [x] Wallet encryption: AES-256-GCM with master key (`WALLET_ENCRYPTION_KEY`)  
- [x] Mock/testnet mode: generates deterministic tx hashes; ready for real Base L2 RPC integration

---

### Phase 4: Submission, review, reputation, profile link ❌ NOT STARTED

**Goal:** Freelancer submits against “submission criteria” + detailed desc; client accept/revision; per-contract reputation; attach contract to profile.

| Item | Status | Notes |
|------|--------|--------|
| Submission: criteria field + detailed desc | ❌ | Stored on contract/submission entity |
| Client accept / ask for revision | ❌ | Status and optional comment |
| Email to client on submission | ❌ | |
| Reputation score per contract | ❌ | From review, deadline, acceptance |
| Save contract (and summary) to user profile | ❌ | Link contract_id to profile, store chosen visibility |
| Freelancer chooses which contracts/details to show | ❌ | Visibility rules in user/contract service |

---

### Phase 5: Notifications, verification, disputes (as needed)

**Goal:** Emails (send, sign, submit, review), optional verification (GST, business mail, etc.), optional dispute flow.

- Notification service or integrations for: contract sent, contract signed, submission, review.
- Verification: business mail, GST, etc., only if product decides to use them for “extra points” or compliance.
- Disputes: separate phase if we add a formal dispute flow.

---

### Phase 6: API gateway, production, observability

**Goal:** Single entrypoint, rate limiting, auth, logging, deployment, API documentation.  

- ✅ Nginx API Gateway routing to all 4 microservices
- ✅ Swagger UI documentation deployed at `/api-docs/`
- ⏳ Rate limiting and advanced observability deferred until core is stable.

---

## 3. Where we are now (summary)

| Area | Done | Next |
|------|------|------|
| **Auth** | Register, login, refresh, OAuth, JWT | — |
| **User** | Profile CRUD, skills, projects, search | `user_name`, public profile, visibility |
| **Contract** | Create/update/list/get, draft, send, delete | Draft 14-day delete; shareable link; email on send; client view/sign/review; wallets; blockchain on sign |
| **Submission & review** | — | Submission API, accept/revision, emails |
| **Reputation** | — | Per-contract score, persist, optionally on-chain |
| **Profile linkage** | — | Contract on profile, visibility, public `user_name` |

**Immediate next steps (in order):**

1. **Draft auto-delete:** Job that deletes contracts in `draft` older than 14 days.
2. **Send experience:** Shareable contract link; trigger “contract sent” email to client.
3. **Client flow:** View by link, sign (with required/optional fields), send for review.
4. **Wallets + blockchain:** Create freelancer/client wallets; on client sign, write contract to chain and save tx id/hash etc.
5. **Submission and review:** Submit work (criteria + detailed desc), client accept/revision, emails.
6. **Reputation:** Per-contract score from review/deadline/acceptance; store and optionally expose on profile.
7. **Profile:** `user_name`, public profile URL, visibility for profile/projects/contracts.

---

## 4. Technology and layout (aligned with RULES_OF_BACKEND)

- **Stack:** Go, Chi, PostgreSQL (shared `defellix`), GORM. JWT validated with same secret as auth.
- **Layout per service:** `cmd/server`, `internal/{config,domain,dto,handler,middleware,repository,service}`. See [RULES_OF_BACKEND.md](./RULES_OF_BACKEND.md).
- **DB:** Auth, user, contract (and later reputation, etc.) use the same PostgreSQL instance unless the plan explicitly splits them.

---

## 5. References

- **[RULES_OF_BACKEND.md](./RULES_OF_BACKEND.md)** — Attach to every backend prompt. Principles, stack, layout, security, contract/blockchain policy.
- **User flow (above)** — Single source of truth for product intent; backend tasks are derived from it.
- **Learning/executionAccordingLearning.md** — Implementation notes per phase.
- **Learning/TestBackend.md** — How to test each phase.

---

**Document version:** 2.0  
**Last updated:** January 2026  
**Next review:** After draft auto-delete and send-experience (link + email) are implemented.
