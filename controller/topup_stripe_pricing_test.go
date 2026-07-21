// Copyright (c) 2026 QuantumNous. All Rights Reserved.
// This file is part of new-api (https://github.com/QuantumNous/new-api).
// Licensed under the GNU Affero General Public License v3.0 or later.
// See the LICENSE file in the project root for license terms.

package controller

import (
	"net/http"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupStripePricingTest pins every pricing-relevant global to the verified
// production configuration: AUD, StripeUnitPrice 1.0, Price (¥ per $1) 7.3,
// default preset catalogs and the legacy AmountOptions whitelist.
func setupStripePricingTest(t *testing.T) {
	t.Helper()

	paymentSetting := operation_setting.GetPaymentSetting()
	originalAmountOptions := paymentSetting.AmountOptions
	originalAudPresets := paymentSetting.AudPresets
	originalCnyPresets := paymentSetting.CnyPresets
	originalPrice := operation_setting.Price
	originalUnitPrice := setting.StripeUnitPrice
	originalMinTopUp := setting.StripeMinTopUp
	t.Cleanup(func() {
		paymentSetting.AmountOptions = originalAmountOptions
		paymentSetting.AudPresets = originalAudPresets
		paymentSetting.CnyPresets = originalCnyPresets
		operation_setting.Price = originalPrice
		setting.StripeUnitPrice = originalUnitPrice
		setting.StripeMinTopUp = originalMinTopUp
	})

	paymentSetting.AmountOptions = []int{10, 25, 50, 100}
	paymentSetting.AudPresets = []int{5, 20, 50}
	paymentSetting.CnyPresets = []int{10, 30, 100}
	operation_setting.Price = 7.3
	setting.StripeUnitPrice = 1.0
	setting.StripeMinTopUp = 10
}

func TestResolveStripeOrderPricingBoundsAndPresets(t *testing.T) {
	setupStripePricingTest(t)

	tests := []struct {
		name    string
		req     StripePayRequest
		wantErr string
		want    *stripeOrderPricing
	}{
		{
			name: "legacy whole-credit preset keeps historical arithmetic",
			req:  StripePayRequest{Amount: 10},
			want: &stripeOrderPricing{
				Amount:        10,
				AmountCents:   0,
				Money:         10,
				ExpectedMinor: 1000,
				CreditedQuota: 5_000_000,
			},
		},
		{
			name:    "legacy amount outside whitelist rejected",
			req:     StripePayRequest{Amount: 11},
			wantErr: "请选择管理员配置的固定充值档位",
		},
		{
			name:    "legacy amount below minimum rejected",
			req:     StripePayRequest{Amount: 5},
			wantErr: "充值数量不能小于 10",
		},
		{
			name: "aud preset buys credits one-to-one",
			req:  StripePayRequest{Preset: "aud-5"},
			want: &stripeOrderPricing{
				Amount:        5,
				AmountCents:   500,
				Money:         5,
				ExpectedMinor: 500,
				CreditedQuota: 2_500_000,
			},
		},
		{
			name: "cny 10 preset converts by live Price with half-up cent rounding",
			req:  StripePayRequest{Preset: "cny-10"},
			// 10 * 100 / 7.3 = 136.9863... -> 137 cents = $1.37
			want: &stripeOrderPricing{
				Amount:        1,
				AmountCents:   137,
				Money:         1.37,
				ExpectedMinor: 137,
				CreditedQuota: 685_000,
			},
		},
		{
			name: "cny 30 preset rounds 410.958 cents up to 411",
			req:  StripePayRequest{Preset: "cny-30"},
			want: &stripeOrderPricing{
				Amount:        4,
				AmountCents:   411,
				Money:         4.11,
				ExpectedMinor: 411,
				CreditedQuota: 2_055_000,
			},
		},
		{
			name: "cny 100 preset rounds 1369.863 cents up to 1370",
			req:  StripePayRequest{Preset: "cny-100"},
			want: &stripeOrderPricing{
				Amount:        13,
				AmountCents:   1370,
				Money:         13.7,
				ExpectedMinor: 1370,
				CreditedQuota: 6_850_000,
			},
		},
		{
			name:    "preset outside catalog rejected",
			req:     StripePayRequest{Preset: "aud-7"},
			wantErr: "无效的充值档位",
		},
		{
			name:    "malformed preset rejected",
			req:     StripePayRequest{Preset: "aud5"},
			wantErr: "无效的充值档位",
		},
		{
			name:    "negative preset face rejected",
			req:     StripePayRequest{Preset: "cny--10"},
			wantErr: "无效的充值档位",
		},
		{
			name: "custom cents at the A$1.00 floor accepted",
			req:  StripePayRequest{AmountCents: 100},
			want: &stripeOrderPricing{
				Amount:        1,
				AmountCents:   100,
				Money:         1,
				ExpectedMinor: 100,
				CreditedQuota: 500_000,
			},
		},
		{
			name:    "custom cents below the A$1.00 floor rejected",
			req:     StripePayRequest{AmountCents: 99},
			wantErr: "充值金额不能低于 A$1.00",
		},
		{
			name:    "custom cents above the 10000-credit ceiling rejected",
			req:     StripePayRequest{AmountCents: 1_000_001},
			wantErr: "充值数量不能大于 10000",
		},
		{
			name:    "negative custom cents rejected",
			req:     StripePayRequest{AmountCents: -100},
			wantErr: "充值金额无效",
		},
		{
			name:    "preset and legacy amount are mutually exclusive",
			req:     StripePayRequest{Preset: "aud-5", Amount: 10},
			wantErr: "preset 与 amount/amount_cents 不能同时提供",
		},
		{
			name:    "preset and amount_cents are mutually exclusive",
			req:     StripePayRequest{Preset: "aud-5", AmountCents: 500},
			wantErr: "preset 与 amount/amount_cents 不能同时提供",
		},
		{
			name:    "amount and amount_cents are mutually exclusive",
			req:     StripePayRequest{Amount: 10, AmountCents: 500},
			wantErr: "amount 与 amount_cents 不能同时提供",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := tt.req
			pricing, err := resolveStripeOrderPricing(&req, "default")
			if tt.wantErr != "" {
				require.Error(t, err)
				assert.EqualError(t, err, tt.wantErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want.Amount, pricing.Amount)
			assert.Equal(t, tt.want.AmountCents, pricing.AmountCents)
			assert.InDelta(t, tt.want.Money, pricing.Money, 1e-9)
			assert.Equal(t, tt.want.ExpectedMinor, pricing.ExpectedMinor)
			assert.Equal(t, tt.want.CreditedQuota, pricing.CreditedQuota)
		})
	}
}

// TestResolveStripeOrderPricingRejectsQuotaSaturation asserts a cents order
// whose exact quota exceeds the int32 quota column is rejected instead of
// ever crediting a clamped value (billing safety invariant).
func TestResolveStripeOrderPricingRejectsQuotaSaturation(t *testing.T) {
	setupStripePricingTest(t)

	req := StripePayRequest{AmountCents: 1_000_000} // 10000 credits -> 5e9 quota > MaxInt32
	pricing, err := resolveStripeOrderPricing(&req, "default")
	require.Error(t, err)
	assert.Nil(t, pricing)
	assert.EqualError(t, err, "充值额度超出允许范围")
}

// TestStripeWebhookSettlesCentsPreciseOrder proves a fractional-credit order
// (CNY preset snapshot) settles through the untouched webhook path using the
// exact CreditedQuota snapshot, with AmountCents preserved on the row.
func TestStripeWebhookSettlesCentsPreciseOrder(t *testing.T) {
	setupStripeWebhookTest(t)
	require.NoError(t, model.DB.Create(&model.User{Id: 803, Username: "stripe-cents-user", Status: common.UserStatusEnabled}).Error)
	require.NoError(t, model.DB.Create(&model.TopUp{
		UserId:            803,
		Amount:            1,
		AmountCents:       137,
		Money:             1.37,
		TradeNo:           "stripe-webhook-cents",
		PaymentMethod:     model.PaymentMethodStripe,
		PaymentProvider:   model.PaymentProviderStripe,
		Status:            common.TopUpStatusPending,
		ExpectedAmount:    137,
		Currency:          "AUD",
		CreditedQuota:     685_000,
		ProviderSessionId: "cs_webhook_cents",
	}).Error)

	payload := stripeCheckoutWebhookPayload("evt_webhook_cents", "stripe-webhook-cents", "cs_webhook_cents", "pi_webhook_cents", 137)
	require.Equal(t, http.StatusOK, sendStripeWebhookForTest(payload).Code)

	var user model.User
	require.NoError(t, model.DB.First(&user, 803).Error)
	assert.Equal(t, 685_000, user.Quota)
	var topUp model.TopUp
	require.NoError(t, model.DB.Where("trade_no = ?", "stripe-webhook-cents").First(&topUp).Error)
	assert.Equal(t, common.TopUpStatusSuccess, topUp.Status)
	assert.Equal(t, int64(137), topUp.AmountCents)
}
