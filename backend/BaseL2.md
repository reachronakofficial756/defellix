# Base L2 Integration Guide
## Getting Access and Setting Up Base L2 for the Platform

**Purpose:** This guide walks through getting Base L2 access (testnet and mainnet) and configuring the blockchain-service to write contracts on-chain.

**✅ Status:** You have Alchemy Base Mainnet RPC access configured. Follow the steps below to complete setup.

---

## What is Base L2?

**Base** is an Ethereum Layer 2 (L2) network built on Optimism's OP Stack. It's designed for:
- **Low gas fees** — Much cheaper than Ethereum mainnet
- **Fast transactions** — Quick confirmation times
- **Ethereum compatibility** — Uses same address format and tooling

**Why Base for this platform:**
- Cost-effective for recording contracts on-chain
- Fast enough for good UX
- Secure and decentralized
- Backed by Coinbase

---

## ✅ What You Already Have

- **Alchemy Base Mainnet RPC URL:** `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **Alchemy API Key:** Configured in your account

**Next:** You need to complete the setup steps below.

---

## Step-by-Step Setup Process

### Step 1: Get Base Sepolia Testnet RPC (Recommended for Testing)

**Why:** Test on testnet first before using mainnet (saves real ETH).

**Action Required:**

1. **Go to Alchemy Dashboard:** https://dashboard.alchemy.com/
2. **Create a new app** (or use existing):
   - Click "Create App" or select your existing app
   - **Network:** Select "Base Sepolia" (testnet)
   - **Name:** e.g., "Freelancer Platform Testnet"
3. **Copy the HTTP URL:**
   - It will look like: `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
   - **Note:** Your API key is the same for both mainnet and testnet apps

**What you'll get:**
- Base Sepolia Testnet RPC URL (for testing)
- Same API key works for both testnet and mainnet

---

### Step 2: Get Testnet ETH (Base Sepolia)

**Why:** You need testnet ETH to pay for gas fees during testing.

**Action Required:**

1. **Create a test wallet** (optional, for initial testing):
   - Use MetaMask or Coinbase Wallet
   - Switch network to "Base Sepolia" (Chain ID: 84532)
   - Copy your wallet address

2. **Get testnet ETH from faucet:**
   - **Coinbase Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - **QuickNode Faucet:** https://faucet.quicknode.com/base/sepolia
   - **Alchemy Faucet:** https://www.alchemy.com/faucets/base-sepolia-faucet
   - Request testnet ETH (usually instant)

3. **Verify:** Check your wallet balance on Base Sepolia Explorer: https://sepolia-explorer.base.org

**Note:** The platform creates custodial wallets automatically, but you may want a test wallet for initial verification.

---

### Step 3: Configure blockchain-service Environment Variables

**Action Required:**

1. **Open:** `backend/services/blockchain-service/.env`

2. **Set Base L2 RPC URLs:**

   **For testing (Base Sepolia):**
   ```bash
   BASE_L2_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   BASE_L2_CHAIN_ID=84532
   ```

   **For production (Base Mainnet):**
   ```bash
   BASE_L2_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   BASE_L2_CHAIN_ID=8453
   ```

   **⚠️ Replace `YOUR_API_KEY` with your actual Alchemy API key:** `5f_IFDnH36jZzv_Avi3js`

3. **Generate and set SERVICE_API_KEY:**

   ```bash
   openssl rand -hex 32
   ```

   Copy the output and set in:
   - `backend/services/blockchain-service/.env`: `SERVICE_API_KEY=<output>`
   - `backend/services/contract-service/.env`: `BLOCKCHAIN_SERVICE_API_KEY=<same-output>`

4. **Verify WALLET_ENCRYPTION_KEY is set:**
   - Should already be set (check your `.env`)
   - If not, generate: `openssl rand -hex 32`

5. **Set JWT_SECRET:**
   - Must match auth-service JWT_SECRET
   - Check your `.env` file

**Example `.env` (blockchain-service):**
```bash
BASE_L2_RPC_URL=https://base-mainnet.g.alchemy.com/v2/5f_IFDnH36jZzv_Avi3js
BASE_L2_CHAIN_ID=8453
WALLET_ENCRYPTION_KEY=<your-32-byte-hex-key>
SERVICE_API_KEY=<your-generated-api-key>
JWT_SECRET=<same-as-auth-service>
```

---

### Step 4: Install Ethereum Dependencies

