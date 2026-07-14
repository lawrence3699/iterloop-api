package billing_setting

import (
	"testing"

	"github.com/QuantumNous/new-api/pkg/billingexpr"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestIterLoopGrokBillingDefaults(t *testing.T) {
	for model, expression := range map[string]string{
		"grok-4.5": Grok45BillingExpr,
		"grok-4.3": Grok43BillingExpr,
	} {
		assert.Equal(t, BillingModeTieredExpr, GetBillingMode(model))
		actual, ok := GetBillingExpr(model)
		require.True(t, ok)
		assert.Equal(t, expression, actual)
		require.NoError(t, SmokeTestExpr(expression))
	}
}

func TestIterLoopGrokBillingBoundaryAndCache(t *testing.T) {
	standard, trace, err := billingexpr.RunExpr(Grok45BillingExpr, billingexpr.TokenParams{
		P: 199_900, C: 1_000, CR: 100, Len: 200_000,
	})
	require.NoError(t, err)
	assert.Equal(t, "standard", trace.MatchedTier)
	assert.Equal(t, 405_850.0, standard)

	longContext, trace, err := billingexpr.RunExpr(Grok45BillingExpr, billingexpr.TokenParams{
		P: 199_901, C: 1_000, CR: 100, Len: 200_001,
	})
	require.NoError(t, err)
	assert.Equal(t, "long_context", trace.MatchedTier)
	assert.Equal(t, 811_704.0, longContext)
}
