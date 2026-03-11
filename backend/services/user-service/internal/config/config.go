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
	Auth     AuthConfig
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
	SSLMode  string // sslmode for PostgreSQL (disable, require, verify-full, etc.)
}

// AuthConfig holds auth service configuration for gRPC (future)
type AuthConfig struct {
	Host string
	Port string
}

// Load reads configuration from environment variables with defaults
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Host:         getEnv("SERVER_HOST", "0.0.0.0"),
			Port:         getEnv("SERVER_PORT", "8081"),
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
			DBName:   getEnv("DB_NAME", "defellix"), // Same database as auth-service
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Auth: AuthConfig{
			Host: getEnv("AUTH_SERVICE_HOST", "localhost"),
			Port: getEnv("AUTH_SERVICE_PORT", "50051"),
		},
	}
}

// getEnv retrieves an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt retrieves an environment variable as integer or returns a default value
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