**Action Required:**

```bash
cd backend/services/blockchain-service
go get github.com/ethereum/go-ethereum
go mod tidy
```

This adds the Ethereum library needed for real Base L2 integration.

---

### Step 5: Update Code for Real Base L2 (Replace Mock Mode)

**Action Required:**

**1. Update `pkg/wallet/wallet.go`:**

Replace the `GenerateWallet()` function with real Ethereum key generation:

```go
import (
    "github.com/ethereum/go-ethereum/crypto"
)

func GenerateWallet() (address string, privateKeyHex string, err error) {
    privateKey, err := crypto.GenerateKey()
    if err != nil {
        return "", "", fmt.Errorf("failed to generate key: %w", err)
    }
    privateKeyBytes := crypto.FromECDSA(privateKey)
    privateKeyHex = hex.EncodeToString(privateKeyBytes)
    address = crypto.PubkeyToAddress(privateKey.PublicKey).Hex()
    return address, privateKeyHex, nil
}
```

**2. Update `internal/service/blockchain_service.go`:**

Replace the mock transaction hash generation with real Base L2 submission. See the code example in Step 6 below.

---

### Step 6: Implement Real Base L2 Transaction Submission

**Action Required:**

Update `internal/service/blockchain_service.go` to implement `submitToBaseL2`:

```go
import (
    "github.com/ethereum/go-ethereum"
    "github.com/ethereum/go-ethereum/accounts/abi/bind"
    "github.com/ethereum/go-ethereum/common"
    "github.com/ethereum/go-ethereum/core/types"
    "github.com/ethereum/go-ethereum/crypto"
    "github.com/ethereum/go-ethereum/ethclient"
    "math/big"
)

func (s *BlockchainService) submitToBaseL2(ctx context.Context, freelancerWallet *domain.Wallet, contractData map[string]interface{}) error {
    // 1. Connect to Base L2 RPC
    client, err := ethclient.Dial(s.rpcURL)
    if err != nil {
        return fmt.Errorf("failed to connect to Base L2: %w", err)
    }
    defer client.Close()

    // 2. Decrypt freelancer's private key
    privateKeyHex, err := wallet.DecryptPrivateKey(freelancerWallet.EncryptedPrivateKey, s.encryptionKey)
    if err != nil {
        return fmt.Errorf("failed to decrypt private key: %w", err)
    }
    privateKey, err := crypto.HexToECDSA(privateKeyHex)
    if err != nil {
        return fmt.Errorf("invalid private key: %w", err)
    }

    // 3. Get account address and nonce
    fromAddress := crypto.PubkeyToAddress(privateKey.PublicKey)
    nonce, err := client.PendingNonceAt(ctx, fromAddress)
    if err != nil {
        return fmt.Errorf("failed to get nonce: %w", err)
    }

    // 4. Get gas price
    gasPrice, err := client.SuggestGasPrice(ctx)
    if err != nil {
        return fmt.Errorf("failed to get gas price: %w", err)
    }

    // 5. Prepare transaction data (contract details as JSON in calldata)
    dataJSON, _ := json.Marshal(contractData)
    data := []byte(dataJSON)

    // 6. Create transaction
    tx := types.NewTransaction(
        nonce,
        common.HexToAddress("0x0000000000000000000000000000000000000000"), // Or your contract address if deploying a smart contract
        big.NewInt(0), // Value: 0 ETH
        100000,        // Gas limit (adjust as needed)
        gasPrice,
        data,
    )

    // 7. Sign transaction
    chainID := big.NewInt(s.chainID)
    signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
    if err != nil {
        return fmt.Errorf("failed to sign transaction: %w", err)
    }

    // 8. Submit transaction
    err = client.SendTransaction(ctx, signedTx)
    if err != nil {
        return fmt.Errorf("failed to send transaction: %w", err)
    }

    // 9. Wait for confirmation
    receipt, err := bind.WaitMinted(ctx, client, signedTx)
    if err != nil {
        return fmt.Errorf("transaction failed: %w", err)
    }

    // 10. Update contract record with block details
    contractID := uint(contractData["contract_id"].(float64)) // Adjust type assertion as needed
    return s.contractRepo.UpdateStatus(
        ctx,
        contractID,
        "confirmed",
        &receipt.BlockNumber.Uint64(),
        receipt.BlockHash.Hex(),
        &receipt.GasUsed,
    )
}
```

