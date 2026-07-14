package operation_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetIterLoopGroupModelRatio(t *testing.T) {
	ratio, ok := GetIterLoopGroupModelRatio("combined-standard", "gpt-5.5")
	require.True(t, ok)
	assert.Equal(t, 0.4, ratio)

	ratio, ok = GetIterLoopGroupModelRatio("combined-standard", "claude-sonnet-4-6")
	require.True(t, ok)
	assert.Equal(t, 0.7, ratio)

	_, ok = GetIterLoopGroupModelRatio("default", "gpt-5.5")
	assert.False(t, ok)
}
