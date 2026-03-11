# Testing Base Sepolia Integration

This guide walks you through testing the real Base Sepolia testnet integration.

## Prerequisites

1. ✅ **Base Sepolia RPC configured** in `.env`:
   ```bash
   BASE_L2_RPC_URL=https://base-sepolia.g.alchemy.com/v2/5f_IFDnH36jZzv_Avi3js
   BASE_L2_CHAIN_ID=84532
   ```

2. ✅ **Service API Key configured** in both services:
   - `blockchain-service/.env`: `SERVICE_API_KEY=<your-key>`
   - `contract-service/.env`: `BLOCKCHAIN_SERVICE_API_KEY=<same-key>`

3. ✅ **JWT_SECRET matches** across all services

4. ✅ **WALLET_ENCRYPTION_KEY** is set

5. ⚠️ **Get testnet ETH** for your wallets (see below)

---

## Step 1: Get Testnet ETH

**Important:** You need testnet ETH in the freelancer's wallet to pay for gas fees when writing contracts to Base Sepolia.

### Option A: Use Base Sepolia Faucet

1. **Create a test wallet** (optional, for initial testing):
   - Use MetaMask or Coinbase Wallet
   - Add Base Sepolia network:
     - **Network Name:** Base Sepolia
     - **RPC URL:** `https://sepolia.base.org`
     - **Chain ID:** `84532`
     - **Currency Symbol:** ETH
     - **Block Explorer:** `https://sepolia-explorer.base.org`

2. **Get testnet ETH:**
   - **Coinbase Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - **QuickNode Faucet:** https://faucet.quicknode.com/base/sepolia
   - **Alchemy Faucet:** https://www.alchemy.com/faucets/base-sepolia-faucet

3. **Fund your custodial wallet:**
   - After creating a wallet via the API (see Step 2), copy the wallet address
   - Send testnet ETH from your test wallet to the custodial wallet address

### Option B: Fund via API (if you have a funded wallet)

If you already have a wallet with testnet ETH, you can transfer it to the custodial wallet address.

---

## Step 2: Start Services

### Start blockchain-service:

```bash
cd backend/services/blockchain-service
go run cmd/server/main.go
```

Expected output:
```
blockchain-service: migrations done
blockchain-service listening on 0.0.0.0:8083
```

### Start contract-service:

```bash
cd backend/services/contract-service
go run cmd/server/main.go
```

### Start auth-service (if not running):

```bash
cd backend/services/auth-service
go run cmd/server/main.go
```

---

## Step 3: Test Wallet Creation

### 3.1 Get JWT Token

First, login to get an access token:

```bash
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "freelancer@example.com",
    "password": "your-password"
  }'
```

Copy the `access_token` from the response.

### 3.2 Create Freelancer Wallet

```bash
curl -X POST http://localhost:8083/api/v1/wallets \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "user_type": "freelancer"
  }'
```

**Expected response:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "user_id": 1,
    "user_type": "freelancer",
    "created_at": "2026-01-24T10:00:00Z"
}
```

**⚠️ Important:** Copy the `address` — you'll need to fund this wallet with testnet ETH!

### 3.3 Fund the Wallet

1. Go to Base Sepolia faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
2. Enter your wallet address (from step 3.2)
3. Request testnet ETH (usually instant)
4. Verify on explorer: https://sepolia-explorer.base.org/address/YOUR_WALLET_ADDRESS

---

## Step 4: Test Contract Signing (Full Flow)

### 4.1 Create a Contract (as freelancer)

```bash
curl -X POST http://localhost:8082/api/v1/contracts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_email": "client@example.com",
    "project_name": "Test Project",
    "total_amount": 1000.00,
    "currency": "USD",
    "due_date": "2026-02-24T00:00:00Z",
    "milestones": [
      {
        "title": "Milestone 1",
        "amount": 500.00,
        "due_date": "2026-02-10T00:00:00Z"
      }
    ]
  }'
```

Copy the `id` from the response.

### 4.2 Send Contract to Client

```bash
curl -X POST http://localhost:8082/api/v1/contracts/CONTRACT_ID/send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Copy the `shareable_link` or `client_view_token` from the response.

### 4.3 Client Signs Contract (Public Endpoint)

```bash
curl -X POST http://localhost:8082/api/v1/public/contracts/CLIENT_VIEW_TOKEN/sign \
  -H "Content-Type: application/json" \
  -d '{
    "company_address": "123 Main St, City, Country"
  }'
```

