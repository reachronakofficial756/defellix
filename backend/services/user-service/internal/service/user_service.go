package service

import (
	"context"
	"errors"
	"math"
	"strings"

	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/saiyam0211/defellix/services/user-service/internal/domain"
	"github.com/saiyam0211/defellix/services/user-service/internal/dto"
	"github.com/saiyam0211/defellix/services/user-service/internal/repository"
)

var (
	// ErrProfileNotFound indicates profile was not found
	ErrProfileNotFound = errors.New("profile not found")
	// ErrUnauthorized indicates user is not authorized
	ErrUnauthorized = errors.New("unauthorized")
	// ErrInvalidUserName indicates user_name has invalid format (use only a-z, 0-9, underscore)
	ErrInvalidUserName = errors.New("user_name must be 3–30 characters, lowercase letters, numbers and underscores only")
)

// normaliseUserName returns lowercase user_name containing only [a-z0-9_], or error if invalid
func normaliseUserName(s string) (string, error) {
	s = strings.ToLower(strings.TrimSpace(s))
	if s == "" {
		return "", nil
	}
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '_' {
			b.WriteRune(r)
		}
	}
	out := b.String()
	if len(out) < 3 || len(out) > 30 {
		return "", ErrInvalidUserName
	}
	return out, nil
}

// UserService handles user profile business logic
type UserService struct {
	userRepo repository.UserRepository
}

// NewUserService creates a new user service
func NewUserService(userRepo repository.UserRepository) *UserService {
	return &UserService{
		userRepo: userRepo,
	}
}

// GetProfile retrieves a user profile by ID
func (s *UserService) GetProfile(ctx context.Context, id string) (*dto.UserResponse, error) {
	profileID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		return nil, ErrProfileNotFound
	}
	profile, err := s.userRepo.FindByID(ctx, uint(profileID))
	if err != nil {
		return nil, err
	}
	return s.toProfileResponse(profile), nil
}

// GetProfileByUserID retrieves a user profile by user ID
func (s *UserService) GetProfileByUserID(ctx context.Context, userID uint) (*dto.UserResponse, error) {
	profile, err := s.userRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.toProfileResponse(profile), nil
}

// GetPublicProfileByUserName returns the public profile for ourdomain.com/user_name.
// Only includes sections allowed by visibility; never returns email or phone.
func (s *UserService) GetPublicProfileByUserName(ctx context.Context, userName string) (*dto.PublicProfileResponse, error) {
	userName = strings.ToLower(strings.TrimSpace(userName))
	if userName == "" {
		return nil, ErrProfileNotFound
	}
	profile, err := s.userRepo.FindByUserName(ctx, userName)
	if err != nil {
		return nil, err
	}
	if !profile.IsActive {
		return nil, ErrProfileNotFound
	}
	return s.toPublicProfileResponse(profile), nil
}

// UpdateProfile updates a user profile
func (s *UserService) UpdateProfile(ctx context.Context, userID uint, req *dto.UpdateProfileRequest) (*dto.UserResponse, error) {
	// Get existing profile
	profile, err := s.userRepo.FindByUserID(ctx, userID)
	if err != nil {
		// If profile doesn't exist, create a new one
		if err == repository.ErrUserNotFound {
			profile = &domain.User{
				ID: userID,
				Role:   domain.RoleFreelancer, // Default role
			}
		} else {
			return nil, err
		}
	}

	// Update fields

	if req.Bio != "" {
		profile.Bio = req.Bio
	}
	if req.Photo != "" {
		profile.Photo = req.Photo
	}
	if req.ShortHeadline != "" {
		profile.ShortHeadline = req.ShortHeadline
	}
	if req.Experience != "" {
		profile.Experience = req.Experience
	}
	if req.GitHubLink != "" {
		profile.GitHubLink = req.GitHubLink
	}
	if req.LinkedInLink != "" {
		profile.LinkedInLink = req.LinkedInLink
	}
	if req.PortfolioLink != "" {
		profile.PortfolioLink = req.PortfolioLink
	}
	if req.InstagramLink != "" {
		profile.InstagramLink = req.InstagramLink
	}
	if req.Location != "" {
		profile.Location = req.Location
	}
	if req.Timezone != "" {
		profile.Timezone = req.Timezone
	}
	if req.CompanyName != "" {
		profile.CompanyName = req.CompanyName
	}

	if req.ShowProfile != nil {
		profile.ShowProfile = *req.ShowProfile
	}
	if req.ShowProjects != nil {
		profile.ShowProjects = *req.ShowProjects
	}
	if req.ShowContracts != nil {
		profile.ShowContracts = *req.ShowContracts
	}

	// Save profile
	if profile.ID == 0 {
		err = s.userRepo.Create(ctx, profile)
	} else {
		err = s.userRepo.Update(ctx, profile)
	}
	if err != nil {
		return nil, err
	}

	return s.toProfileResponse(profile), nil
}

