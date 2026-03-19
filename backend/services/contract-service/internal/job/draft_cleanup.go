package job

import (
	"context"
	"log"
	"time"
)

// DraftCleanupRunner runs DeleteExpiredDrafts periodically. Start in a goroutine from main.
type DraftCleanupRunner struct {
	run      func(ctx context.Context) (int64, error)
	interval time.Duration
}

// NewDraftCleanupRunner builds a runner that calls deleteExpiredDrafts every interval.
// deleteExpiredDrafts is typically (*service.ContractService).DeleteExpiredDrafts.
func NewDraftCleanupRunner(deleteExpiredDrafts func(context.Context) (int64, error), interval time.Duration) *DraftCleanupRunner {
	if interval <= 0 {
		interval = 6 * time.Hour
	}
	return &DraftCleanupRunner{run: deleteExpiredDrafts, interval: interval}
}

// Start blocks and runs the job every interval until ctx is cancelled. Call in a goroutine.
func (r *DraftCleanupRunner) Start(ctx context.Context) {
	ticker := time.NewTicker(r.interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			n, err := r.run(ctx)
			if err != nil {
				log.Printf("[draft-cleanup] error: %v", err)
				continue
			}
			if n > 0 {
				log.Printf("[draft-cleanup] deleted %d expired draft(s)", n)
			}
		}
	}
}
