package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/saiyam0211/defellix/services/user-service/internal/domain"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

var (
	// ErrUserNotFound indicates user was not found
	ErrUserNotFound = errors.New("user not found")
	// ErrUserExists indicates user already exists
	ErrUserExists = errors.New("user already exists")
	// ErrUserNameTaken indicates user_name is already in use by another profile
	ErrUserNameTaken = errors.New("user_name already taken")
)

// UserRepository defines the interface for user profile data access
type UserRepository interface {
	Create(ctx context.Context, profile *domain.User) error
	FindByID(ctx context.Context, id uint) (*domain.User, error)
	FindByUserID(ctx context.Context, userID uint) (*domain.User, error)
	FindByUserName(ctx context.Context, userName string) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	Update(ctx context.Context, profile *domain.User) error
	Search(ctx context.Context, filter map[string]interface{}, page, limit int64) ([]*domain.User, int64, error)
	AddSkill(ctx context.Context, userID uint, skill string) error
	RemoveSkill(ctx context.Context, userID uint, skill string) error
	AddPortfolioItem(ctx context.Context, userID uint, item *domain.PortfolioItem) error
	UpdatePortfolioItem(ctx context.Context, userID uint, itemID string, item *domain.PortfolioItem) (*domain.PortfolioItem, error)
	DeletePortfolioItem(ctx context.Context, userID uint, itemID string) error
	UpdateSkills(ctx context.Context, userID uint, skills datatypes.JSON) error
	FindUsersWithPositiveScore(ctx context.Context) ([]*domain.User, error)
}

// userRepository implements UserRepository interface
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// Create creates a new user profile
func (r *userRepository) Create(ctx context.Context, profile *domain.User) error {
	profile.CreatedAt = time.Now()
	profile.UpdatedAt = time.Now()

	if err := r.db.WithContext(ctx).Create(profile).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return ErrUserExists
		}
		return err
	}
	return nil
}

// FindByID finds a user profile by ID
func (r *userRepository) FindByID(ctx context.Context, id uint) (*domain.User, error) {
	var profile domain.User
	if err := r.db.WithContext(ctx).First(&profile, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &profile, nil
}

// FindByUserID finds a user profile by user ID (from auth-service)
func (r *userRepository) FindByUserID(ctx context.Context, userID uint) (*domain.User, error) {
	var profile domain.User
	if err := r.db.WithContext(ctx).Where("id = ?", userID).First(&profile).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &profile, nil
}

// FindByUserName finds a user profile by public user_name (ourdomain.com/user_name)
func (r *userRepository) FindByUserName(ctx context.Context, userName string) (*domain.User, error) {
	if userName == "" {
		return nil, ErrUserNotFound
	}
	var profile domain.User
	if err := r.db.WithContext(ctx).Where("user_name = ?", userName).First(&profile).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &profile, nil
}

// FindByEmail finds a user profile by email
func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var profile domain.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&profile).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &profile, nil
}

// Update updates an existing user profile
func (r *userRepository) Update(ctx context.Context, profile *domain.User) error {
	profile.UpdatedAt = time.Now()

	if err := r.db.WithContext(ctx).Save(profile).Error; err != nil {
		return err
	}
	return nil
}

// UpdateSkills explicitly updates just the skills JSON column
func (r *userRepository) UpdateSkills(ctx context.Context, userID uint, skills datatypes.JSON) error {
	return r.db.WithContext(ctx).Model(&domain.User{}).Where("id = ?", userID).Update("skills", skills).Error
}

