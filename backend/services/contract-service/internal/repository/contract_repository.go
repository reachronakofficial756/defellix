package repository

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/saiyam0211/defellix/services/contract-service/internal/domain"
	"gorm.io/gorm"
)

var (
	ErrContractNotFound = errors.New("contract not found")
)

type ContractRepository interface {
	Create(ctx context.Context, c *domain.Contract, milestones []domain.ContractMilestone) error
	GetByID(ctx context.Context, id uint, freelancerUserID uint) (*domain.Contract, error)
	ListByFreelancer(ctx context.Context, freelancerUserID uint, status string, page, limit int) ([]*domain.Contract, int64, error)
	Update(ctx context.Context, c *domain.Contract, milestones []domain.ContractMilestone) error
	UpdateContractOnly(ctx context.Context, c *domain.Contract) error
	UpdateStatus(ctx context.Context, id uint, freelancerUserID uint, status string) error
	UpdateStatusAndSentAt(ctx context.Context, id uint, freelancerUserID uint, status string, sentAt *time.Time) error
	UpdateStatusSentAtAndClientToken(ctx context.Context, id uint, freelancerUserID uint, status string, sentAt *time.Time, clientToken string) error
	UpdateMilestoneStatus(ctx context.Context, milestoneID uint, status string) error
	UpdateMilestoneDueDate(ctx context.Context, milestoneID uint, newDate *time.Time) error
	Delete(ctx context.Context, id uint, freelancerUserID uint) error
	ReplaceMilestones(ctx context.Context, contractID uint, milestones []domain.ContractMilestone) error
	DeleteDraftsOlderThan(ctx context.Context, cutoff time.Time) (int64, error)
	FindByClientViewToken(ctx context.Context, token string) (*domain.Contract, error)
	UpdateToPendingByToken(ctx context.Context, token, comment string) error
	UpdateToSigned(ctx context.Context, contractID uint, signedAt *time.Time, companyAddress, signMetadata string) error
	UpdateBlockchainMetadata(ctx context.Context, contractID uint, txHash, txID, network, status string, blockNum, gasUsed *uint64) error
	SaveSignOTP(ctx context.Context, token, otp string, expiresAt time.Time) error
	CountUnapprovedMilestones(ctx context.Context, contractID uint) (int64, error)

	// Outbox methods
	FetchPendingOutboxTasks(ctx context.Context, limit int) ([]*domain.BlockchainOutbox, error)
	MarkOutboxTaskProcessing(ctx context.Context, id uint) error
	UpdateOutboxTaskResult(ctx context.Context, id uint, status, errorLog string, retryCount int) error
	GetContractInternal(ctx context.Context, id uint) (*domain.Contract, error)
}

type contractRepository struct {
	db *gorm.DB
}

func NewContractRepository(db *gorm.DB) ContractRepository {
	return &contractRepository{db: db}
}

func (r *contractRepository) Create(ctx context.Context, c *domain.Contract, milestones []domain.ContractMilestone) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(c).Error; err != nil {
			return err
		}
		for i := range milestones {
			milestones[i].ContractID = c.ID
			milestones[i].OrderIndex = i
			if err := tx.Create(&milestones[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *contractRepository) CountUnapprovedMilestones(ctx context.Context, contractID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.ContractMilestone{}).Where("contract_id = ? AND status != ?", contractID, "approved").Count(&count).Error
	return count, err
}

func (r *contractRepository) FetchPendingOutboxTasks(ctx context.Context, limit int) ([]*domain.BlockchainOutbox, error) {
	var tasks []*domain.BlockchainOutbox
	err := r.db.WithContext(ctx).Where("status = ?", domain.OutboxStatusPending).Limit(limit).Find(&tasks).Error
	return tasks, err
}

func (r *contractRepository) MarkOutboxTaskProcessing(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Model(&domain.BlockchainOutbox{}).Where("id = ?", id).Update("status", domain.OutboxStatusProcessing).Error
}

func (r *contractRepository) UpdateOutboxTaskResult(ctx context.Context, id uint, status, errorLog string, retryCount int) error {
	return r.db.WithContext(ctx).Model(&domain.BlockchainOutbox{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":      status,
		"error_log":   errorLog,
		"retry_count": retryCount,
	}).Error
}

func (r *contractRepository) GetContractInternal(ctx context.Context, id uint) (*domain.Contract, error) {
	var c domain.Contract
	err := r.db.WithContext(ctx).Preload("Milestones").First(&c, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrContractNotFound
		}
		return nil, err
	}
	return &c, nil
}