Then, in `WriteContractToChain`, replace the mock hash generation with:

```go
// Submit to Base L2
if err := s.submitToBaseL2(ctx, freelancerWallet, contractData); err != nil {
    return nil, fmt.Errorf("failed to submit to Base L2: %w", err)
}

// Get transaction hash from the signed transaction
txHash := signedTx.Hash().Hex()
```

---

### Step 7: Test the Integration

**Action Required:**

**1. Start blockchain-service:**
```bash
cd backend/services/blockchain-service
go run cmd/server/main.go
```

**2. Test wallet creation:**
```bash
# Get a JWT token from auth-service first
curl -X POST http://localhost:8083/api/v1/wallets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"user_type":"freelancer"}'
```

**Expected:** Returns wallet address (0x...)

**3. Test contract write:**
- Sign a contract via contract-service
- Check blockchain-service logs for transaction submission
- Verify transaction appears on Base Explorer:
  - **Base Sepolia:** https://sepolia-explorer.base.org
  - **Base Mainnet:** https://basescan.org

**4. Verify contract has blockchain metadata:**
```bash
curl http://localhost:8082/api/v1/contracts/CONTRACT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected:** Response includes `blockchain_tx_hash`, `blockchain_status`, etc.

---

### Step 8: Get Mainnet ETH (For Production)

**Action Required (when ready for production):**

1. **Bridge ETH to Base Mainnet:**
   - Use Base Bridge: https://bridge.base.org
   - Send ETH from Ethereum mainnet → Base Mainnet
   - Wait for confirmation (~2 minutes)

2. **Or buy ETH directly on Base:**
   - Use Coinbase or other exchanges that support Base
   - Transfer to your custodial wallet address (created by the platform)

**Note:** The platform creates custodial wallets automatically. You'll need to fund the freelancer's wallet with ETH for gas fees when contracts are signed.

---

## ✅ Checklist: What You Need to Do

- [ ] **Get Base Sepolia testnet RPC** from Alchemy dashboard (for testing)
- [ ] **Get testnet ETH** from faucet (for testing)
- [ ] **Set BASE_L2_RPC_URL** in blockchain-service `.env` (use your Alchemy URL)
- [ ] **Set BASE_L2_CHAIN_ID** (84532 for testnet, 8453 for mainnet)
- [ ] **Generate SERVICE_API_KEY** and set in both blockchain-service and contract-service `.env`
- [ ] **Verify WALLET_ENCRYPTION_KEY** is set
- [ ] **Install Ethereum dependencies:** `go get github.com/ethereum/go-ethereum`
- [ ] **Update `pkg/wallet/wallet.go`** to use real Ethereum key generation
- [ ] **Implement `submitToBaseL2`** in `blockchain_service.go`
- [ ] **Test wallet creation** via API
- [ ] **Test contract write** by signing a contract
- [ ] **Verify on Base Explorer** that transactions appear on-chain
- [ ] **Get mainnet ETH** (when ready for production)

---

## Quick Reference

### Your Alchemy Configuration

**Base Mainnet:**
- **RPC URL:** `https://base-mainnet.g.alchemy.com/v2/5f_IFDnH36jZzv_Avi3js`
- **Chain ID:** `8453`
- **Explorer:** https://basescan.org

**Base Sepolia Testnet (get from Alchemy dashboard):**
- **RPC URL:** `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY` (same API key)
- **Chain ID:** `84532`
- **Explorer:** https://sepolia-explorer.base.org
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Environment Variables Checklist

**blockchain-service `.env`:**
```bash
# Base L2 RPC (use your Alchemy URL)
BASE_L2_RPC_URL=https://base-mainnet.g.alchemy.com/v2/5f_IFDnH36jZzv_Avi3js
BASE_L2_CHAIN_ID=8453  # 84532 for testnet

# Wallet encryption (already set)
WALLET_ENCRYPTION_KEY=<your-32-byte-hex>

# Service-to-service auth (generate and set)
SERVICE_API_KEY=<generate-with-openssl-rand-hex-32>

# JWT (must match auth-service)
JWT_SECRET=<same-as-auth-service>
```

**contract-service `.env`:**
```bash
# Blockchain service URL
BLOCKCHAIN_SERVICE_URL=http://localhost:8083

# Service API key (same as SERVICE_API_KEY in blockchain-service)
BLOCKCHAIN_SERVICE_API_KEY=<same-as-above>
```

---