// SearchProfiles searches for user profiles
func (s *UserService) SearchProfiles(ctx context.Context, req *dto.SearchRequest) (*dto.SearchResponse, error) {
	// Build filter
	filter := map[string]interface{}{
		"is_active": true,
	}

	// Role filter
	if req.Role != "" {
		filter["role"] = req.Role
	}

	// Skills filter
	if len(req.Skills) > 0 {
		filter["skills"] = req.Skills
	}

	// Hourly rate filter
	if req.MinRate != nil {
		filter["min_rate"] = *req.MinRate
	}
	if req.MaxRate != nil {
		filter["max_rate"] = *req.MaxRate
	}

	// Location filter
	if req.Location != "" {
		filter["location"] = req.Location
	}

	// Availability filter
	// Removed availability filter

	// Text search
	if req.Query != "" {
		filter["query"] = req.Query
	}

	// Pagination
	page := int64(1)
	if req.Page > 0 {
		page = int64(req.Page)
	}
	limit := int64(20)
	if req.Limit > 0 && req.Limit <= 100 {
		limit = int64(req.Limit)
	}

	// Search
	profiles, total, err := s.userRepo.Search(ctx, filter, page, limit)
	if err != nil {
		return nil, err
	}

	// Convert to response
	profileResponses := make([]dto.UserResponse, len(profiles))
	for i, p := range profiles {
		profileResponses[i] = *s.toProfileResponse(p)
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return &dto.SearchResponse{
		Users:      profileResponses,
		Total:      total,
		Page:       int(page),
		Limit:      int(limit),
		TotalPages: totalPages,
	}, nil
}

// AddSkill adds a skill to user profile
func (s *UserService) AddSkill(ctx context.Context, userID uint, skill string) error {
	skill = strings.TrimSpace(skill)
	if skill == "" {
		return errors.New("skill cannot be empty")
	}
	return s.userRepo.AddSkill(ctx, userID, skill)
}

// RemoveSkill removes a skill from user profile
func (s *UserService) RemoveSkill(ctx context.Context, userID uint, skill string) error {
	return s.userRepo.RemoveSkill(ctx, userID, skill)
}

// AddPortfolioItem adds a portfolio item to user profile (legacy - use projects instead)
func (s *UserService) AddPortfolioItem(ctx context.Context, userID uint, req *dto.AddPortfolioRequest) (*dto.PortfolioItem, error) {
	profile, err := s.userRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Parse existing portfolio
	var portfolio []domain.PortfolioItem
	if len(profile.Portfolio) > 0 {
		if err := json.Unmarshal(profile.Portfolio, &portfolio); err != nil {
			return nil, err
		}
	}

	// Create new item
	item := &domain.PortfolioItem{
		ID:           uuid.New().String(),
		Title:        req.Title,
		Description:  req.Description,
		URL:          req.URL,
		ImageURL:     req.ImageURL,
		Technologies: req.Technologies,
		CreatedAt:    time.Now().Format(time.RFC3339),
	}

	// Add to portfolio
	portfolio = append(portfolio, *item)
	portfolioJSON, err := json.Marshal(portfolio)
	if err != nil {
		return nil, err
	}

	profile.Portfolio = portfolioJSON
	profile.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, profile); err != nil {
		return nil, err
	}

	return s.toPortfolioItemResponse(item), nil
}

