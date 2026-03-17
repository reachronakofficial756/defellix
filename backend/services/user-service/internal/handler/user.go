package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/saiyam0211/defellix/services/user-service/internal/dto"
	"github.com/saiyam0211/defellix/services/user-service/internal/middleware"
	"github.com/saiyam0211/defellix/services/user-service/internal/repository"
	"github.com/saiyam0211/defellix/services/user-service/internal/service"
)

// UserHandler handles user profile-related endpoints
type UserHandler struct {
	validator     *middleware.Validator
	userService   *service.UserService
	profileService *service.ProfileService
}

// NewUserHandler creates a new user handler
func NewUserHandler(userService *service.UserService, profileService *service.ProfileService) *UserHandler {
	return &UserHandler{
		validator:      middleware.NewValidator(),
		userService:   userService,
		profileService: profileService,
	}
}

// RegisterRoutes registers user profile routes
func (h *UserHandler) RegisterRoutes(r chi.Router) {
	// Public profile by user_name: ourdomain.com/user_name
	r.Route("/api/v1/public/profile", func(r chi.Router) {
		r.Get("/{user_name}", h.GetPublicProfile)
	})

	r.Route("/api/v1/users", func(r chi.Router) {
		// Public routes
		r.Get("/{id}", h.GetProfile)
		r.Post("/search", h.SearchProfiles)

		// Protected routes
		r.With(middleware.RequireAuth).Group(func(r chi.Router) {
			r.Post("/me/profile", h.CreateProfile)
			r.Get("/me", h.GetMyProfile)
			r.Put("/me", h.UpdateMyProfile)
			r.Post("/me/skills", h.AddSkill)
			r.Delete("/me/skills", h.RemoveSkill)
			r.Post("/me/projects", h.AddProject)
			r.Put("/me/projects/{projectId}", h.UpdateProject)
			r.Delete("/me/projects/{projectId}", h.DeleteProject)
			r.Post("/me/portfolio", h.AddPortfolioItem)
			r.Put("/me/portfolio/{itemId}", h.UpdatePortfolioItem)
			r.Delete("/me/portfolio/{itemId}", h.DeletePortfolioItem)
		})
	})
}

// GetPublicProfile returns the public profile by user_name (ourdomain.com/user_name). No auth required.
func (h *UserHandler) GetPublicProfile(w http.ResponseWriter, r *http.Request) {
	userName := chi.URLParam(r, "user_name")
	if userName == "" {
		respondError(w, http.StatusBadRequest, "user_name is required", "BAD_REQUEST")
		return
	}

	profile, err := h.userService.GetPublicProfileByUserName(r.Context(), userName)
	if err != nil {
		if errors.Is(err, service.ErrProfileNotFound) {
			respondError(w, http.StatusNotFound, "Profile not found", "PROFILE_NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to get profile", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, profile, "OK")
}

// GetProfile retrieves a user profile by ID
func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	profile, err := h.userService.GetProfile(r.Context(), id)
	if err != nil {
		if err.Error() == "user not found" {
			respondError(w, http.StatusNotFound, "User profile not found", "PROFILE_NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to retrieve profile", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, profile, "Profile retrieved successfully")
}

// GetMyProfile retrieves the current user's profile. Returns 200 with profile or with
// profile: null when the user exists (authenticated) but has not created a profile yet,
// so the frontend can send existing users to the dashboard instead of signup.
func (h *UserHandler) GetMyProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)

	profile, err := h.userService.GetProfileByUserID(r.Context(), userID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			// User exists in auth but no profile row yet — return 200 so frontend redirects to /
			respondSuccess(w, http.StatusOK, map[string]interface{}{"profile": nil, "user_id": userID}, "Profile not created yet")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to retrieve profile", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, profile, "Profile retrieved successfully")
}

// UpdateMyProfile updates the current user's profile
func (h *UserHandler) UpdateMyProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	userEmail := r.Context().Value("user_email").(string)

	var req dto.UpdateProfileRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	// If userID is 0, this is a pending OAuth user completing Step 2
	// Call auth-service to complete OAuth registration first
	if userID == 0 {
		newUserID, err := h.userService.CompletePendingOAuthUser(r.Context(), userEmail)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Failed to complete OAuth registration: "+err.Error(), "OAUTH_COMPLETION_FAILED")
			return
		}
		userID = newUserID
	}

	profile, err := h.userService.UpdateProfile(r.Context(), userID, &req)
	if err != nil {
		if errors.Is(err, repository.ErrUserNameTaken) {
			respondError(w, http.StatusConflict, "user_name already taken", "USER_NAME_TAKEN")
			return
		}
		if errors.Is(err, service.ErrInvalidUserName) {
			respondError(w, http.StatusBadRequest, err.Error(), "INVALID_USER_NAME")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to update profile", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, profile, "Profile updated successfully")
}

// SearchProfiles searches for user profiles
func (h *UserHandler) SearchProfiles(w http.ResponseWriter, r *http.Request) {
	var req dto.SearchRequest

	// Parse query parameters
	if query := r.URL.Query().Get("query"); query != "" {
		req.Query = query
	}
	if role := r.URL.Query().Get("role"); role != "" {
		req.Role = role
	}
	if location := r.URL.Query().Get("location"); location != "" {
		req.Location = location
	}
	if availability := r.URL.Query().Get("availability"); availability != "" {
		req.Availability = availability
	}
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil {
			req.Page = page
		}
	}
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			req.Limit = limit
		}
	}

	// Parse JSON body if present (for complex queries)
	if r.ContentLength > 0 && r.Header.Get("Content-Type") == "application/json" {
		if err := h.validator.ValidateJSON(r, &req); err != nil {
			// If JSON parsing fails, continue with query params only
		}
	}

	results, err := h.userService.SearchProfiles(r.Context(), &req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to search profiles", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, results, "Search completed successfully")
}

