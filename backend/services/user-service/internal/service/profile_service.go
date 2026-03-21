package service

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/saiyam0211/defellix/services/user-service/internal/domain"
	"github.com/saiyam0211/defellix/services/user-service/internal/dto"
	"github.com/saiyam0211/defellix/services/user-service/internal/repository"
	"gorm.io/datatypes"
)

var (
	// ErrProfileExists indicates profile already exists
	ErrProfileExists = errors.New("profile already exists")
)

// ProfileService handles profile creation and management
type ProfileService struct {
	userRepo repository.UserRepository
}

// NewProfileService creates a new profile service
func NewProfileService(userRepo repository.UserRepository) *ProfileService {
	return &ProfileService{
		userRepo: userRepo,
	}
}

// CreateProfile handles the initial profile setup for a freelancer
func (s *ProfileService) CreateProfile(ctx context.Context, userID uint, email string, req *dto.CreateProfileRequest) (*domain.User, error) {
	// Check if user exists (should exist from auth-service registration)
	user, err := s.userRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found from auth service")
	}

	// Prevent setting up multiple times
	if user.IsProfileComplete {
		return nil, ErrProfileExists
	}

	// Convert skills to JSON
	skillsJSON, err := json.Marshal(req.Skills)
	if err != nil {
		return nil, err
	}

	// user_name: normalise and enforce uniqueness
	userName := ""
	if req.UserName != "" {
		normalised, err := normaliseUserName(req.UserName)
		if err != nil {
			return nil, err
		}
		userName = normalised
		existing, _ := s.userRepo.FindByUserName(ctx, normalised)
		if existing != nil && existing.ID != userID {
			return nil, repository.ErrUserNameTaken
		}
	}

	// Update existing record
	user.Phone = req.Phone
	user.Photo = req.Photo
	user.ShortHeadline = req.ShortHeadline
	user.WhatDoYouDo = req.WhatDoYouDo
	user.Location = req.Location
	user.Experience = req.Experience
	user.CompanyName = req.CompanyName
	user.GitHubLink = req.GitHubLink
	user.LinkedInLink = req.LinkedInLink
	user.PortfolioLink = req.PortfolioLink
	user.InstagramLink = req.InstagramLink
	user.Skills = datatypes.JSON(skillsJSON)
	user.UserName = userName
	
	user.ShowProfile = true
	user.ShowProjects = true
	user.ShowContracts = false
	user.IsActive = true
	user.IsProfileComplete = s.checkProfileComplete(req)
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	// Calculate initial credibility score from profile signals
	profileSignals := ProfileSignals{
		HasPhoto:         user.Photo != "",
		HasBio:           user.Bio != "",
		HasSkills:        len(req.Skills) > 0,
		SkillCount:       len(req.Skills),
		HasGitHub:        user.GitHubLink != "",
		HasLinkedIn:      user.LinkedInLink != "",
		HasPortfolio:     user.PortfolioLink != "",
		HasInstagram:     user.InstagramLink != "",
		IsEmailVerified:  user.IsVerified,
		IsPhoneVerified:  user.Phone != "",
		HasProjects:      false,
		ProjectCount:     0,
		AccountAgeMonths: 0,
	}

	overallScore, dims := CalculateInitialScore(profileSignals)
	tier := GetTierLabel(overallScore)

	dimsJSON, _ := json.Marshal(dims)
	user.CredibilityScore = overallScore
	user.ScoreTier = tier
	user.DimensionScores = datatypes.JSON(dimsJSON)

	// Save updated score (non-blocking, don't fail if this errors)
	_ = s.userRepo.Update(ctx, user)

	return user, nil
}

// checkProfileComplete checks if all required fields are filled
func (s *ProfileService) checkProfileComplete(req *dto.CreateProfileRequest) bool {
	return req.UserName != "" &&
		req.Phone != "" &&
		req.ShortHeadline != "" &&
		req.WhatDoYouDo != "" &&
		len(req.Skills) > 0
}

