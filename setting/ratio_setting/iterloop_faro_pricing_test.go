package ratio_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type faroPriceExpectation struct {
	input       float64
	output      float64
	cache       float64
	cacheCreate *float64
}

func floatPointer(value float64) *float64 {
	return &value
}

func TestIterLoopFaroPricingDefaults(t *testing.T) {
	InitRatioSettings()
	assert.Equal(t, 1.0, GetGroupRatio("codex-standard"))
	assert.Equal(t, 1.0, GetGroupRatio("claude-standard"))
	assert.Equal(t, 1.0, GetGroupRatio("combined-standard"))

	expected := map[string]faroPriceExpectation{
		"codex-auto-review":          {0.787, 4.722, 0.263, nil},
		"gpt-5.4":                    {0.787, 4.722, 0.263, nil},
		"gpt-5.4-mini":               {0.787, 4.722, 0.263, nil},
		"gpt-5.5":                    {1.4, 11.2, 0.438, nil},
		"gpt-5.6-luna":               {0.35, 2.8, 0.175, nil},
		"gpt-5.6-sol":                {1.4, 11.2, 0.438, nil},
		"gpt-5.6-terra":              {0.787, 6.3, 0.263, nil},
		"claude-fable-5":             {12, 60, 1.2, floatPointer(10)},
		"claude-haiku-4-5-20251001":  {1.4, 7, 0.175, floatPointer(2.19)},
		"claude-opus-4-5-20251101":   {7, 35, 0.875, floatPointer(8.75)},
		"claude-opus-4-6":            {7, 35, 0.875, floatPointer(8.75)},
		"claude-opus-4-7":            {7, 35, 0.875, floatPointer(8.75)},
		"claude-opus-4-8":            {7, 35, 0.875, floatPointer(8.75)},
		"claude-sonnet-4-5-20250929": {4.2, 21, 0.525, floatPointer(5.25)},
		"claude-sonnet-4-6":          {4.2, 21, 0.525, floatPointer(5.25)},
		"claude-sonnet-5":            {4.2, 21, 0.525, floatPointer(5.25)},
	}

	for model, want := range expected {
		t.Run(model, func(t *testing.T) {
			ratio, ok, _ := GetModelRatio(model)
			require.True(t, ok)
			input := ratio * 2
			assert.InDelta(t, want.input, input, 0.000001)
			assert.InDelta(t, want.output, input*GetCompletionRatio(model), 0.000001)

			cacheRatio, ok := GetCacheRatio(model)
			require.True(t, ok)
			assert.InDelta(t, want.cache, input*cacheRatio, 0.000001)

			createRatio, hasCreate := GetCreateCacheRatio(model)
			if want.cacheCreate == nil {
				assert.False(t, hasCreate)
				return
			}
			require.True(t, hasCreate)
			assert.InDelta(t, *want.cacheCreate, input*createRatio, 0.000001)
		})
	}
}
