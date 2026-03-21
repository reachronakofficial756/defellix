package service

import (
	"context"
	"log"
	"time"
)

// StartInactivityDecayCron starts a background goroutine that runs daily to
// recalculate scores for users who have been inactive for 90+ days.
// The existing RecalculateUserScore already applies ApplyInactivityDecay
// when the last reputation record is older than 3 months.
func StartInactivityDecayCron(repService *ReputationService) {
	go func() {
		// Run immediately on startup, then every 24 hours
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		// Small delay on first run to let the server fully boot
		time.Sleep(30 * time.Second)
		runInactivityDecay(repService)

		for range ticker.C {
			runInactivityDecay(repService)
		}
	}()
	log.Println("[E7] Inactivity decay cron job started (runs every 24 hours)")
}

func runInactivityDecay(repService *ReputationService) {
	ctx := context.Background()

	users, err := repService.userRepo.FindUsersWithPositiveScore(ctx)
	if err != nil {
		log.Printf("[E7] Cron: failed to fetch users with positive score: %v", err)
		return
	}

	if len(users) == 0 {
		log.Println("[E7] Cron: no users with positive score found, skipping")
		return
	}

	processed := 0
	for _, user := range users {
		// Check if this user has any reputation records
		reps, err := repService.repRepo.GetByFreelancerID(ctx, user.ID)
		if err != nil || len(reps) == 0 {
			continue
		}

		// Find the most recent reputation record
		lastActivity := reps[0].CreatedAt
		for _, rep := range reps {
			if rep.CreatedAt.After(lastActivity) {
				lastActivity = rep.CreatedAt
			}
		}

		// Only recalculate if inactive for 90+ days
		monthsInactive := int(time.Since(lastActivity).Hours() / 24 / 30)
		if monthsInactive > 3 {
			if err := repService.RecalculateUserScore(ctx, user.ID); err != nil {
				log.Printf("[E7] Cron: failed to recalculate score for user %d: %v", user.ID, err)
				continue
			}
			processed++
		}
	}

	if processed > 0 {
		log.Printf("[E7] Cron: inactivity decay processed for %d users", processed)
	}
}
