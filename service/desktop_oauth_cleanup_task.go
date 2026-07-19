package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"

	"github.com/bytedance/gopkg/util/gopool"
)

const desktopOAuthCleanupInterval = time.Hour

var desktopOAuthCleanupOnce sync.Once

// StartDesktopOAuthCleanupTask performs one cleanup at startup and then keeps
// temporary OAuth records within the model's retention window. Only a master
// node starts the task; duplicate execution would still be safe, but avoiding
// it reduces unnecessary database writes in multi-node deployments.
func StartDesktopOAuthCleanupTask() {
	desktopOAuthCleanupOnce.Do(func() {
		if !common.IsMasterNode {
			return
		}
		gopool.Go(func() {
			runDesktopOAuthCleanupOnce()
			ticker := time.NewTicker(desktopOAuthCleanupInterval)
			defer ticker.Stop()
			for range ticker.C {
				runDesktopOAuthCleanupOnce()
			}
		})
	})
}

func runDesktopOAuthCleanupOnce() {
	result, err := model.CleanupDesktopOAuthTemporaryData(
		common.GetTimestamp(),
		model.DesktopOAuthRetentionSeconds,
	)
	if err != nil {
		logger.LogWarn(context.Background(), fmt.Sprintf("desktop oauth cleanup failed: %v", err))
		return
	}
	if common.DebugEnabled && (result.CodesRedacted > 0 || result.CodesDeleted > 0 || result.RequestsDeleted > 0) {
		logger.LogDebug(
			context.Background(),
			"desktop oauth cleanup: codes_redacted=%d codes_deleted=%d requests_deleted=%d",
			result.CodesRedacted,
			result.CodesDeleted,
			result.RequestsDeleted,
		)
	}
}
