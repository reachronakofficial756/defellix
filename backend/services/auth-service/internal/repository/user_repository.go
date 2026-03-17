package repository

import (
	"errors"
	"strings"

	"github.com/saiyam0211/defellix/services/auth-service/internal/domain"
	"gorm.io/gorm"
)

var (
	// ErrUserNotFound indicates user was not found
	ErrUserNotFound = errors.New("user not found")
	// ErrUserExists indicates user already exists
	ErrUserExists = errors.New("user already exists")
)

// UserRepository defines the interface for user data access
type UserRepository interface {
	Create(user *domain.User) error
	FindByID(id uint) (*domain.User, error)
	FindByEmail(email string) (*domain.User, error)
	Update(user *domain.User) error
	Delete(id uint) error

	// PendingRegistration operations
	CreatePendingRegistration(pr *domain.PendingRegistration) error
	FindPendingRegistrationByEmail(email string) (*domain.PendingRegistration, error)
	DeletePendingRegistration(email string) error

	// PendingOAuthUser operations
	CreatePendingOAuthUser(pou *domain.PendingOAuthUser) error
	FindPendingOAuthUserByEmail(email string) (*domain.PendingOAuthUser, error)
	DeletePendingOAuthUser(email string) error
}

// userRepository implements UserRepository interface
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *domain.User) error {
	if err := r.db.Create(user).Error; err != nil {
		// gorm.ErrDuplicatedKey doesn't reliably map for postgres drivers in some cases
		if errors.Is(err, gorm.ErrDuplicatedKey) || strings.Contains(err.Error(), "duplicate key value violates unique constraint") || strings.Contains(err.Error(), "SQLSTATE 23505") {
			return ErrUserExists
		}
		return err
	}
	return nil
}

// FindByID finds a user by ID
func (r *userRepository) FindByID(id uint) (*domain.User, error) {
	var user domain.User
	if err := r.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// FindByEmail finds a user by email
func (r *userRepository) FindByEmail(email string) (*domain.User, error) {
	var user domain.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// Update updates an existing user
func (r *userRepository) Update(user *domain.User) error {
	if err := r.db.Save(user).Error; err != nil {
		return err
	}
	return nil
}

// Delete soft deletes a user
func (r *userRepository) Delete(id uint) error {
	if err := r.db.Delete(&domain.User{}, id).Error; err != nil {
		return err
	}
	return nil
}

// CreatePendingRegistration upserts a pending registration
func (r *userRepository) CreatePendingRegistration(pr *domain.PendingRegistration) error {
	// Using Save instead of Create performs an UPSERT natively in gorm for Primary Keys
	if err := r.db.Save(pr).Error; err != nil {
		return err
	}
	return nil
}

// FindPendingRegistrationByEmail looks up a pending registration by email
func (r *userRepository) FindPendingRegistrationByEmail(email string) (*domain.PendingRegistration, error) {
	var pr domain.PendingRegistration
	if err := r.db.Where("email = ?", email).First(&pr).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound // reusing the general not found err
		}
		return nil, err
	}
	return &pr, nil
}

// DeletePendingRegistration permanently deletes a pending registration via its primary key email
func (r *userRepository) DeletePendingRegistration(email string) error {
	if err := r.db.Where("email = ?", email).Delete(&domain.PendingRegistration{}).Error; err != nil {
		return err
	}
	return nil
}

// CreatePendingOAuthUser upserts a pending OAuth user
func (r *userRepository) CreatePendingOAuthUser(pou *domain.PendingOAuthUser) error {
	if err := r.db.Save(pou).Error; err != nil {
		return err
	}
	return nil
}

// FindPendingOAuthUserByEmail looks up a pending OAuth user by email
func (r *userRepository) FindPendingOAuthUserByEmail(email string) (*domain.PendingOAuthUser, error) {
	var pou domain.PendingOAuthUser
	if err := r.db.Where("email = ?", email).First(&pou).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &pou, nil
}

// DeletePendingOAuthUser permanently deletes a pending OAuth user
func (r *userRepository) DeletePendingOAuthUser(email string) error {
	if err := r.db.Where("email = ?", email).Delete(&domain.PendingOAuthUser{}).Error; err != nil {
		return err
	}
	return nil
}