// AddProject adds a project to user profile
func (s *ProfileService) AddProject(ctx context.Context, userID uint, req *dto.AddProjectRequest) (*domain.Project, error) {
	// Get existing profile
	profile, err := s.userRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Parse existing projects
	var projects []domain.Project
	if len(profile.Projects) > 0 {
		if err := json.Unmarshal(profile.Projects, &projects); err != nil {
			return nil, err
		}
	}

	// Create project
	project := &domain.Project{
		ID:            uuid.New().String(),
		ProjectName:   req.ProjectName,
		Description:   req.Description,
		Screenshots:   req.Screenshots,
		GitHubLink:    req.GitHubLink,
		LiveLink:      req.LiveLink,
		DriveLink:     req.DriveLink,
		VideoLink:     req.VideoLink,
		Technologies:  req.Technologies,
		ClientName:    req.ClientName,
		CompletedDate: time.Now().Format(time.RFC3339),
		CreatedAt:     time.Now().Format(time.RFC3339),
		UpdatedAt:     time.Now().Format(time.RFC3339),
	}

	// Convert other links
	if len(req.OtherLinks) > 0 {
		project.OtherLinks = make([]domain.ProjectLink, len(req.OtherLinks))
		for i, link := range req.OtherLinks {
			project.OtherLinks[i] = domain.ProjectLink{
				Label: link.Label,
				URL:   link.URL,
			}
		}
	}

	// Add to projects array
	projects = append(projects, *project)

	// Update stats
	var stats map[string]interface{}
	if len(profile.Stats) > 0 {
		if err := json.Unmarshal(profile.Stats, &stats); err != nil {
			stats = make(map[string]interface{})
		}
	} else {
		stats = make(map[string]interface{})
	}
	stats["no_of_projects_done"] = len(projects)
	statsJSON, _ := json.Marshal(stats)

	// Marshal projects to JSONB
	projectsJSON, err := json.Marshal(projects)
	if err != nil {
		return nil, err
	}

	// Update profile
	profile.Projects = projectsJSON
	profile.Stats = statsJSON
	profile.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, profile); err != nil {
		return nil, err
	}

	return project, nil
}

// UpdateProject updates a project
func (s *ProfileService) UpdateProject(ctx context.Context, userID uint, projectID string, req *dto.UpdateProjectRequest) (*domain.Project, error) {
	profile, err := s.userRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Parse existing projects
	var projects []domain.Project
	if len(profile.Projects) > 0 {
		if err := json.Unmarshal(profile.Projects, &projects); err != nil {
			return nil, err
		}
	}

	// Find and update project
	for i := range projects {
		if projects[i].ID == projectID {
			if req.ProjectName != "" {
				projects[i].ProjectName = req.ProjectName
			}
			if req.Description != "" {
				projects[i].Description = req.Description
			}
			if req.Screenshots != nil {
				projects[i].Screenshots = req.Screenshots
			}
			if req.GitHubLink != "" {
				projects[i].GitHubLink = req.GitHubLink
			}
			if req.LiveLink != "" {
				projects[i].LiveLink = req.LiveLink
			}
			if req.DriveLink != "" {
				projects[i].DriveLink = req.DriveLink
			}
			if req.VideoLink != "" {
				projects[i].VideoLink = req.VideoLink
			}
			if req.Technologies != nil {
				projects[i].Technologies = req.Technologies
			}
			if req.ClientName != "" {
				projects[i].ClientName = req.ClientName
			}
			if req.OtherLinks != nil {
				projects[i].OtherLinks = make([]domain.ProjectLink, len(req.OtherLinks))
				for j, link := range req.OtherLinks {
					projects[i].OtherLinks[j] = domain.ProjectLink{
						Label: link.Label,
						URL:   link.URL,
					}
				}
			}
			projects[i].UpdatedAt = time.Now().Format(time.RFC3339)

			// Marshal back to JSONB
			projectsJSON, err := json.Marshal(projects)
			if err != nil {
				return nil, err
			}

			profile.Projects = projectsJSON
			profile.UpdatedAt = time.Now()

			if err := s.userRepo.Update(ctx, profile); err != nil {
				return nil, err
			}

			return &projects[i], nil
		}
	}

	return nil, errors.New("project not found")
}