## Troubleshooting

**"Failed to connect to Base L2":**
- Verify `BASE_L2_RPC_URL` is correct (check for typos)
- Ensure your Alchemy API key is valid
- Check network connectivity

**"Insufficient funds for gas":**
- **Testnet:** Get testnet ETH from faucet
- **Mainnet:** Ensure wallet has ETH (bridge or buy on Base)
- Check gas price isn't too high

**"Transaction failed":**
- Check transaction on Base Explorer for error details
- Verify gas limit is sufficient (increase if needed)
- Check contract data format is correct

**"Rate limit exceeded":**
- Alchemy free tier: 300M compute units/month
- Monitor usage in Alchemy dashboard
- Upgrade plan if needed for high volume

---

## Next Steps

1. ✅ **You have:** Alchemy Base Mainnet RPC access
2. ⏭️ **Next:** Get Base Sepolia testnet RPC from Alchemy dashboard
3. ⏭️ **Next:** Get testnet ETH from faucet
4. ⏭️ **Next:** Configure `.env` files with your RPC URLs
5. ⏭️ **Next:** Install Ethereum dependencies
6. ⏭️ **Next:** Update code to use real Base L2 (replace mock)
7. ⏭️ **Next:** Test on testnet first
8. ⏭️ **Next:** Switch to mainnet when ready

---

**Last Updated:** January 24, 2026  
**Your Alchemy API Key:** Configured ✅  
**Status:** Ready for integration — follow steps above to complete setup

#### Option A: Public RPC (Free, Rate-Limited)

**Base Sepolia Testnet:**
```
https://sepolia.base.org
```

**Base Mainnet:**
```
https://mainnet.base.org
```

**Pros:** Free, no signup  
**Cons:** Rate-limited, may throttle under load

**Use this for:** Development, testing, low-volume apps

---

#### Option B: RPC Provider (Recommended for Production)

Sign up with an RPC provider for dedicated endpoints:

**1. Alchemy**
   - Sign up: https://www.alchemy.com/
   - Create app → Select "Base" network
   - Copy HTTP URL (e.g. `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY`)
   - **Free tier:** 300M compute units/month

**2. Infura**
   - Sign up: https://www.infura.io/
   - Create project → Add "Base Sepolia" or "Base Mainnet" network
   - Copy endpoint URL (e.g. `https://base-sepolia.infura.io/v3/YOUR_PROJECT_ID`)
   - **Free tier:** 100k requests/day

**3. QuickNode**
   - Sign up: https://www.quicknode.com/
   - Create endpoint → Select "Base Sepolia" or "Base Mainnet"
   - Copy HTTP URL
   - **Free tier:** Limited requests

**4. Coinbase Cloud (Base official)**
   - Sign up: https://www.coinbase.com/cloud
   - Create API key for Base network
   - Use provided RPC URL

**Pros:** Higher rate limits, better reliability, monitoring  
**Cons:** May require payment for high volume

**Use this for:** Production, high-volume apps

---

### Step 3: Get Testnet ETH (Base Sepolia)

If using testnet, you'll need testnet ETH for gas fees:

**1. Base Sepolia Faucet:**
   - https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - Connect wallet (MetaMask, Coinbase Wallet, etc.)
   - Request testnet ETH
   - Wait for confirmation (usually instant)

**2. Alternative Faucets:**
   - https://faucet.quicknode.com/base/sepolia
   - https://www.alchemy.com/faucets/base-sepolia-faucet

**Note:** You need a wallet address to receive testnet ETH. The platform creates custodial wallets, but for initial testing you might want a test wallet.

---

### Step 4: Configure blockchain-service

**1. Set RPC URL in `.env`:**

```bash
# For testnet (Base Sepolia)
BASE_L2_RPC_URL=https://sepolia.base.org
BASE_L2_CHAIN_ID=84532

# OR use an RPC provider URL
BASE_L2_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BASE_L2_CHAIN_ID=84532

# For mainnet (when ready)
BASE_L2_RPC_URL=https://mainnet.base.org
BASE_L2_CHAIN_ID=8453

# OR use an RPC provider URL
BASE_L2_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BASE_L2_CHAIN_ID=8453
```

**2. Generate wallet encryption key:**

```bash
openssl rand -hex 32
```

Copy output to `WALLET_ENCRYPTION_KEY` in `.env`. **Keep this secret!**

**3. Generate service API key (for contract-service → blockchain-service calls):**

