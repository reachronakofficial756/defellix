package config

import (
	"os"
	"strconv"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	App      AppConfig
	Database DatabaseConfig
	JWT      JWTConfig
	SMTP     SMTPConfig
}

// SMTPConfig holds email sending credentials
type SMTPConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	FromName string
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
	Environment               string
	LogLevel                  string
	ShareableLinkBaseURL      string // Base for contract links, e.g. https://app.ourdomain.com/contract
	DraftExpiryDays           int    // Delete drafts older than this (default 14)
	DraftCleanupIntervalMins  int    // Run draft-cleanup job every N minutes (default 360 = 6h)
	BlockchainServiceURL      string // Base URL for blockchain-service (e.g. http://localhost:8083)
	BlockchainServiceAPIKey   string // Optional: API key for service-to-service auth (if blockchain-service requires it)
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

// Load reads configuration from environment variables with defaults
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Host:         getEnv("SERVER_HOST", "0.0.0.0"),
			Port:         getEnv("SERVER_PORT", "8082"),
			ReadTimeout:  getEnvAsInt("SERVER_READ_TIMEOUT", 15),
			WriteTimeout: getEnvAsInt("SERVER_WRITE_TIMEOUT", 15),
			IdleTimeout:  getEnvAsInt("SERVER_IDLE_TIMEOUT", 60),
		},
		App: AppConfig{
			Environment:              getEnv("APP_ENV", "development"),
			LogLevel:                 getEnv("LOG_LEVEL", "info"),
			ShareableLinkBaseURL:     getEnv("SHAREABLE_LINK_BASE_URL", ""),
			DraftExpiryDays:           getEnvAsInt("DRAFT_EXPIRY_DAYS", 14),
			DraftCleanupIntervalMins: getEnvAsInt("DRAFT_CLEANUP_INTERVAL_MINS", 360),
			BlockchainServiceURL:     getEnv("BLOCKCHAIN_SERVICE_URL", ""),
			BlockchainServiceAPIKey:  getEnv("BLOCKCHAIN_SERVICE_API_KEY", ""),
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
		SMTP: SMTPConfig{
			Host:     getEnv("SMTP_HOST", "smtp.gmail.com"),
			Port:     getEnv("SMTP_PORT", "587"),
			User:     getEnv("SMTP_USER", ""),
			Password: getEnv("SMTP_PASS", ""),
			FromName: getEnv("SMTP_FROM_NAME", "Defellix Contracts"),
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
