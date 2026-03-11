package job

import (
	"context"
	"log"
	"time"
)

// GhostedCleanupRunner runs MarkGhostedSubmissions periodically. Start in a goroutine from main.
type GhostedCleanupRunner struct {
	run      func(ctx context.Context) (int64, error)
	interval time.Duration
}

// NewGhostedCleanupRunner builds a runner that calls markGhosted every interval.
// markGhosted is typically (*service.SubmissionService).MarkGhostedSubmissions.
func NewGhostedCleanupRunner(markGhosted func(context.Context) (int64, error), interval time.Duration) *GhostedCleanupRunner {
	if interval <= 0 {
		interval = 24 * time.Hour // Default to daily
	}
	return &GhostedCleanupRunner{run: markGhosted, interval: interval}
}

// Start blocks and runs the job every interval until ctx is cancelled. Call in a goroutine.
func (r *GhostedCleanupRunner) Start(ctx context.Context) {
	ticker := time.NewTicker(r.interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			n, err := r.run(ctx)
			if err != nil {
				log.Printf("[ghosted-cleanup] error: %v", err)
				continue
			}
			if n > 0 {
				log.Printf("[ghosted-cleanup] marked %d submission(s) as ghosted", n)
			}
		}
	}
}