// DeleteProject deletes a project
func (s *ProfileService) DeleteProject(ctx context.Context, userID uint, projectID string) error {
	profile, err := s.userRepo.FindByUserID(ctx, userID)
	if err != nil {
		return err
	}

	// Parse existing projects
	var projects []domain.Project
	if len(profile.Projects) > 0 {
		if err := json.Unmarshal(profile.Projects, &projects); err != nil {
			return err
		}
	}

	// Remove project
	newProjects := make([]domain.Project, 0, len(projects))
	found := false
	for _, project := range projects {
		if project.ID != projectID {
			newProjects = append(newProjects, project)
		} else {
			found = true
		}
	}

	if !found {
		return errors.New("project not found")
	}

	// Update stats
	var stats map[string]interface{}
	if len(profile.Stats) > 0 {
		if err := json.Unmarshal(profile.Stats, &stats); err != nil {
			stats = make(map[string]interface{})
		}
	} else {
		stats = make(map[string]interface{})
	}
	stats["no_of_projects_done"] = len(newProjects)
	statsJSON, _ := json.Marshal(stats)

	// Marshal back to JSONB
	projectsJSON, err := json.Marshal(newProjects)
	if err != nil {
		return err
	}

	profile.Projects = projectsJSON
	profile.Stats = statsJSON
	profile.UpdatedAt = time.Now()

	return s.userRepo.Update(ctx, profile)
}

// CompletedContractData is the data received from the contract-service when a contract is completed
type CompletedContractData struct {
	ContractID     uint    `json:"contract_id"`
	ProjectName    string  `json:"project_name"`
	ClientName     string  `json:"client_name"`
	TotalAmount    float64 `json:"total_amount"`
	Currency       string  `json:"currency"`
	CompletionDate string  `json:"completion_date"`
	Rating         int     `json:"rating"`
}

// AddCompletedContract adds a completed contract summary to the freelancer's profile
func (s *ProfileService) AddCompletedContract(ctx context.Context, freelancerUserID uint, data CompletedContractData) error {
	profile, err := s.userRepo.FindByUserID(ctx, freelancerUserID)
	if err != nil {
		return err
	}

	// Parse existing stats
	var stats map[string]interface{}
	if len(profile.Stats) > 0 {
		if err := json.Unmarshal(profile.Stats, &stats); err != nil {
			stats = make(map[string]interface{})
		}
	} else {
		stats = make(map[string]interface{})
	}

	// Add/Update completed contracts list in stats
	var contracts []map[string]interface{}
	if raw, ok := stats["completed_contracts"]; ok {
		if arr, ok := raw.([]interface{}); ok {
			for _, item := range arr {
				if m, ok := item.(map[string]interface{}); ok {
					contracts = append(contracts, m)
				}
			}
		}
	}

	contracts = append(contracts, map[string]interface{}{
		"contract_id":     data.ContractID,
		"project_name":    data.ProjectName,
		"client_name":     data.ClientName,
		"total_amount":    data.TotalAmount,
		"currency":        data.Currency,
		"completion_date": data.CompletionDate,
		"rating":          data.Rating,
	})

	stats["completed_contracts"] = contracts

	// Update projects done count
	if count, ok := stats["no_of_projects_done"].(float64); ok {
		stats["no_of_projects_done"] = count + 1
	} else {
		stats["no_of_projects_done"] = len(contracts)
	}

	statsJSON, err := json.Marshal(stats)
	if err != nil {
		return err
	}

	profile.Stats = statsJSON
	profile.UpdatedAt = time.Now()

	return s.userRepo.Update(ctx, profile)
}