// Search searches for user profiles with filters
func (r *userRepository) Search(ctx context.Context, filter map[string]interface{}, page, limit int64) ([]*domain.User, int64, error) {
	query := r.db.WithContext(ctx).Model(&domain.User{})

	// Apply filters
	if isActive, ok := filter["is_active"].(bool); ok {
		query = query.Where("is_active = ?", isActive)
	}

	if role, ok := filter["role"].(string); ok && role != "" {
		query = query.Where("role = ?", role)
	}

	if location, ok := filter["location"].(string); ok && location != "" {
		query = query.Where("location ILIKE ?", "%"+location+"%")
	}

	if availability, ok := filter["availability"].(string); ok && availability != "" {
		query = query.Where("availability = ?", availability)
	}

	if minRate, ok := filter["min_rate"].(float64); ok {
		query = query.Where("hourly_rate >= ?", minRate)
	}

	if maxRate, ok := filter["max_rate"].(float64); ok {
		query = query.Where("hourly_rate <= ?", maxRate)
	}

	// Skills filter (JSONB contains)
	if skills, ok := filter["skills"].([]string); ok && len(skills) > 0 {
		for _, skill := range skills {
			query = query.Where("skills @> ?", fmt.Sprintf(`["%s"]`, skill))
		}
	}

	// Text search (full-text search)
	if queryText, ok := filter["query"].(string); ok && queryText != "" {
		query = query.Where(
			"to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(short_headline, '') || ' ' || COALESCE(bio, '')) @@ plainto_tsquery('english', ?)",
			queryText,
		)
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and sorting
	skip := (page - 1) * limit
	var profiles []*domain.User
	if err := query.
		Order("created_at DESC").
		Offset(int(skip)).
		Limit(int(limit)).
		Find(&profiles).Error; err != nil {
		return nil, 0, err
	}

	return profiles, total, nil
}

// AddSkill adds a skill to user profile
func (r *userRepository) AddSkill(ctx context.Context, userID uint, skill string) error {
	profile, err := r.FindByUserID(ctx, userID)
	if err != nil {
		return err
	}

	// Parse existing skills
	var skills []string
	if len(profile.Skills) > 0 {
		if err := json.Unmarshal(profile.Skills, &skills); err != nil {
			return err
		}
	}

	// Check if skill already exists
	for _, s := range skills {
		if s == skill {
			return nil // Already exists
		}
	}

	// Add skill
	skills = append(skills, skill)
	skillsJSON, err := json.Marshal(skills)
	if err != nil {
		return err
	}

	profile.Skills = skillsJSON
	profile.UpdatedAt = time.Now()

	return r.db.WithContext(ctx).Model(profile).Update("skills", skillsJSON).Error
}

// RemoveSkill removes a skill from user profile
func (r *userRepository) RemoveSkill(ctx context.Context, userID uint, skill string) error {
	profile, err := r.FindByUserID(ctx, userID)
	if err != nil {
		return err
	}

	// Parse existing skills
	var skills []string
	if len(profile.Skills) > 0 {
		if err := json.Unmarshal(profile.Skills, &skills); err != nil {
			return err
		}
	}

	// Remove skill
	newSkills := make([]string, 0, len(skills))
	for _, s := range skills {
		if s != skill {
			newSkills = append(newSkills, s)
		}
	}

	skillsJSON, err := json.Marshal(newSkills)
	if err != nil {
		return err
	}

	profile.Skills = skillsJSON
	profile.UpdatedAt = time.Now()

	return r.db.WithContext(ctx).Model(profile).Update("skills", skillsJSON).Error
}

// AddPortfolioItem adds a portfolio item to user profile (legacy)
func (r *userRepository) AddPortfolioItem(ctx context.Context, userID uint, item *domain.PortfolioItem) error {
	profile, err := r.FindByUserID(ctx, userID)
	if err != nil {
		return err
	}

	// Parse existing portfolio
	var portfolio []domain.PortfolioItem
	if len(profile.Portfolio) > 0 {
		if err := json.Unmarshal(profile.Portfolio, &portfolio); err != nil {
			return err
		}
	}

	// Add item
	portfolio = append(portfolio, *item)
	portfolioJSON, err := json.Marshal(portfolio)
	if err != nil {
		return err
	}

	profile.Portfolio = portfolioJSON
	profile.UpdatedAt = time.Now()

	return r.db.WithContext(ctx).Model(profile).Update("portfolio", portfolioJSON).Error
}

// UpdatePortfolioItem updates a portfolio item (legacy)
func (r *userRepository) UpdatePortfolioItem(ctx context.Context, userID uint, itemID string, item *domain.PortfolioItem) (*domain.PortfolioItem, error) {
	profile, err := r.FindByUserID(ctx, userID)
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

	// Update item
	for i, p := range portfolio {
		if p.ID == itemID {
			// Update fields
			if item.Title != "" {
				portfolio[i].Title = item.Title
			}
			if item.Description != "" {
				portfolio[i].Description = item.Description
			}
			if item.URL != "" {
				portfolio[i].URL = item.URL
			}
			if item.ImageURL != "" {
				portfolio[i].ImageURL = item.ImageURL
			}
			if item.Technologies != nil {
				portfolio[i].Technologies = item.Technologies
			}

			portfolioJSON, err := json.Marshal(portfolio)
			if err != nil {
				return nil, err
			}
			profile.Portfolio = portfolioJSON
			profile.UpdatedAt = time.Now()
			if err := r.db.WithContext(ctx).Model(profile).Update("portfolio", portfolioJSON).Error; err != nil {
				return nil, err
			}
			return &portfolio[i], nil
		}
	}

	return nil, ErrUserNotFound
}

// DeletePortfolioItem deletes a portfolio item (legacy)
func (r *userRepository) DeletePortfolioItem(ctx context.Context, userID uint, itemID string) error {
	profile, err := r.FindByUserID(ctx, userID)
	if err != nil {
		return err
	}

	// Parse existing portfolio
	var portfolio []domain.PortfolioItem
	if len(profile.Portfolio) > 0 {
		if err := json.Unmarshal(profile.Portfolio, &portfolio); err != nil {
			return err
		}
	}

	// Remove item
	newPortfolio := make([]domain.PortfolioItem, 0, len(portfolio))
	for _, p := range portfolio {
		if p.ID != itemID {
			newPortfolio = append(newPortfolio, p)
		}
	}

	portfolioJSON, err := json.Marshal(newPortfolio)
	if err != nil {
		return err
	}

	profile.Portfolio = portfolioJSON
	profile.UpdatedAt = time.Now()

	return r.db.WithContext(ctx).Model(profile).Update("portfolio", portfolioJSON).Error
}

// FindUsersWithPositiveScore returns all users that have a credibility score > 0
func (r *userRepository) FindUsersWithPositiveScore(ctx context.Context) ([]*domain.User, error) {
	var users []*domain.User
	if err := r.db.WithContext(ctx).
		Where("credibility_score > 0").
		Select("id, credibility_score, score_tier").
		Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}
