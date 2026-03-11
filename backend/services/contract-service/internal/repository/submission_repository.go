package repository

import (
	"context"
	"errors"
	"time"

	"github.com/saiyam0211/defellix/services/contract-service/internal/domain"
	"gorm.io/gorm"
)

var ErrSubmissionNotFound = errors.New("submission not found")

type SubmissionRepository interface {
	Create(ctx context.Context, submission *domain.Submission) error
	GetByID(ctx context.Context, id uint) (*domain.Submission, error)
	GetByContractID(ctx context.Context, contractID uint) ([]*domain.Submission, error)
	Update(ctx context.Context, submission *domain.Submission) error
	MarkGhostedSubmissionsOlderThan(ctx context.Context, cutoff time.Time) (int64, error)
	HasActiveSubmissionForMilestone(ctx context.Context, milestoneID uint) (bool, error)
}

type submissionRepository struct {
	db *gorm.DB
}

func NewSubmissionRepository(db *gorm.DB) SubmissionRepository {
	return &submissionRepository{db: db}
}

func (r *submissionRepository) Create(ctx context.Context, s *domain.Submission) error {
	return r.db.WithContext(ctx).Create(s).Error
}

func (r *submissionRepository) GetByID(ctx context.Context, id uint) (*domain.Submission, error) {
	var s domain.Submission
	if err := r.db.WithContext(ctx).First(&s, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSubmissionNotFound
		}
		return nil, err
	}
	return &s, nil
}

func (r *submissionRepository) GetByContractID(ctx context.Context, contractID uint) ([]*domain.Submission, error) {
	var list []*domain.Submission
	if err := r.db.WithContext(ctx).Where("contract_id = ?", contractID).Order("submitted_at desc").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *submissionRepository) Update(ctx context.Context, s *domain.Submission) error {
	return r.db.WithContext(ctx).Save(s).Error
}

func (r *submissionRepository) MarkGhostedSubmissionsOlderThan(ctx context.Context, cutoff time.Time) (int64, error) {
	res := r.db.WithContext(ctx).Model(&domain.Submission{}).
		Where("status = ? AND submitted_at < ?", "pending_review", cutoff).
		Update("status", "ghosted")
	return res.RowsAffected, res.Error
}

func (r *submissionRepository) HasActiveSubmissionForMilestone(ctx context.Context, milestoneID uint) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Submission{}).
		Where("milestone_id = ? AND status IN ?", milestoneID, []string{"pending_review", "accepted"}).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
