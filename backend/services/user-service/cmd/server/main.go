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
	"github.com/saiyam0211/defellix/services/user-service/internal/config"
	"github.com/saiyam0211/defellix/services/user-service/internal/domain"
	"github.com/saiyam0211/defellix/services/user-service/internal/handler"
	appmw "github.com/saiyam0211/defellix/services/user-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/user-service/internal/repository"
	"github.com/saiyam0211/defellix/services/user-service/internal/service"
)

func main() {
	// Load .env file
	godotenv.Load()

	// Load configuration
	cfg := config.Load()

	// Initialize PostgreSQL
	db, err := config.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := config.AutoMigrate(db, &domain.User{}, &domain.Reputation{}); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Create indexes for performance
	if err := config.CreateIndexes(db); err != nil {
		log.Printf("Warning: Failed to create indexes: %v", err)
	}

	log.Println("Database migrations and indexes completed")

	// Initialize repository
	userRepo := repository.NewUserRepository(db)
	repRepo := repository.NewReputationRepository(db)

	// Initialize services
	userService := service.NewUserService(userRepo)
	profileService := service.NewProfileService(userRepo)
	repService := service.NewReputationService(repRepo, userRepo)

	// Create router
	r := chi.NewRouter()

	// Apply global middleware
	setupMiddleware(r)

	// Setup routes
	setupRoutes(r, userService, profileService, repService)

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
		log.Printf("User Service starting on %s:%s", cfg.Server.Host, cfg.Server.Port)
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
func setupRoutes(r *chi.Mux, userService *service.UserService, profileService *service.ProfileService, repService *service.ReputationService) {
	// Health check handler
	healthHandler := handler.NewHealthHandler()
	healthHandler.RegisterRoutes(r)

	// User handler
	userHandler := handler.NewUserHandler(userService, profileService)
	userHandler.RegisterRoutes(r)

	// Reputation handler
	repHandler := handler.NewReputationHandler(repService)
	repHandler.RegisterRoutes(r)

	// Contract link handler (internal, called by contract-service)
	contractLinkHandler := handler.NewContractLinkHandler(profileService)
	contractLinkHandler.RegisterRoutes(r)
}