func (r *contractRepository) GetByID(ctx context.Context, id uint, freelancerUserID uint) (*domain.Contract, error) {
	var c domain.Contract
	err := r.db.WithContext(ctx).Preload("Milestones", func(db *gorm.DB) *gorm.DB {
		return db.Order("order_index ASC")
	}).Where("id = ? AND freelancer_user_id = ?", id, freelancerUserID).First(&c).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrContractNotFound
		}
		return nil, err
	}

	// Backfill Missing Token (Phase 10: ensure legacy contracts have tokens for public review)
	if c.ClientViewToken == "" {
		newToken := uuid.New().String()
		r.db.WithContext(ctx).Model(&domain.Contract{}).Where("id = ?", c.ID).Update("client_view_token", newToken)
		c.ClientViewToken = newToken
	}

	if err := r.db.WithContext(ctx).Model(&domain.Submission{}).Where("contract_id = ? AND status = ?", c.ID, domain.SubmissionStatusDraft).Count(&c.DraftCount).Error; err != nil {
		// Log error but don't fail the whole request
		fmt.Printf("Error counting drafts for contract %d: %v\n", c.ID, err)
	}

	for i := range c.Milestones {
		var lastDraftAt *time.Time
		r.db.WithContext(ctx).Model(&domain.Submission{}).
			Where("milestone_id = ? AND status = ?", c.Milestones[i].ID, domain.SubmissionStatusDraft).
			Order("updated_at DESC").
			Limit(1).
			Select("updated_at").
			Scan(&lastDraftAt)
		c.Milestones[i].LastDraftAt = lastDraftAt

		// Fetch latest non-draft submission (Phase 10)
		var latestSub domain.Submission
		if err := r.db.WithContext(ctx).Where("milestone_id = ? AND status != ?", c.Milestones[i].ID, domain.SubmissionStatusDraft).
			Order("submitted_at DESC").First(&latestSub).Error; err == nil {
			c.Milestones[i].LatestSubmission = &latestSub
		}
	}

	return &c, nil
}

func (r *contractRepository) ListByFreelancer(ctx context.Context, freelancerUserID uint, status string, page, limit int) ([]*domain.Contract, int64, error) {
	baseQ := r.db.WithContext(ctx).Model(&domain.Contract{}).Where("freelancer_user_id = ?", freelancerUserID)
	if status != "" {
		baseQ = baseQ.Where("status = ?", status)
	}
	var total int64
	if err := baseQ.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []*domain.Contract
	offset := (page - 1) * limit
	if offset < 0 {
		offset = 0
	}
	if limit <= 0 {
		limit = 20
	}
	fetchQ := r.db.WithContext(ctx).
		Preload("Milestones", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC")
		}).
		Where("freelancer_user_id = ?", freelancerUserID)
	if status != "" {
		fetchQ = fetchQ.Where("status = ?", status)
	}
	err := fetchQ.Order("updated_at DESC").Offset(offset).Limit(limit).Find(&list).Error
	if err != nil {
		return nil, 0, err
	}
	for i := range list {
		if err := r.db.WithContext(ctx).Model(&domain.Submission{}).Where("contract_id = ? AND status = ?", list[i].ID, domain.SubmissionStatusDraft).Count(&list[i].DraftCount).Error; err != nil {
			fmt.Printf("Error counting drafts for contract %d: %v\n", list[i].ID, err)
		}
		for j := range list[i].Milestones {
			var lastDraftAt *time.Time
			r.db.WithContext(ctx).Model(&domain.Submission{}).
				Where("milestone_id = ? AND status = ?", list[i].Milestones[j].ID, domain.SubmissionStatusDraft).
				Order("updated_at DESC").
				Limit(1).
				Select("updated_at").
				Scan(&lastDraftAt)
			list[i].Milestones[j].LastDraftAt = lastDraftAt
		}
	}

	return list, total, nil
}

