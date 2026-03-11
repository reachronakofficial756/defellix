package job

import (
	"context"
	"log"
	"time"

	"github.com/saiyam0211/defellix/services/contract-service/internal/service"
)

// StartBlockchainSyncWorker starts a background worker that polls the BlockchainOutbox
// and processes pending transactions.
func StartBlockchainSyncWorker(svc *service.ContractService, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		log.Printf("contract-service: starting blockchain outbox worker (interval: %v)", interval)
		for {
			<-ticker.C
			// Using context.Background is fine for a global background worker
			svc.ProcessOutbox(context.Background())
		}
	}()
}
