package controller

import (
	"math"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestValidateIterLoopPricingRatios(t *testing.T) {
	require.NoError(t, validateIterLoopPricingRatios(0.4, 0.7))
	require.Error(t, validateIterLoopPricingRatios(0, 0.7))
	require.Error(t, validateIterLoopPricingRatios(0.4, math.NaN()))
	require.Error(t, validateIterLoopPricingRatios(0.4, 11))
}