func (r *contractRepository) Update(ctx context.Context, c *domain.Contract, milestones []domain.ContractMilestone) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(c).Error; err != nil {
			return err
		}

		var incomingIDs []uint
		for _, m := range milestones {
			if m.ID > 0 {
				incomingIDs = append(incomingIDs, m.ID)
			}
		}

		if len(incomingIDs) > 0 {
			if err := tx.Where("contract_id = ? AND id NOT IN ?", c.ID, incomingIDs).Delete(&domain.ContractMilestone{}).Error; err != nil {
				return err
			}
		} else {
			if err := tx.Where("contract_id = ?", c.ID).Delete(&domain.ContractMilestone{}).Error; err != nil {
				return err
			}
		}

		for i := range milestones {
			milestones[i].ContractID = c.ID
			milestones[i].OrderIndex = i

			if milestones[i].ID > 0 {
				if err := tx.Save(&milestones[i]).Error; err != nil {
					return err
				}
			} else {
				if err := tx.Create(&milestones[i]).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *contractRepository) UpdateContractOnly(ctx context.Context, c *domain.Contract) error {
	return r.db.WithContext(ctx).Save(c).Error
}

func (r *contractRepository) UpdateStatus(ctx context.Context, id uint, freelancerUserID uint, status string) error {
	res := r.db.WithContext(ctx).Model(&domain.Contract{}).
		Where("id = ? AND freelancer_user_id = ?", id, freelancerUserID).
		Update("status", status)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrContractNotFound
	}
	return nil
}

func (r *contractRepository) UpdateStatusAndSentAt(ctx context.Context, id uint, freelancerUserID uint, status string, sentAt *time.Time) error {
	updates := map[string]interface{}{"status": status}
	if sentAt != nil {
		updates["sent_at"] = sentAt
	}
	res := r.db.WithContext(ctx).Model(&domain.Contract{}).
		Where("id = ? AND freelancer_user_id = ?", id, freelancerUserID).
		Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrContractNotFound
	}
	return nil
}

func (r *contractRepository) UpdateStatusSentAtAndClientToken(ctx context.Context, id uint, freelancerUserID uint, status string, sentAt *time.Time, clientToken string) error {
	updates := map[string]interface{}{"status": status, "client_view_token": clientToken}
	if sentAt != nil {
		updates["sent_at"] = sentAt
	}
	res := r.db.WithContext(ctx).Model(&domain.Contract{}).
		Where("id = ? AND freelancer_user_id = ?", id, freelancerUserID).
		Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrContractNotFound
	}
	return nil
}

func (r *contractRepository) Delete(ctx context.Context, id uint, freelancerUserID uint) error {
	res := r.db.WithContext(ctx).Where("id = ? AND freelancer_user_id = ?", id, freelancerUserID).Delete(&domain.Contract{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrContractNotFound
	}
	return nil
}

func (r *contractRepository) ReplaceMilestones(ctx context.Context, contractID uint, milestones []domain.ContractMilestone) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		incomingIDs := []uint{}
		for _, m := range milestones {
			if m.ID > 0 {
				incomingIDs = append(incomingIDs, m.ID)
			}
		}

		if len(incomingIDs) > 0 {
			if err := tx.Where("contract_id = ? AND id NOT IN ?", contractID, incomingIDs).Delete(&domain.ContractMilestone{}).Error; err != nil {
				return err
			}
		} else {
			if err := tx.Where("contract_id = ?", contractID).Delete(&domain.ContractMilestone{}).Error; err != nil {
				return err
			}
		}

		for i := range milestones {
			milestones[i].ContractID = contractID
			milestones[i].OrderIndex = i
			if err := tx.Save(&milestones[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *contractRepository) DeleteDraftsOlderThan(ctx context.Context, cutoff time.Time) (int64, error) {
	var deleted int64
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var ids []uint
		if err := tx.Model(&domain.Contract{}).Where("status = ? AND created_at < ?", domain.ContractStatusDraft, cutoff).Pluck("id", &ids).Error; err != nil {
			return err
		}
		if len(ids) == 0 {
			return nil
		}
		if err := tx.Where("contract_id IN ?", ids).Unscoped().Delete(&domain.ContractMilestone{}).Error; err != nil {
			return err
		}
		res := tx.Where("id IN ?", ids).Unscoped().Delete(&domain.Contract{})
		if res.Error != nil {
			return res.Error
		}
		deleted = res.RowsAffected
		return nil
	})
	return deleted, err
}

func (r *contractRepository) FindByClientViewToken(ctx context.Context, token string) (*domain.Contract, error) {
	if token == "" {
		return nil, ErrContractNotFound
	}
	var c domain.Contract
	err := r.db.WithContext(ctx).Preload("Milestones", func(db *gorm.DB) *gorm.DB {
		return db.Order("order_index ASC")
	}).Where("client_view_token = ?", token).First(&c).Error

	// Fallback: If not found by token, check if token is actually a numeric ID (Phase 10 legacy support)
	if err != nil && errors.Is(err, gorm.ErrRecordNotFound) {
		if id, parseErr := strconv.ParseUint(token, 10, 32); parseErr == nil {
			err = r.db.WithContext(ctx).Preload("Milestones", func(db *gorm.DB) *gorm.DB {
				return db.Order("order_index ASC")
			}).Where("id = ?", id).First(&c).Error
		}
	}

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrContractNotFound
		}
		return nil, err
	}

	for i := range c.Milestones {
		var lastDraftAt *time.Time
		r.db.WithContext(ctx).Model(&domain.Submission{}).
			Where("milestone_id = ? AND status = ?", c.Milestones[i].ID, domain.SubmissionStatusDraft).
			Order("updated_at DESC").
			Limit(1).
			Select("updated_at").
			Scan(&lastDraftAt)
		c.Milestones[i].LastDraftAt = lastDraftAt

		// Fetch latest non-draft submission (Phase 10)
		var latestSub domain.Submission
		if err := r.db.WithContext(ctx).Where("milestone_id = ? AND status != ?", c.Milestones[i].ID, domain.SubmissionStatusDraft).
			Order("submitted_at DESC").First(&latestSub).Error; err == nil {
			c.Milestones[i].LatestSubmission = &latestSub
		}
	}

	return &c, nil
}

