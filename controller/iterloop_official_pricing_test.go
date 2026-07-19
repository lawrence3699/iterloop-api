package controller

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOfficialPriceForModel(t *testing.T) {
	tests := []struct {
		model       string
		inputUSD    float64
		outputUSD   float64
		cacheRead   float64
		sourceModel string
	}{
		{"codex-auto-review", 2.5, 15, 0.25, "gpt-5.4"},
		{"gpt-5.4-mini", 0.75, 4.5, 0.075, "gpt-5.4-mini"},
		{"gpt-5.5", 5, 30, 0.5, "gpt-5.5"},
		{"gpt-5.6-luna", 1, 6, 0.1, "gpt-5.6-luna"},
		{"gpt-5.6-sol", 5, 30, 0.5, "gpt-5.6-sol"},
		{"gpt-5.6-terra", 2.5, 15, 0.25, "gpt-5.6-terra"},
		{"claude-fable-5", 10, 50, 1, "claude-fable-5"},
		{"claude-haiku-4-5-20251001", 1, 5, 0.1, "claude-haiku-4-5"},
		{"claude-opus-4-5-20251101", 5, 25, 0.5, "claude-opus-4-5"},
		{"claude-opus-4-6", 5, 25, 0.5, "claude-opus-4-6"},
		{"claude-opus-4-7", 5, 25, 0.5, "claude-opus-4-7"},
		{"claude-opus-4-8", 5, 25, 0.5, "claude-opus-4-8"},
		{"claude-sonnet-4-5-20250929", 3, 15, 0.3, "claude-sonnet-4-5"},
		{"claude-sonnet-4-6", 3, 15, 0.3, "claude-sonnet-4-6"},
		{"claude-sonnet-5", 2, 10, 0.2, "claude-sonnet-5"},
	}

	for _, test := range tests {
		t.Run(test.model, func(t *testing.T) {
			price := officialPriceForModel(test.model)
			require.NotNil(t, price)
			assert.Equal(t, test.inputUSD, price.InputUSD)
			assert.Equal(t, test.outputUSD, price.OutputUSD)
			require.NotNil(t, price.CacheReadUSD)
			assert.Equal(t, test.cacheRead, *price.CacheReadUSD)
			assert.Equal(t, test.sourceModel, price.SourceModel)
		})
	}
}

func TestOfficialPriceForUnknownModel(t *testing.T) {
	assert.Nil(t, officialPriceForModel("unknown-model"))
}

func TestClaudeSonnet5IntroductoryPriceIsDateBound(t *testing.T) {
	price := officialPriceForModel("claude-sonnet-5")
	require.NotNil(t, price)
	assert.Equal(t, "2026-08-31", price.EffectiveUntil)
}

func TestGPT56OfficialPriceIncludesCacheWrite(t *testing.T) {
	price := officialPriceForModel("gpt-5.6-sol")
	require.NotNil(t, price)
	require.NotNil(t, price.CacheWriteUSD)
	assert.Equal(t, 6.25, *price.CacheWriteUSD)
}
