package controller

import (
	"math"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestValidateIterLoopPricingRatios(t *testing.T) {
	require.NoError(t, validateIterLoopPricingRatios(0.4, 0.7, 1.0))
	require.Error(t, validateIterLoopPricingRatios(0, 0.7, 1.0))
	require.Error(t, validateIterLoopPricingRatios(0.4, math.NaN(), 1.0))
	require.Error(t, validateIterLoopPricingRatios(0.4, 0.7, 11))
}
