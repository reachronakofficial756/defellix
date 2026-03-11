package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"github.com/saiyam0211/defellix/services/auth-service/internal/config"
	"github.com/saiyam0211/defellix/services/auth-service/internal/domain"
	"github.com/saiyam0211/defellix/services/auth-service/internal/handler"
	appmw "github.com/saiyam0211/defellix/services/auth-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/auth-service/internal/repository"
	"github.com/saiyam0211/defellix/services/auth-service/internal/service"
	"github.com/saiyam0211/defellix/services/auth-service/pkg/jwt"
)

func main() {
	// Load environment variables
	godotenv.Load()

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := config.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := config.AutoMigrate(db, &domain.User{}, &domain.OAuthProvider{}); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Database migrations completed")

	// Initialize JWT manager
	jwtManager := jwt.NewJWTManager(
		cfg.JWT.SecretKey,
		time.Duration(cfg.JWT.AccessTokenTTL)*time.Hour,
		time.Duration(cfg.JWT.RefreshTokenTTL)*24*time.Hour,
	)

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	oauthRepo := repository.NewOAuthRepository(db)

	// Initialize services
	authService := service.NewAuthService(userRepo, jwtManager)

	// Initialize OAuth service
	encryptionKey := os.Getenv("OAUTH_ENCRYPTION_KEY")
	if encryptionKey == "" {
		encryptionKey = cfg.JWT.SecretKey // Fallback to JWT secret
	}
	oauthService := service.NewOAuthService(userRepo, oauthRepo, jwtManager, authService, cfg.OAuth, encryptionKey)

	// Create router
	r := chi.NewRouter()

	// Apply global middleware
	setupMiddleware(r)

	// Setup routes
	setupRoutes(r, authService, oauthService, jwtManager)

	// Create HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		Handler:      r,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Auth Service starting on %s:%s", cfg.Server.Host, cfg.Server.Port)
		log.Printf("Environment: %s", cfg.App.Environment)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited gracefully")
}

// setupMiddleware configures global middleware
func setupMiddleware(r *chi.Mux) {
	// Request ID middleware
	r.Use(chimw.RequestID)

	// Real IP middleware
	r.Use(chimw.RealIP)

	// Logger middleware
	r.Use(appmw.Logger)

	// Recoverer middleware
	r.Use(appmw.Recoverer)

	// CORS middleware
	r.Use(appmw.CORS)

	// Request timeout middleware
	r.Use(chimw.Timeout(60 * time.Second))
}

// setupRoutes configures all application routes
func setupRoutes(r *chi.Mux, authService *service.AuthService, oauthService *service.OAuthService, jwtManager *jwt.JWTManager) {
	// Health check handler
	healthHandler := handler.NewHealthHandler()
	healthHandler.RegisterRoutes(r)

	// Auth handler
	authHandler := handler.NewAuthHandler(authService, oauthService)
	authHandler.RegisterRoutes(r, jwtManager)
}
