package config

import (
	"os"
	"strconv"
)

// Config holds all configuration for the application
type Config struct {
	Server    ServerConfig
	App       AppConfig
	Database  DatabaseConfig
	JWT       JWTConfig
	ServiceAuth ServiceAuthConfig
	Blockchain BlockchainConfig
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Host         string
	Port         string
	ReadTimeout  int
	WriteTimeout int
	IdleTimeout  int
}

// AppConfig holds application-level configuration
type AppConfig struct {
	Environment string
	LogLevel    string
}

// DatabaseConfig holds PostgreSQL configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// JWTConfig holds JWT validation config (same secret as auth-service)
type JWTConfig struct {
	Secret string
}

// ServiceAuthConfig holds service-to-service auth (API key)
type ServiceAuthConfig struct {
	APIKey string // API key for service-to-service calls (e.g. from contract-service)
}

// BlockchainConfig holds Base L2 blockchain configuration
type BlockchainConfig struct {
	RPCURL        string // Base L2 RPC endpoint (testnet or mainnet)
	ChainID       int64  // Base Sepolia: 84532, Base Mainnet: 8453
	EncryptionKey   string // Master key for encrypting wallet private keys (32 bytes)
	ContractAddress string // Optional: deployed contract address if using smart contract
	MasterPrivateKey string // Platform's master wallet for abstracting gas fees
}

// Load reads configuration from environment variables with defaults
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Host:         getEnv("SERVER_HOST", "0.0.0.0"),
			Port:         getEnv("SERVER_PORT", "8083"),
			ReadTimeout:  getEnvAsInt("SERVER_READ_TIMEOUT", 15),
			WriteTimeout: getEnvAsInt("SERVER_WRITE_TIMEOUT", 15),
			IdleTimeout:  getEnvAsInt("SERVER_IDLE_TIMEOUT", 60),
		},
		App: AppConfig{
			Environment: getEnv("APP_ENV", "development"),
			LogLevel:    getEnv("LOG_LEVEL", "info"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "freelancer"),
			Password: getEnv("DB_PASSWORD", "secret"),
			DBName:   getEnv("DB_NAME", "defellix"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", ""),
		},
		ServiceAuth: ServiceAuthConfig{
			APIKey: getEnv("SERVICE_API_KEY", ""),
		},
		Blockchain: BlockchainConfig{
			RPCURL:         getEnv("BASE_L2_RPC_URL", "https://sepolia.base.org"),
			ChainID:        getEnvAsInt64("BASE_L2_CHAIN_ID", 84532),
			EncryptionKey:  getEnv("WALLET_ENCRYPTION_KEY", ""),
			ContractAddress: getEnv("CONTRACT_ADDRESS", ""),
			MasterPrivateKey: getEnv("MASTER_WALLET_PRIVATE_KEY", ""),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return defaultValue
}

func getEnvAsInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.ParseInt(value, 10, 64); err == nil {
			return i
		}
	}
	return defaultValue
}
