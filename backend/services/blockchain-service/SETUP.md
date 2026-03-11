# Blockchain Service – Setup (Phase 3.4)

**📖 For detailed Base L2 access and integration guide, see [BaseL2.md](../../BaseL2.md)**

## What this service does

- **Wallet management** – Creates and manages custodial wallets for freelancers and clients (no user key handling).
- **Blockchain writing** – Writes signed contracts to Base L2 blockchain (testnet or mainnet).
- **Contract records** – Stores on-chain transaction details (tx hash, block number, gas used, etc.).

Uses the **same PostgreSQL database** as other services: `defellix`.

---

## Prerequisites

- Go 1.24+
- PostgreSQL (same DB as auth/user/contract services)
- **Base L2 access** (testnet or mainnet):
  - ✅ **Mainnet:** Alchemy Base Mainnet RPC configured
  - ⏭️ **Testnet (Base Sepolia):** Get from Alchemy dashboard (recommended for testing)
  - **Public RPC (fallback):** https://sepolia.base.org (Chain ID: 84532) or https://mainnet.base.org (Chain ID: 8453)

---

## Database

Reuse the existing database. Blockchain-service will create:

- `wallets` — Custodial wallet addresses and encrypted private keys
- `contract_records` — On-chain contract transaction records

No extra DB setup if other services are already running against `defellix`.

---

## Environment variables

Copy from example and adjust:

```bash
cp .env.example .env
```

Required:

- **DB_*** – Same as other services (host, port, user, password, `DB_NAME=defellix`, SSL mode).
- **JWT_SECRET** – Same value as auth-service, so access tokens from login can be validated here.
- **WALLET_ENCRYPTION_KEY** – 32-byte hex key for encrypting wallet private keys. Generate with: `openssl rand -hex 32`.
- **SERVICE_API_KEY** – Optional: API key for service-to-service auth (e.g. from contract-service). Generate with: `openssl rand -hex 32`. If set, contract-service should set `BLOCKCHAIN_SERVICE_API_KEY` to the same value.

**Base L2 Configuration (Required for real blockchain integration):**

- **BASE_L2_RPC_URL** – Your Alchemy Base L2 RPC URL:
  - **Mainnet:** `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
  - **Testnet:** `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY` (get from Alchemy dashboard)
  - **Your API Key:** `5f_IFDnH36jZzv_Avi3js` (set in `.env`, replace `YOUR_API_KEY` above)
- **BASE_L2_CHAIN_ID** – `8453` for mainnet, `84532` for testnet (Base Sepolia)

**Other optional:**

- **SERVER_PORT** – Default `8083`.
- **APP_ENV**, **LOG_LEVEL** – As needed.

---

## Generate wallet encryption key

```bash
openssl rand -hex 32
```

Copy the output to `WALLET_ENCRYPTION_KEY` in `.env`. **Keep this secret** — it encrypts all wallet private keys.

---

## Run

```bash
cd backend/services/blockchain-service
go mod tidy
go run cmd/server/main.go
```

Default base URL: `http://0.0.0.0:8083`

---

## Verify

```bash
curl -s http://localhost:8083/health
```

Expected shape: `{"status":"healthy","service":"blockchain-service",...}`

---

## API overview

**All endpoints require authentication:**
- **JWT:** `Authorization: Bearer <access_token>` (from auth-service login) — for user-facing calls
- **Service-to-service:** `X-API-Key: <SERVICE_API_KEY>` — for internal service calls (e.g. from contract-service)

### Wallet endpoints

- `POST /api/v1/wallets` – Create or get wallet for a user. Body: `{ "user_id": 1, "user_type": "freelancer" }` or `"client"`.
- `POST /api/v1/wallets/get` – Get wallet by user_id and user_type.

### Blockchain endpoints

- `POST /api/v1/blockchain/contracts` – Write contract to chain. Called by contract-service on sign.
- `POST /api/v1/blockchain/contracts/get` – Get contract record by contract_id.

---

## Base L2 integration (current status)

**✅ You have:** Alchemy Base Mainnet RPC access configured.

**Current implementation:** Mock/testnet mode. Transaction hashes are generated deterministically for testing.

**To enable real Base L2:**

1. ✅ **Set `BASE_L2_RPC_URL`** in `.env`:
   ```bash
   # For mainnet (production)
   BASE_L2_RPC_URL=https://base-mainnet.g.alchemy.com/v2/5f_IFDnH36jZzv_Avi3js
   BASE_L2_CHAIN_ID=8453
   
   # For testnet (testing - get from Alchemy dashboard)
   BASE_L2_RPC_URL=https://base-sepolia.g.alchemy.com/v2/5f_IFDnH36jZzv_Avi3js
   BASE_L2_CHAIN_ID=84532
   ```

2. **Add Ethereum dependency:**
   ```bash
   cd backend/services/blockchain-service
   go get github.com/ethereum/go-ethereum
   go mod tidy
   ```

3. **Update `pkg/wallet/wallet.go`:**
   - Replace `GenerateWallet()` with `crypto.GenerateKey()` and `crypto.PubkeyToAddress()`
   - Use secp256k1 curve (Ethereum standard)
   - See [BaseL2.md](../../BaseL2.md) for code examples

4. **Implement `submitToBaseL2` in `blockchain_service.go`:**
   - Decrypt wallet private key using `wallet.DecryptPrivateKey()`
   - Create transaction with contract data
   - Sign transaction using `crypto.Sign()`
   - Submit via Base L2 RPC (eth_sendRawTransaction)
   - Wait for confirmation (or handle async via job)
   - Update contract record with block number, gas used, etc.
   - See [BaseL2.md](../../BaseL2.md) for detailed implementation guide

5. **Get testnet ETH (for testing):**
   - Use Base Sepolia faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - Fund your custodial wallets (created automatically by the platform)

6. **Get mainnet ETH (for production):**
   - Bridge ETH to Base: https://bridge.base.org
   - Or buy ETH directly on Base via Coinbase

**📖 Detailed step-by-step guide:** See [BaseL2.md](../../BaseL2.md) for complete integration instructions.

**For now:** The service structure is ready; blockchain writes return mock transaction hashes. Follow the steps above to enable real Base L2 integration.

---

## Security notes

- **WALLET_ENCRYPTION_KEY** must be kept secret. Rotate if compromised.
- Private keys are encrypted at rest (AES-256-GCM).
- Never log private keys or encryption keys.
- In production, consider using a key management service (e.g. AWS KMS, HashiCorp Vault).

---

## Integration with contract-service

Contract-service calls blockchain-service when a contract is signed:

1. Client signs contract via `POST /api/v1/public/contracts/:token/sign`.
2. Contract-service updates status to `signed`.
3. Contract-service calls `POST /api/v1/blockchain/contracts` (async, off hot path).
4. Blockchain-service creates wallets if needed, writes contract to chain, returns tx hash.
5. Contract-service updates contract with blockchain metadata.

Set `BLOCKCHAIN_SERVICE_URL` in contract-service `.env` to enable this integration.