```bash
openssl rand -hex 32
```

Copy to `SERVICE_API_KEY` in blockchain-service `.env` and `BLOCKCHAIN_SERVICE_API_KEY` in contract-service `.env`.

**4. Set JWT_SECRET** (same as auth-service)

---

### Step 5: Install Ethereum Dependencies

For real Base L2 integration (not mock mode), add Ethereum libraries:

```bash
cd backend/services/blockchain-service
go get github.com/ethereum/go-ethereum
```

This provides:
- `crypto.GenerateKey()` — secp256k1 key generation
- `crypto.PubkeyToAddress()` — proper address derivation
- `ethclient` — RPC client for Base L2
- Transaction signing and submission

---

### Step 6: Update Code for Real Base L2

**Current status:** blockchain-service runs in **mock/testnet mode** (generates deterministic transaction hashes).

**To enable real Base L2:**

**1. Update `pkg/wallet/wallet.go`:**

Replace `GenerateWallet()` with:

```go
import (
    "github.com/ethereum/go-ethereum/crypto"
)

func GenerateWallet() (address string, privateKeyHex string, err error) {
    privateKey, err := crypto.GenerateKey()
    if err != nil {
        return "", "", fmt.Errorf("failed to generate key: %w", err)
    }
    privateKeyBytes := crypto.FromECDSA(privateKey)
    privateKeyHex = hex.EncodeToString(privateKeyBytes)
    address = crypto.PubkeyToAddress(privateKey.PublicKey).Hex()
    return address, privateKeyHex, nil
}
```

**2. Update `internal/service/blockchain_service.go`:**

Implement `submitToBaseL2`:

```go
import (
    "github.com/ethereum/go-ethereum"
    "github.com/ethereum/go-ethereum/accounts/abi/bind"
    "github.com/ethereum/go-ethereum/common"
    "github.com/ethereum/go-ethereum/core/types"
    "github.com/ethereum/go-ethereum/crypto"
    "github.com/ethereum/go-ethereum/ethclient"
)

func (s *BlockchainService) submitToBaseL2(ctx context.Context, freelancerWallet *domain.Wallet, clientAddress string, contractData map[string]interface{}) error {
    // 1. Connect to Base L2 RPC
    client, err := ethclient.Dial(s.rpcURL)
    if err != nil {
        return fmt.Errorf("failed to connect to Base L2: %w", err)
    }
    defer client.Close()

    // 2. Decrypt freelancer's private key
    privateKeyHex, err := wallet.DecryptPrivateKey(freelancerWallet.EncryptedPrivateKey, s.encryptionKey)
    if err != nil {
        return fmt.Errorf("failed to decrypt private key: %w", err)
    }
    privateKey, err := crypto.HexToECDSA(privateKeyHex)
    if err != nil {
        return fmt.Errorf("invalid private key: %w", err)
    }

    // 3. Get nonce
    fromAddress := crypto.PubkeyToAddress(privateKey.PublicKey)
    nonce, err := client.PendingNonceAt(ctx, fromAddress)
    if err != nil {
        return fmt.Errorf("failed to get nonce: %w", err)
    }

    // 4. Get gas price
    gasPrice, err := client.SuggestGasPrice(ctx)
    if err != nil {
        return fmt.Errorf("failed to get gas price: %w", err)
    }

    // 5. Prepare transaction data (contract details as calldata or use a smart contract)
    // For now, we'll store contract hash and metadata in transaction data
    dataJSON, _ := json.Marshal(contractData)
    data := []byte(dataJSON) // Or encode according to your smart contract ABI

    // 6. Create transaction
    tx := types.NewTransaction(
        nonce,
        common.HexToAddress("0x0000000000000000000000000000000000000000"), // Or your contract address
        big.NewInt(0), // Value: 0 ETH
        100000,        // Gas limit (adjust as needed)
        gasPrice,
        data,
    )

    // 7. Sign transaction
    chainID := big.NewInt(s.chainID)
    signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
    if err != nil {
        return fmt.Errorf("failed to sign transaction: %w", err)
    }

    // 8. Submit transaction
    err = client.SendTransaction(ctx, signedTx)
    if err != nil {
        return fmt.Errorf("failed to send transaction: %w", err)
    }

    // 9. Wait for confirmation (or handle async)
    receipt, err := bind.WaitMinted(ctx, client, signedTx)
    if err != nil {
        return fmt.Errorf("transaction failed: %w", err)
    }

    // 10. Update contract record with block details
    return s.contractRepo.UpdateStatus(
        ctx,
        contractData["contract_id"].(uint),
        "confirmed",
        receipt.BlockNumber.Uint64(),
        receipt.BlockHash.Hex(),
        receipt.GasUsed,
    )
}
```

