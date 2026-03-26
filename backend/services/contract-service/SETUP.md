# Contract Service – Setup (Phase 3)

## What this service does

- **Create contract (draft)** – Project details, client details, milestones, terms.
- **Update contract** – When status is `draft` or `pending` (freelancer can edit after client sends for review).
- **Send to client** – `draft` → `sent` (sets `client_view_token` UUID, `shareable_link` = base + token) or `pending` → `sent` (re-send). Triggers email notification (hook; no-op by default).
- **List / get** – By freelancer; when sent, `shareable_link` = base + token.
- **Draft auto-delete** – Background job deletes drafts older than 14 days (configurable).
- **Public (no auth):** `GET /api/v1/public/contracts/:token` (client view), `POST .../send-for-review`, `POST .../sign`.

Uses the **same PostgreSQL database** as auth-service and user-service: `defellix`.

---

## Prerequisites

- Go 1.24+
- PostgreSQL (already used by auth-service and user-service)

---

## Database

Reuse the existing database. Contract-service will create:

- `contracts`
- `contract_milestones`

No extra DB setup if auth/user are already running against `defellix`.

---

## Environment variables

Copy from example and adjust:

```bash
cp .env.example .env
```

Required:

- **DB_*** – Same as auth/user (host, port, user, password, `DB_NAME=defellix`, SSL mode).
- **JWT_SECRET** – Same value as auth-service, so access tokens from login can be validated here.

Optional:

- **SERVER_PORT** – Default `8082`.
- **APP_ENV**, **LOG_LEVEL** – As needed.
- **SHAREABLE_LINK_BASE_URL** – Base for client contract links (e.g. `https://app.ourdomain.com/contract`). When set, `shareable_link` = base + token (UUID). Client opens that URL to view/sign/send-for-review.
- **DRAFT_EXPIRY_DAYS** – Delete drafts older than this (default `14`).
- **DRAFT_CLEANUP_INTERVAL_MINS** – How often the draft-cleanup job runs in minutes (default `360`).

---

## Run

```bash
cd backend/services/contract-service
go run cmd/server/main.go
```

Default base URL: `http://0.0.0.0:8082`

---

## Verify

```bash
curl -s http://localhost:8082/health
```

Expected shape: `{"status":"healthy","service":"contract-service",...}`

---

## API overview (all require `Authorization: Bearer <access_token>`)

- `POST /api/v1/contracts` – Create contract (draft). Body: project + client + milestones + terms.
- `GET /api/v1/contracts` – List contracts. Query: `?status=draft|sent&page=1&limit=20`.
- `GET /api/v1/contracts/:id` – Get one contract.
- `PUT /api/v1/contracts/:id` – Update contract (draft or pending).
- `POST /api/v1/contracts/:id/send` – Send to client (draft → sent) or re-send (pending → sent). Response includes `shareable_link` when configured.
- `DELETE /api/v1/contracts/:id` – Delete contract (draft only).

**Public endpoints (no auth):**

- `GET /api/v1/public/contracts/:token` – Client view contract (token from shareable link).
- `POST /api/v1/public/contracts/:token/send-for-review` – Body `{ "comment": "..." }`; status → pending.
- `POST /api/v1/public/contracts/:token/sign` – Body: `company_address` (required), optional email, phone, gst_number, etc. Status → signed (blockchain in 3.4).

Use the same access token from auth-service login for protected routes. Drafts are automatically deleted after 14 days (configurable).

---

## AI helpers (Groq)

Requires `GROQ_API_KEY` in `.env` (optional `GROQ_MODEL`).

- `POST /api/v1/contracts/suggest-milestones` – milestone split from project context (+ optional `prd_extracted_text`).
- `POST /api/v1/contracts/suggest/scope` – **core deliverable** + **out of scope** (same context + PRD excerpt). Nested path under `/contracts/suggest/…`.
- `POST /api/v1/contracts/suggest/terms` – **terms & conditions** from full context (client, milestones JSON, scope, timeline, payment, PRD excerpt, optional existing textarea). Legacy: `POST /api/v1/contracts/suggest-terms`.
- Legacy alias: `POST /api/v1/contracts/suggest-scope` (same handler as `/suggest/scope`).

**Production (`api.defellix.com`):** If the app gets **404** on scope AI, the running **contract-service image is outdated**. Rebuild and restart:

```bash
cd backend
docker compose build --no-cache contract-service
docker compose up -d contract-service api-gateway
```

Or your CI/CD pipeline equivalent so the server runs a binary that includes `SuggestScope`.