func (r *contractRepository) UpdateToPendingByToken(ctx context.Context, token, comment string) error {
	res := r.db.WithContext(ctx).Model(&domain.Contract{}).
		Where("client_view_token = ? AND status = ?", token, domain.ContractStatusSent).
		Updates(map[string]interface{}{"status": domain.ContractStatusPending, "client_review_comment": comment})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrContractNotFound
	}
	return nil
}

func (r *contractRepository) UpdateToSigned(ctx context.Context, contractID uint, signedAt *time.Time, companyAddress, signMetadata string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		updates := map[string]interface{}{
			"status":                 domain.ContractStatusSigned,
			"client_company_address": companyAddress,
			"client_sign_metadata":   signMetadata,
			"sign_otp":               "",
			"otp_expires_at":         nil,
			"last_otp_sent_at":       nil,
		}
		if signedAt != nil {
			updates["client_signed_at"] = signedAt
		}
		res := tx.Model(&domain.Contract{}).Where("id = ? AND status = ?", contractID, domain.ContractStatusSent).Updates(updates)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrContractNotFound
		}

		outbox := &domain.BlockchainOutbox{
			ContractID: contractID,
			Status:     domain.OutboxStatusPending,
		}
		if err := tx.Create(outbox).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *contractRepository) UpdateBlockchainMetadata(ctx context.Context, contractID uint, txHash, txID, network, status string, blockNum, gasUsed *uint64) error {
	updates := map[string]interface{}{
		"blockchain_tx_hash": txHash,
		"blockchain_tx_id":   txID,
		"blockchain_network": network,
		"blockchain_status":  status,
	}
	if blockNum != nil {
		updates["blockchain_block_num"] = blockNum
	}
	if gasUsed != nil {
		updates["blockchain_gas_used"] = gasUsed
	}
	res := r.db.WithContext(ctx).Model(&domain.Contract{}).
		Where("id = ?", contractID).
		Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrContractNotFound
	}
	return nil
}

func (r *contractRepository) UpdateMilestoneDueDate(ctx context.Context, milestoneID uint, newDate *time.Time) error {
	return r.db.WithContext(ctx).Model(&domain.ContractMilestone{}).Where("id = ?", milestoneID).Update("due_date", newDate).Error
}

func (r *contractRepository) UpdateMilestoneStatus(ctx context.Context, milestoneID uint, status string) error {
	res := r.db.WithContext(ctx).Model(&domain.ContractMilestone{}).Where("id = ?", milestoneID).Update("status", status)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("milestone not found")
	}
	return nil
}

func (r *contractRepository) SaveSignOTP(ctx context.Context, token, otp string, expiresAt time.Time) error {
	now := time.Now()
	res := r.db.WithContext(ctx).Model(&domain.Contract{}).
		Where("client_view_token = ? AND status NOT IN ?", token, []string{domain.ContractStatusDraft, domain.ContractStatusCancel}).
		Updates(map[string]interface{}{
			"sign_otp":         otp,
			"otp_expires_at":   expiresAt,
			"last_otp_sent_at": now,
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrContractNotFound
	}
	return nil
}