// AddSkill adds a skill to the current user's profile
func (h *UserHandler) AddSkill(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)

	var req dto.AddSkillRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	if err := h.userService.AddSkill(r.Context(), userID, req.Skill); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to add skill", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, map[string]string{"message": "Skill added successfully"}, "Skill added")
}

// RemoveSkill removes a skill from the current user's profile
func (h *UserHandler) RemoveSkill(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)

	var req dto.RemoveSkillRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	if err := h.userService.RemoveSkill(r.Context(), userID, req.Skill); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to remove skill", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, map[string]string{"message": "Skill removed successfully"}, "Skill removed")
}

// AddPortfolioItem adds a portfolio item to the current user's profile
func (h *UserHandler) AddPortfolioItem(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)

	var req dto.AddPortfolioRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	item, err := h.userService.AddPortfolioItem(r.Context(), userID, &req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to add portfolio item", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusCreated, item, "Portfolio item added successfully")
}

// UpdatePortfolioItem updates a portfolio item
func (h *UserHandler) UpdatePortfolioItem(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	itemID := chi.URLParam(r, "itemId")

	var req dto.UpdatePortfolioRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	item, err := h.userService.UpdatePortfolioItem(r.Context(), userID, itemID, &req)
	if err != nil {
		if err.Error() == "profile not found" {
			respondError(w, http.StatusNotFound, "Portfolio item not found", "ITEM_NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to update portfolio item", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, item, "Portfolio item updated successfully")
}

// DeletePortfolioItem deletes a portfolio item
func (h *UserHandler) DeletePortfolioItem(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	itemID := chi.URLParam(r, "itemId")

	if err := h.userService.DeletePortfolioItem(r.Context(), userID, itemID); err != nil {
		if err.Error() == "user not found" {
			respondError(w, http.StatusNotFound, "Portfolio item not found", "ITEM_NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to delete portfolio item", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, map[string]string{"message": "Portfolio item deleted successfully"}, "Portfolio item deleted")
}

// CreateProfile creates a new freelancer profile (called after registration)
func (h *UserHandler) CreateProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	userEmail := r.Context().Value("user_email").(string)

	var req dto.CreateProfileRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	profile, err := h.profileService.CreateProfile(r.Context(), userID, userEmail, &req)
	if err != nil {
		if errors.Is(err, service.ErrProfileExists) {
			respondError(w, http.StatusConflict, "Profile already exists", "PROFILE_EXISTS")
			return
		}
		if errors.Is(err, repository.ErrUserNameTaken) {
			respondError(w, http.StatusConflict, "This username is already taken", "USER_NAME_TAKEN")
			return
		}
		if errors.Is(err, service.ErrInvalidUserName) {
			respondError(w, http.StatusBadRequest, err.Error(), "INVALID_USER_NAME")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to create profile", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusCreated, profile, "Profile created successfully")
}

// AddProject adds a project to user profile
func (h *UserHandler) AddProject(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)

	var req dto.AddProjectRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	project, err := h.profileService.AddProject(r.Context(), userID, &req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to add project", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusCreated, project, "Project added successfully")
}

// UpdateProject updates a project
func (h *UserHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	projectID := chi.URLParam(r, "projectId")

	var req dto.UpdateProjectRequest
	if err := h.validator.ValidateJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, err.Error(), "VALIDATION_ERROR")
		return
	}

	project, err := h.profileService.UpdateProject(r.Context(), userID, projectID, &req)
	if err != nil {
		if err.Error() == "project not found" {
			respondError(w, http.StatusNotFound, "Project not found", "PROJECT_NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to update project", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, project, "Project updated successfully")
}

// DeleteProject deletes a project
func (h *UserHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(uint)
	projectID := chi.URLParam(r, "projectId")

	if err := h.profileService.DeleteProject(r.Context(), userID, projectID); err != nil {
		if err.Error() == "project not found" {
			respondError(w, http.StatusNotFound, "Project not found", "PROJECT_NOT_FOUND")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to delete project", "INTERNAL_ERROR")
		return
	}

	respondSuccess(w, http.StatusOK, map[string]string{"message": "Project deleted successfully"}, "Project deleted")
}

