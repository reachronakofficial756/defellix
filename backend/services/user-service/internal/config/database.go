package config

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDB initializes and returns a PostgreSQL database connection
func InitDB(cfg *Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		cfg.Database.Host,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.DBName,
		cfg.Database.Port,
		cfg.Database.SSLMode,
	)

	// Set log level based on environment
	logLevel := logger.Silent
	if cfg.App.Environment == "development" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // MUST be true for PgBouncer / Neon DB
	}), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return db, nil
}

// AutoMigrate runs database migrations for all domain models
func AutoMigrate(db *gorm.DB, models ...interface{}) error {
	// Drop the auto-generated unique index if it exists, so our partial index takes precedence
	db.Exec("DROP INDEX IF EXISTS idx_users_user_name CASCADE")
	
	if err := db.AutoMigrate(models...); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}
	return nil
}

// CreateIndexes creates additional indexes for performance
func CreateIndexes(db *gorm.DB) error {
	// Text search index (using GIN index for JSONB)
	if err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_users_skills_gin 
		ON users USING GIN (skills);
	`).Error; err != nil {
		return fmt.Errorf("failed to create skills index: %w", err)
	}

	if err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_users_projects_gin 
		ON users USING GIN (projects);
	`).Error; err != nil {
		return fmt.Errorf("failed to create projects index: %w", err)
	}

	// Full-text search index
	if err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_users_fulltext 
		ON users USING GIN (
			to_tsvector('english', 
				COALESCE(full_name, '') || ' ' || 
				COALESCE(short_headline, '') || ' ' || 
				COALESCE(bio, '')
			)
		);
	`).Error; err != nil {
		return fmt.Errorf("failed to create fulltext index: %w", err)
	}

	// user_name unique when non-empty (allows many profiles with no public URL yet)
	if err := db.Exec(`
		CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_name_unique 
		ON users (user_name) WHERE user_name != '' AND user_name IS NOT NULL;
	`).Error; err != nil {
		return fmt.Errorf("failed to create user_name unique index: %w", err)
	}

	return nil
}