**This triggers:**
1. Contract status → `signed`
2. Contract-service calls blockchain-service (async)
3. Blockchain-service writes contract to Base Sepolia
4. Contract metadata updated with transaction hash

### 4.4 Check Contract Blockchain Metadata

```bash
curl http://localhost:8082/api/v1/contracts/CONTRACT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected response includes:**
```json
{
  "id": 1,
  "status": "signed",
  "blockchain_tx_hash": "0x...",
  "blockchain_status": "confirmed",
  "blockchain_block_num": 12345678,
  "blockchain_gas_used": 21000,
  "blockchain_network": "base_sepolia"
}
```

### 4.5 Verify on Base Sepolia Explorer

Visit: https://sepolia-explorer.base.org/tx/BLOCKCHAIN_TX_HASH

You should see:
- ✅ Transaction status: Success
- ✅ Block number
- ✅ Gas used
- ✅ Contract data (in calldata)

---

## Step 5: Test Blockchain Service Directly

### 5.1 Write Contract to Chain (Direct API Call)

```bash
curl -X POST http://localhost:8083/api/v1/blockchain/contracts \
  -H "X-API-Key: YOUR_SERVICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": 1,
    "freelancer_id": 1,
    "client_id": 0,
    "freelancer_email": "freelancer@example.com",
    "client_email": "client@example.com",
    "total_amount": 1000.00,
    "currency": "USD",
    "project_name": "Test Project",
    "due_date": "2026-02-24T00:00:00Z",
    "contract_hash": "abc123..."
  }'
```

**Expected response:**
```json
{
  "contract_id": 1,
  "transaction_hash": "0x...",
  "transaction_id": "0x...",
  "block_number": 12345678,
  "gas_used": 21000,
  "status": "confirmed",
  "network": "base_sepolia",
  "created_at": "2026-01-24T10:00:00Z"
}
```

### 5.2 Get Contract Record

```bash
curl -X POST http://localhost:8083/api/v1/blockchain/contracts/get \
  -H "X-API-Key: YOUR_SERVICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": 1
  }'
```

---

## Troubleshooting

### Error: "insufficient funds for gas"

**Solution:** Fund your freelancer's custodial wallet with testnet ETH.

1. Get wallet address from API
2. Use Base Sepolia faucet to send testnet ETH
3. Wait for confirmation (~1-2 minutes)
4. Retry the contract signing

### Error: "failed to connect to Base L2 RPC"

**Check:**
- `BASE_L2_RPC_URL` is correct in `.env`
- Alchemy API key is valid
- Network connectivity
- Alchemy dashboard shows no rate limit issues

### Error: "transaction failed or timeout"

**Possible causes:**
- Gas price too low (network congestion)
- Gas limit too low
- RPC endpoint issues

**Solution:**
- Check Base Sepolia network status
- Increase gas limit in code (if needed)
- Retry after a few minutes

### Transaction stuck in "pending"

**Check:**
- Base Sepolia explorer: https://sepolia-explorer.base.org
- Transaction hash status
- Network congestion

---

## What to Check

✅ **Wallet creation** works and returns valid Ethereum addresses  
✅ **Contract signing** triggers blockchain write  
✅ **Transaction appears** on Base Sepolia explorer  
✅ **Contract metadata** includes blockchain details (tx hash, block number, gas used)  
✅ **Gas fees** are deducted from freelancer's wallet  
✅ **Error handling** works (insufficient funds, network errors, etc.)

---

## Next Steps

Once testing on Base Sepolia is successful:

1. **Switch to mainnet** (when ready for production):
   - Update `.env`: `BASE_L2_RPC_URL` to mainnet
   - Update `.env`: `BASE_L2_CHAIN_ID` to `8453`
   - Fund wallets with real ETH (via Base Bridge: https://bridge.base.org)

2. **Monitor transactions:**
   - Set up alerts for failed transactions
   - Monitor gas usage
   - Track contract writes

3. **Optimize:**
   - Consider deploying a smart contract for more efficient data storage
   - Batch transactions if needed
   - Implement retry logic for failed transactions

---

**Last Updated:** January 24, 2026  
**Network:** Base Sepolia Testnet (Chain ID: 84532)  
**Status:** Ready for testing ✅
