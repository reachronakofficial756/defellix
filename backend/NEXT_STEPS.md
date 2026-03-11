# Next Steps — Backend
## Where we are and what to do next

**Always use:** [RULES_OF_BACKEND.md](./RULES_OF_BACKEND.md) in every backend-related prompt.  
**Source of truth for product:** User flow in [execution.md](./execution.md#1-user-flow-source-of-truth).

---

## Where we are now

- **Auth:** ✅ Done (login/signup, JWT, OAuth).
- **User:** ✅ Done (profile CRUD, skills, projects, search, `user_name`, public profile, visibility).
- **Contract:** ✅ Create/update/list/get, save as draft, send to client, delete draft, draft auto-delete, shareable link, email trigger, client view by token, send-for-review, sign, **wallets**, **blockchain on sign** (mock/testnet ready; **Alchemy Base Mainnet RPC configured** — see [BaseL2.md](./BaseL2.md) for integration steps).  
  ❌ Pending: submission, review, reputation (Phase 4).

---

## Recommended order of work

Do these in sequence so each step has a clear input/output.

### 1. Draft auto-delete (14 days) ✅ DONE (Phase 3.2)

- **What:** Remove contracts with `status = draft` and `updated_at` (or `created_at`) older than 14 days.
- **Where:** Contract service (or a small jobs runner that calls contract-service logic).
- **How:** Cron or internal ticker; use a single DB query + delete in a transaction. Idempotent and safe to run daily/hourly.
- **Rules:** [RULES_OF_BACKEND.md](./RULES_OF_BACKEND.md) — jobs off hot path, no PII in logs.

**Implemented:** Contract-service `DeleteDraftsOlderThan` (repo, by `created_at`), `DeleteExpiredDrafts` (service), `job.DraftCleanupRunner` (internal ticker). Env: `DRAFT_EXPIRY_DAYS`, `DRAFT_CLEANUP_INTERVAL_MINS`. See [execution.md](./execution.md) §3.2.

---

### 2. Send experience: shareable link + email ✅ DONE (Phase 3.2)

- **Shareable link:** For a contract in `sent` (or after send), expose a URL the freelancer can copy. **Done:** `shareable_link` in send response and in GET contract when `SHAREABLE_LINK_BASE_URL` is set (e.g. `https://app.ourdomain.com/contract/:id`). Frontend uses this for “Copy link”.
- **Email on send:** When `POST /api/v1/contracts/:id/send` succeeds, **Done:** `ContractNotifier.NotifyContractSent` triggered in a goroutine; no-op by default. Send API is not blocked.

---

### 3. Client: view contract by link ✅ DONE (Phase 3.3)

- **What:** Client opens the contract via the shareable link (no login required for view).
- **Done:** `GET /api/v1/public/contracts/:token` returns contract details for view + sign or send-for-review. Token is UUID set when freelancer sends; shareable_link = base + token.

---

### 4. Client: sign or send for review ✅ DONE (Phase 3.3)

- **Sign:** **Done:** `POST /api/v1/public/contracts/:token/sign` — company_address required (Remote | address | URL); optional email, phone, gst_number, business_email, instagram, linkedin stored in client_sign_metadata. Status → signed. GST validator deferred; wallets and blockchain in 3.4.
- **Send for review:** **Done:** `POST /api/v1/public/contracts/:token/send-for-review` with `{ "comment": "..." }`; status → pending. Freelancer can update (allowed when pending) and Send again (pending → sent).

---

### 5. Wallets and blockchain on sign ✅ DONE (Phase 3.4)

- **Wallets:** **Done:** blockchain-service `POST /api/v1/wallets` creates custodial wallets (freelancer/client) with encrypted private keys. Wallets table: user_id, user_type, address, encrypted_private_key. No UI for private keys.
- **On sign:** **Done:** contract-service calls blockchain-service `POST /api/v1/blockchain/contracts` (async) when client signs. Blockchain-service writes contract to chain (mock/testnet mode; **Alchemy Base Mainnet RPC configured** — follow [BaseL2.md](./BaseL2.md) to enable real Base L2). Contract domain stores blockchain_tx_hash, blockchain_tx_id, blockchain_block_num, blockchain_gas_used, blockchain_network, blockchain_status.
- **Rules:** [RULES_OF_BACKEND.md](./RULES_OF_BACKEND.md) — “Zero blockchain friction”, “Legalising contracts”. ✅ Implemented: wallets managed by backend, blockchain write off hot path, metadata persisted.
- **Next steps for real Base L2:**
  1. ✅ Get Base Sepolia testnet RPC from Alchemy dashboard (for testing)
  2. ✅ Get testnet ETH from faucet
  3. ✅ Configure `.env` files with Alchemy RPC URLs
  4. ⏭️ Install Ethereum dependencies (`go get github.com/ethereum/go-ethereum`)
  5. ⏭️ Update code to use real Base L2 (replace mock implementation)
  6. ⏭️ Test on testnet first
  7. ⏭️ Switch to mainnet when ready
  - **See:** [BaseL2.md](./BaseL2.md) for complete step-by-step guide


---

### 6. Submission and client review

- **Submission:**  
  - Freelancer submits: one field that matches “submission criteria” + one “detailed description” field.  
  - Store submission; trigger email to client.

- **Review:**  
  - Client can **Accept** or **Ask for revision** (with optional comment).  
  - Accept/revision updates submission/contract state and can trigger emails.

---

### 7. Reputation and profile link

- **Reputation:** Compute per-contract score from: client review, on-time vs late, accepted vs not. Persist; later you can expose it on profile and optionally on-chain.
- **Profile:**  
  - Link contract to freelancer profile (e.g. `contract_id` or summary on profile).  
  - Add visibility: freelancer chooses which contracts (and which fields) show on public profile.

---

### 8. Public profile and `user_name`

- **user_name:** Add to user profile; unique; used in `ourdomain.com/user_name`.
- **Public profile API:** e.g. `GET /api/v1/public/profile/:user_name` that returns only allowed fields based on visibility.
- **Visibility:** Which parts of profile, projects, and contracts are shown (already referenced in execution plan).

---

## Quick reference

| Document | Use |
|----------|-----|
| [RULES_OF_BACKEND.md](./RULES_OF_BACKEND.md) | Attach to every backend prompt; principles, stack, conventions. |
| [execution.md](./execution.md) | User flow (source of truth), phases, done/not-done, deliverables. |
| [Learning/executionAccordingLearning.md](../Learning/executionAccordingLearning.md) | How we implemented each phase. |
| [Learning/TestBackend.md](../Learning/TestBackend.md) | How to test each phase. |

---

**Last updated:** January 2026
