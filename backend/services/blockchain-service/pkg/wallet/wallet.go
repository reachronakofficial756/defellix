package wallet

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"golang.org/x/crypto/pbkdf2"
)

// GenerateWallet creates a new Ethereum wallet (address + private key)
// Uses real Ethereum secp256k1 key generation for Base L2 compatibility
func GenerateWallet() (address string, privateKeyHex string, err error) {
	// Generate secp256k1 private key using Ethereum crypto library
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		return "", "", fmt.Errorf("failed to generate key: %w", err)
	}

	// Convert private key to hex string
	privateKeyBytes := crypto.FromECDSA(privateKey)
	privateKeyHex = hex.EncodeToString(privateKeyBytes)

	// Derive Ethereum address from public key
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return "", "", fmt.Errorf("failed to cast public key to ECDSA")
	}
	address = crypto.PubkeyToAddress(*publicKeyECDSA).Hex()

	return address, privateKeyHex, nil
}

// EncryptPrivateKey encrypts a private key using AES-256-GCM with a master key
func EncryptPrivateKey(privateKeyHex, masterKey string) (string, error) {
	// Derive encryption key from master key using PBKDF2
	key := pbkdf2.Key([]byte(masterKey), []byte("freelancer-wallet-salt"), 4096, 32, sha256.New)
	
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	privateKeyBytes, err := hex.DecodeString(privateKeyHex)
	if err != nil {
		return "", fmt.Errorf("invalid private key hex: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, privateKeyBytes, nil)
	return hex.EncodeToString(ciphertext), nil
}

// DecryptPrivateKey decrypts an encrypted private key
func DecryptPrivateKey(encryptedHex, masterKey string) (string, error) {
	key := pbkdf2.Key([]byte(masterKey), []byte("freelancer-wallet-salt"), 4096, 32, sha256.New)
	
	encryptedBytes, err := hex.DecodeString(encryptedHex)
	if err != nil {
		return "", fmt.Errorf("invalid encrypted hex: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(encryptedBytes) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := encryptedBytes[:nonceSize], encryptedBytes[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	return hex.EncodeToString(plaintext), nil
}

// ValidateAddress checks if an Ethereum address is valid
// Uses Ethereum library for proper validation
func ValidateAddress(address string) bool {
	return common.IsHexAddress(address)
}
