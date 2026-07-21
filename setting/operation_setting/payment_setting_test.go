// Copyright (c) 2026 QuantumNous. All Rights Reserved.
// This file is part of new-api (https://github.com/QuantumNous/new-api).
// Licensed under the GNU Affero General Public License v3.0 or later.
// See the LICENSE file in the project root for license terms.

package operation_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// The preset getters must return the code defaults when the persisted option
// is empty, so a deployment never needs a DB seed to expose valid catalogs.
func TestStripePresetCatalogFallsBackToDefaults(t *testing.T) {
	origAud := paymentSetting.AudPresets
	origCny := paymentSetting.CnyPresets
	t.Cleanup(func() {
		paymentSetting.AudPresets = origAud
		paymentSetting.CnyPresets = origCny
	})

	paymentSetting.AudPresets = nil
	paymentSetting.CnyPresets = nil
	assert.Equal(t, []int{5, 20, 50}, GetStripeAudPresets())
	assert.Equal(t, []int{10, 30, 100}, GetStripeCnyPresets())

	paymentSetting.AudPresets = []int{7}
	paymentSetting.CnyPresets = []int{50}
	assert.Equal(t, []int{7}, GetStripeAudPresets())
	assert.Equal(t, []int{50}, GetStripeCnyPresets())
}
