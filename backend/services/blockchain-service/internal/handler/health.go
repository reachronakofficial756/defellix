package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) RegisterRoutes(r chi.Router) {
	r.Get("/health", h.Health)
	r.Get("/health/live", h.Liveness)
	r.Get("/health/ready", h.Readiness)
}

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"service":   "blockchain-service",
		"version":   "1.0.0",
	})
}

func (h *HealthHandler) Liveness(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "alive",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"service":   "blockchain-service",
		"version":   "1.0.0",
	})
}

func (h *HealthHandler) Readiness(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "ready",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"service":   "blockchain-service",
		"version":   "1.0.0",
	})
}