**3. Replace mock hash generation:**

In `WriteContractToChain`, replace `generateMockTransactionHash` call with:

```go
// Submit to Base L2
if err := s.submitToBaseL2(ctx, freelancerWallet, clientAddress, contractData); err != nil {
    return nil, fmt.Errorf("failed to submit to Base L2: %w", err)
}
```

---

### Step 7: Test the Integration

**1. Start blockchain-service:**

```bash
cd backend/services/blockchain-service
go run cmd/server/main.go
```

**2. Test wallet creation:**

```bash
curl -X POST http://localhost:8083/api/v1/wallets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"user_type":"freelancer"}'
```

**Expected:** Returns wallet address (0x...)

**3. Test contract write:**

Sign a contract via contract-service; check logs for blockchain write result.

**4. Verify on Base Explorer:**

- **Base Sepolia:** https://sepolia-explorer.base.org
- **Base Mainnet:** https://basescan.org

Search by transaction hash to see the on-chain record.

---

### Step 8: Monitor and Maintain

**Gas fees:**
- Base L2 gas fees are much lower than Ethereum mainnet
- Monitor gas prices; adjust `gasPrice` in transaction if needed
- Consider using `SuggestGasPrice()` or `FeeHistory()` for dynamic pricing

**Error handling:**
- Network errors: retry with exponential backoff
- Transaction failures: log and alert; don't fail contract sign
- Rate limiting: implement queuing if using public RPC

**Security:**
- Rotate `WALLET_ENCRYPTION_KEY` periodically
- Use environment-specific keys (dev/staging/prod)
- Consider using a key management service (AWS KMS, HashiCorp Vault) in production

---

## Quick Reference

### Base Sepolia Testnet
- **Chain ID:** `84532`
- **RPC:** `https://sepolia.base.org` (public) or RPC provider
- **Explorer:** https://sepolia-explorer.base.org
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Base Mainnet
- **Chain ID:** `8453`
- **RPC:** `https://mainnet.base.org` (public) or RPC provider
- **Explorer:** https://basescan.org
- **Bridge:** https://bridge.base.org (to move ETH from Ethereum)

### Environment Variables

**blockchain-service `.env`:**
```bash
BASE_L2_RPC_URL=https://sepolia.base.org  # or RPC provider URL
BASE_L2_CHAIN_ID=84532                     # 8453 for mainnet
WALLET_ENCRYPTION_KEY=<32-byte-hex>        # Generate with openssl rand -hex 32
SERVICE_API_KEY=<32-byte-hex>              # For service-to-service auth
JWT_SECRET=<same-as-auth-service>
```

**contract-service `.env`:**
```bash
BLOCKCHAIN_SERVICE_URL=http://localhost:8083
BLOCKCHAIN_SERVICE_API_KEY=<same-as-SERVICE_API_KEY-in-blockchain-service>
```

---

## Troubleshooting

**"Failed to connect to Base L2":**
- Check `BASE_L2_RPC_URL` is correct
- Verify network connectivity
- If using RPC provider, check API key is valid

**"Insufficient funds for gas":**
- For testnet: get testnet ETH from faucet
- For mainnet: ensure wallet has ETH for gas
- Check gas price isn't too high

**"Transaction failed":**
- Check transaction on Base Explorer
- Verify gas limit is sufficient
- Check contract data format is correct

**"Rate limit exceeded":**
- Switch to RPC provider (Alchemy, Infura, etc.)
- Implement request queuing/throttling
- Use multiple RPC endpoints with failover

---

## Next Steps

1. **Start with testnet** — Get familiar with Base L2 using Base Sepolia
2. **Get RPC provider account** — Sign up for Alchemy/Infura for better reliability
3. **Test wallet creation** — Verify wallets are created correctly
4. **Test contract writes** — Sign contracts and verify they appear on-chain
5. **Monitor gas costs** — Track gas usage per contract write
6. **Plan for mainnet** — When ready, switch to Base Mainnet with real ETH

---

**Last Updated:** January 24, 2026  
**Maintained by:** Backend / Platform team
