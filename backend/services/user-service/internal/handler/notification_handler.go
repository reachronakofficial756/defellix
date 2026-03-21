package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/saiyam0211/defellix/services/user-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/user-service/internal/repository"
)

// NotificationHandler handles score notification endpoints
type NotificationHandler struct {
	notifRepo repository.NotificationRepository
}

// NewNotificationHandler creates a new notification handler
func NewNotificationHandler(notifRepo repository.NotificationRepository) *NotificationHandler {
	return &NotificationHandler{notifRepo: notifRepo}
}

// RegisterRoutes registers notification routes
func (h *NotificationHandler) RegisterRoutes(r chi.Router) {
	r.Route("/api/v1/users/me/notifications", func(r chi.Router) {
		r.Use(middleware.RequireAuth)
		r.Get("/", h.GetNotifications)
		r.Get("/unread-count", h.GetUnreadCount)
		r.Put("/{id}/read", h.MarkAsRead)
	})
}

// GetNotifications returns all notifications for the authenticated user
func (h *NotificationHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		respondError(w, http.StatusUnauthorized, "User not authenticated", "UNAUTHORIZED")
		return
	}

	notifications, err := h.notifRepo.GetByUserID(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch notifications", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, notifications, "Notifications retrieved successfully")
}

// GetUnreadCount returns the count of unread notifications
func (h *NotificationHandler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		respondError(w, http.StatusUnauthorized, "User not authenticated", "UNAUTHORIZED")
		return
	}

	count, err := h.notifRepo.GetUnreadCount(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch unread count", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, map[string]int64{"unread_count": count}, "Unread count retrieved")
}

// MarkAsRead marks a notification as read
func (h *NotificationHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		respondError(w, http.StatusUnauthorized, "User not authenticated", "UNAUTHORIZED")
		return
	}

	idStr := chi.URLParam(r, "id")
	notifID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid notification ID", "VALIDATION_ERROR")
		return
	}

	if err := h.notifRepo.MarkAsRead(r.Context(), uint(notifID), userID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to mark as read", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, nil, "Notification marked as read")
}