// UpdatePortfolioItem updates a portfolio item (legacy)
func (s *UserService) UpdatePortfolioItem(ctx context.Context, userID uint, itemID string, req *dto.UpdatePortfolioRequest) (*dto.PortfolioItem, error) {
	item, err := s.userRepo.UpdatePortfolioItem(ctx, userID, itemID, &domain.PortfolioItem{
		ID:           itemID,
		Title:        req.Title,
		Description:  req.Description,
		URL:          req.URL,
		ImageURL:     req.ImageURL,
		Technologies: req.Technologies,
	})
	if err != nil {
		return nil, err
	}
	return s.toPortfolioItemResponse(item), nil
}

// DeletePortfolioItem deletes a portfolio item
func (s *UserService) DeletePortfolioItem(ctx context.Context, userID uint, itemID string) error {
	return s.userRepo.DeletePortfolioItem(ctx, userID, itemID)
}

// Helper methods
func (s *UserService) toProfileResponse(profile *domain.User) *dto.UserResponse {
	// Parse skills from JSONB
	var skills []string
	if len(profile.Skills) > 0 {
		json.Unmarshal(profile.Skills, &skills)
	}

	// Parse portfolio items (legacy) from JSONB
	var portfolioItems []dto.PortfolioItem
	if len(profile.Portfolio) > 0 {
		var portfolio []domain.PortfolioItem
		if err := json.Unmarshal(profile.Portfolio, &portfolio); err == nil {
			portfolioItems = make([]dto.PortfolioItem, len(portfolio))
			for i, item := range portfolio {
				portfolioItems[i] = *s.toPortfolioItemResponse(&item)
			}
		}
	}

	// Parse projects from JSONB
	var projects []dto.ProjectResponse
	if len(profile.Projects) > 0 {
		var projs []domain.Project
		if err := json.Unmarshal(profile.Projects, &projs); err == nil {
			projects = make([]dto.ProjectResponse, len(projs))
			for i, project := range projs {
				projects[i] = s.toProjectResponse(&project)
			}
		}
	}

	// Parse testimonials from JSONB
	var testimonials []dto.TestimonialResponse
	if len(profile.Testimonials) > 0 {
		var testis []domain.Testimonial
		if err := json.Unmarshal(profile.Testimonials, &testis); err == nil {
			testimonials = make([]dto.TestimonialResponse, len(testis))
			for i, testimonial := range testis {
				testimonials[i] = s.toTestimonialResponse(&testimonial)
			}
		}
	}

	// Parse stats from JSONB
	var noOfProjectsDone int
	var onTimeCompletion, reputationScore float64
	if len(profile.Stats) > 0 {
		var stats map[string]interface{}
		if err := json.Unmarshal(profile.Stats, &stats); err == nil {
			if val, ok := stats["no_of_projects_done"].(float64); ok {
				noOfProjectsDone = int(val)
			}
			if val, ok := stats["on_time_completion"].(float64); ok {
				onTimeCompletion = val
			}
			if val, ok := stats["reputation_score"].(float64); ok {
				reputationScore = val
			}
		}
	}

	return &dto.UserResponse{
		ID:                fmt.Sprintf("%d", profile.ID),
		Email:             profile.Email,
		UserName:          profile.UserName,
		FullName:          profile.FullName,
		Photo:             profile.Photo,
		ShortHeadline:     profile.ShortHeadline,
		Role:              profile.Role,
		Bio:               profile.Bio,
		Location:          profile.Location,
		Experience:        profile.Experience,
		Timezone:          profile.Timezone,
		Phone:             profile.Phone,
		GitHubLink:        profile.GitHubLink,
		LinkedInLink:      profile.LinkedInLink,
		PortfolioLink:     profile.PortfolioLink,
		InstagramLink:     profile.InstagramLink,
		Skills:            skills,
		Portfolio:         portfolioItems,
		Projects:         projects,
		NoOfProjectsDone: noOfProjectsDone,
		OnTimeCompletion: onTimeCompletion,
		ReputationScore:   reputationScore,
		Testimonials:      testimonials,
		CompanyName:       profile.CompanyName,
		ShowProfile:       profile.ShowProfile,
		ShowProjects:      profile.ShowProjects,
		ShowContracts:     profile.ShowContracts,
		IsActive:          profile.IsActive,
		IsVerified:        profile.IsVerified,
		IsProfileComplete: profile.IsProfileComplete,
		CreatedAt:         profile.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:         profile.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func (s *UserService) toPublicProfileResponse(profile *domain.User) *dto.PublicProfileResponse {
	out := &dto.PublicProfileResponse{
		UserName:                 profile.UserName,
		AggregateReputationScore: profile.AggregateReputationScore,
	}
	if profile.ShowProfile {
		out.FullName = profile.FullName
		out.Photo = profile.Photo
		out.ShortHeadline = profile.ShortHeadline
		out.Role = profile.Role
		out.Bio = profile.Bio
		out.Location = profile.Location
		out.Experience = profile.Experience
		out.GitHubLink = profile.GitHubLink
		out.LinkedInLink = profile.LinkedInLink
		out.PortfolioLink = profile.PortfolioLink
		out.InstagramLink = profile.InstagramLink
		var skills []string
		if len(profile.Skills) > 0 {
			_ = json.Unmarshal(profile.Skills, &skills)
		}
		out.Skills = skills
	}
	if profile.ShowProjects && len(profile.Projects) > 0 {
		var projs []domain.Project
		if err := json.Unmarshal(profile.Projects, &projs); err == nil {
			out.Projects = make([]dto.ProjectResponse, len(projs))
			for i := range projs {
				out.Projects[i] = s.toProjectResponse(&projs[i])
			}
		}
	}
	return out
}

func (s *UserService) toProjectResponse(project *domain.Project) dto.ProjectResponse {
	otherLinks := make([]dto.ProjectLink, len(project.OtherLinks))
	for i, link := range project.OtherLinks {
		otherLinks[i] = dto.ProjectLink{
			Label: link.Label,
			URL:   link.URL,
		}
	}

	return dto.ProjectResponse{
		ID:            project.ID,
		ProjectName:   project.ProjectName,
		Description:   project.Description,
		Screenshots:   project.Screenshots,
		GitHubLink:    project.GitHubLink,
		LiveLink:      project.LiveLink,
		DriveLink:     project.DriveLink,
		VideoLink:     project.VideoLink,
		OtherLinks:    otherLinks,
		Technologies:  project.Technologies,
		ClientName:    project.ClientName,
		CompletedDate: project.CompletedDate,
		CreatedAt:     project.CreatedAt,
		UpdatedAt:     project.UpdatedAt,
	}
}

func (s *UserService) toTestimonialResponse(testimonial *domain.Testimonial) dto.TestimonialResponse {
	return dto.TestimonialResponse{
		ID:          testimonial.ID,
		ClientName:  testimonial.ClientName,
		Rating:      testimonial.Rating,
		Comment:     testimonial.Comment,
		ProjectName: testimonial.ProjectName,
		IsVerified:  testimonial.IsVerified,
		CreatedAt:   testimonial.CreatedAt,
	}
}

func (s *UserService) toPortfolioItemResponse(item *domain.PortfolioItem) *dto.PortfolioItem {
	return &dto.PortfolioItem{
		ID:           item.ID,
		Title:        item.Title,
		Description:  item.Description,
		URL:          item.URL,
		ImageURL:     item.ImageURL,
		Technologies: item.Technologies,
		CreatedAt:    item.CreatedAt,
	}
}

