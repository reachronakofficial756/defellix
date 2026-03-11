# Rules of Backend
## Defellix — Development Standards

**Attach this document to every backend-related prompt.**  
**Audience:** Backend development (Go).  
**Written as:** 10+ year experienced Go backend engineer.  
**Goals:** Speed, security, scale. **Mission:** Legalise freelancer contracts through blockchain and build lasting freelancer trust.

---

## 1. Mission & product intent

- **Legalising contracts:** Every signed contract is recorded on-chain (transaction id, hash, timestamp, deadline, amount, gas). No ambiguity, no “he said / she said”.
- **Freelancer trust:** Reputation is derived from real outcomes—client review, on-time submission, acceptance—and is portable and verifiable.
- **Zero blockchain friction:** Wallets for freelancer and client are created and managed by the backend. Users do not need blockchain knowledge or wallets to use the platform.

All backend decisions (APIs, schemas, jobs, services) must support this intent.

---

## 2. Principles (non-negotiable)

| Principle | Meaning |
|-----------|--------|
| **Speed** | APIs respond in < 200ms p95 where possible; use indexing, caching, and async jobs for heavy work; avoid N+1 and unnecessary round-trips. |
| **Security** | Validate and sanitise all inputs; never log secrets or PII in plain text; use parameterised queries; enforce auth on every mutating and sensitive read endpoint. |
| **Scale** | Design for 1000+ concurrent users from day one: stateless services, connection pooling, idempotent writes where it matters, clear ownership of data per service. |

---

## 3. Tech stack (defaults)

- **Language:** Go 1.21+.
- **HTTP:** `net/http` + **Chi** router. Route groups, middleware, URL params only—no magic.
- **DB:** **PostgreSQL** (single logical DB `defellix` for auth, user, contract; extra DBs only when there is a documented reason). **GORM** for migrations and CRUD; use transactions for multi-table writes.
- **Auth:** JWT access/refresh from auth-service. Other services validate using the **same JWT_SECRET** or a shared introspect endpoint. No auth bypass in production.
- **Blockchain:** Base L2 (or agreed L2). Backend owns key derivation and signing; users never see private keys.

Use the same stack across services unless the execution plan explicitly allows an exception.

---

## 4. Service layout (clean architecture)

Every service follows:

```
service-name/
├── cmd/server/main.go          # wire config, DB, router, start server
├── internal/
│   ├── config/                 # env-based config (server, DB, feature flags)
│   ├── domain/                 # core entities and shared constants (no DTOs)
│   ├── dto/                    # request/response structs and validation tags
│   ├── handler/                # HTTP handlers: parse input, call service, write response
│   ├── middleware/             # auth, CORS, logger, recoverer, validator
│   ├── repository/             # DB access only; interfaces in same package
│   └── service/                # business logic; calls repository, returns domain or DTO
├── pkg/                        # only if truly shared and reusable (e.g. jwt parse)
├── SETUP.md                    # how to run, env vars, DB
└── go.mod
```

- **Handlers:** Thin. Parse path/query/body, validate via DTOs, call one service method, map result to HTTP status/body. No business rules in handlers.
- **Services:** Contain all business rules. Take context and DTOs/IDs; return domain or DTOs; return typed errors (e.g. `ErrNotFound`, `ErrForbidden`) for handlers to map to HTTP.
- **Repositories:** Take context and domain (or ids); return domain or slices; use transactions when updating multiple tables.

---

## 5. Conventions

### 5.1 API design

- REST over `/api/v1/...`. Plural resources: `/api/v1/contracts`, `/api/v1/contracts/:id`.
- JSON request/response. Use `Content-Type: application/json` and `Accept: application/json`.
- Standard status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 500 Internal Server Error.
- Errors: `{ "error": "…", "message": "…", "code": "…" }`. `code` is a stable string for clients.
- Pagination: `page` (1-based) and `limit` (cap e.g. 100). Response includes `total` when listing.

### 5.2 Validation

- Use **go-playground/validator** on DTOs. Validate in handler before calling service.
- Required vs optional: use `validate:"required"` or `omitempty` and document in OpenAPI or contract docs.
- Sanitise strings (trim, length caps) and reject invalid formats (email, URL, phone, GST where applicable).

