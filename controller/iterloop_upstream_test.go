package controller

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAggregateAccountsExcludesOtherProviders(t *testing.T) {
	files := []map[string]any{
		{"provider": "codex", "status": "active"},
		{"provider": "codex", "disabled": true},
		{"provider": "claude", "status": "error"},
		{"provider": "claude", "disabled": false, "unavailable": true},
		{"provider": "xai", "status": "active"},
		{"provider": "xai", "status": "active", "status_message": "personal-team-blocked:spending-limit"},
		{"provider": "gemini", "status": "active"},
	}
	summary := aggregateAccounts(files)
	assert.Equal(t, 6, summary.Total)
	assert.Equal(t, 2, summary.Active)
	assert.Equal(t, 1, summary.Disabled)
	assert.Equal(t, 2, summary.Error)
	assert.Equal(t, 1, summary.Unavailable)
	assert.Equal(t, 2, summary.Codex)
	assert.Equal(t, 2, summary.Claude)
	assert.Equal(t, 2, summary.XAI)
	assert.Equal(t, 1, summary.XAIActive)
	assert.Equal(t, 1, summary.XAIFailed)
	assert.Equal(t, 1, summary.SpendingLimit)
}

func TestQuotaRemainingParsers(t *testing.T) {
	five, weekly := codexRemaining(map[string]any{
		"rate_limit": map[string]any{
			"primary_window":   map[string]any{"used_percent": float64(22)},
			"secondary_window": map[string]any{"used_percent": float64(40)},
		},
	})
	require.NotNil(t, five)
	require.NotNil(t, weekly)
	assert.Equal(t, 78.0, *five)
	assert.Equal(t, 60.0, *weekly)

	five, weekly = claudeRemaining(map[string]any{
		"five_hour": map[string]any{"utilization": float64(10)},
		"seven_day": map[string]any{"utilization": float64(75)},
	})
	require.NotNil(t, five)
	require.NotNil(t, weekly)
	assert.Equal(t, 90.0, *five)
	assert.Equal(t, 25.0, *weekly)
}

func TestUpstreamFileUnavailableChecksEachFlag(t *testing.T) {
	assert.True(t, upstreamFileUnavailable(map[string]any{
		"disabled": false, "unavailable": true,
	}))
	assert.False(t, upstreamFileUnavailable(map[string]any{
		"disabled": false, "unavailable": false,
	}))
}