### 5.3 Auth and identity

- All mutating and sensitive read endpoints require a valid JWT in `Authorization: Bearer <token>`.
- Resolve `user_id` (and optionally `email`, `role`) from JWT claims; pass `user_id` into service/repository for ownership and scoping. Never trust client-sent `user_id` for “who am I”.
- Contract “freelancer” and “client” are identified by internal user ids or by verified email/phone when the party is not yet a platform user.

### 5.4 Database

- One migration strategy per service (e.g. GORM AutoMigrate in dev; explicit migrations in prod when we add that).
- Indexes for all foreign keys and query filters (status, dates, user_id).
- Use transactions for “create contract + milestones”, “accept submission + update reputation”, etc.
- No raw SQL in handlers; keep it in repository or shared query helpers.

### 5.5 Errors and logging

- Prefer typed errors (`var ErrContractNotFound = errors.New("…")`) and `errors.Is` in handlers to choose status and message.
- Log at boundaries (handler enter/exit, service high-level steps). Do not log request/response bodies that may contain secrets or PII; log IDs and status only where needed for debugging.
- Panics are recovered in middleware; return 500 and a generic message to the client.

### 5.6 Idempotency and jobs

- For “send contract”, “sign contract”, “record on blockchain”, design so repeating the same intent does not duplicate side-effects (e.g. “already sent” / “already signed”).
- Heavy or external work (emails, blockchain tx, PDF generation) should be off the hot path: enqueue a job or call a worker; return 202 or 200 with “pending” where appropriate.
- Scheduled jobs (e.g. “delete drafts older than 14 days”) must be documented in the execution plan and implemented in a single place (cron or internal job runner).

---

## 6. Contract and blockchain

- **Draft:** Stored only in backend. No blockchain, no email. Deleted automatically after 14 days (job).
- **Sent:** Backend stores “sent” state and shareable link. Optional: trigger email to client and “copy link” for freelancer. Blockchain record is created **on client sign**, not on send.
- **Signed:** Client signs (with required/optional fields as per product). Backend creates/uses wallets for both sides, writes the contract record on-chain (tx id, hash, timestamp, deadline, amount, gas), then updates status to “signed”. No user-facing key management.
- **Submissions and reviews:** Stored in backend; reputation logic uses “accepted / revision / deadline met / missed” and similar flags.

All of this must be reflected in the execution plan and in API contracts.

---

## 7. Learning and test documentation (required after each week or phase)

**Update these two documents at the end of every week or phase:**

- **[Learning/executionAccordingLearning.md](../Learning/executionAccordingLearning.md)** — Add or update the section for that week/phase: what was implemented, which packages and patterns were used, and any concepts or decisions that will help future work.
- **[Learning/TestBackend.md](../Learning/TestBackend.md)** — Add or update test cases and verification steps for that week/phase: curl examples (or equivalent), expected responses, and a short checklist so we can confirm the phase is done.

Treat this as mandatory. No week or phase is considered complete until both docs are updated.

---

## 8. What belongs in execution vs here

- **Execution plan:** Phases, weeks, tasks, deliverables, API list, DB changes, and “where we are now”. User-flow alignment (draft → send → sign → submission → reputation → profile) lives there.
- **This document:** How we build (principles, stack, layout, conventions, security, contracts/blockchain policy). Stable across phases unless we explicitly change stack or mission.

---

## 9. Checklist before merging backend changes

- [ ] New/updated endpoints follow REST and error conventions above.
- [ ] DTOs have validation tags and are used in handlers.
- [ ] Auth is applied on all protected routes; `user_id` comes from token.
- [ ] New tables/columns have indexes for expected queries.
- [ ] Multi-entity writes use a transaction.
- [ ] No secrets or PII in logs.
- [ ] SETUP.md (or main backend README) updated if new env or DB objects are introduced.
- [ ] Execution plan (and optionally NEXT_STEPS) updated if a deliverable or phase changed.
- [ ] **Learning/executionAccordingLearning.md** and **Learning/TestBackend.md** updated for that week or phase (see §7).

---

**Document version:** 1.0  
**Last updated:** January 2026  
**Owner:** Backend / platform team. Attach to every backend-related prompt.
