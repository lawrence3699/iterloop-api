// Copyright (c) 2026 QuantumNous. All Rights Reserved.
// This file is part of new-api (https://github.com/QuantumNous/new-api).
// Licensed under the GNU Affero General Public License v3.0 or later.
// See the LICENSE file in the project root for license terms.

package operation_setting

import "github.com/QuantumNous/new-api/setting/config"

type PaymentSetting struct {
	AmountOptions  []int           `json:"amount_options"`
	AmountDiscount map[int]float64 `json:"amount_discount"` // 充值金额对应的折扣，例如 100 元 0.9 表示 100 元充值享受 9 折优惠

	// Stripe preset catalogs shown per display language. Values are face
	// amounts in the named currency (AUD presets buy that many USD credits
	// 1:1; CNY presets convert to USD credits via the live Price setting).
	// Additive JSON fields: defaults live in code, so no DB seed is needed.
	AudPresets []int `json:"aud_presets"`
	CnyPresets []int `json:"cny_presets"`

	ComplianceConfirmed    bool   `json:"compliance_confirmed"`
	ComplianceTermsVersion string `json:"compliance_terms_version"`
	ComplianceConfirmedAt  int64  `json:"compliance_confirmed_at"`
	ComplianceConfirmedBy  int    `json:"compliance_confirmed_by"`
	ComplianceConfirmedIP  string `json:"compliance_confirmed_ip"`
}

const CurrentComplianceTermsVersion = "v1"

var (
	defaultStripeAudPresets = []int{5, 20, 50}
	defaultStripeCnyPresets = []int{10, 30, 100}
)

// 默认配置
var paymentSetting = PaymentSetting{
	AmountOptions:  []int{10, 25, 50, 100},
	AmountDiscount: map[int]float64{},
	AudPresets:     defaultStripeAudPresets,
	CnyPresets:     defaultStripeCnyPresets,
}

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("payment_setting", &paymentSetting)
}

func GetPaymentSetting() *PaymentSetting {
	return &paymentSetting
}

// GetStripeAudPresets returns the AUD preset catalog, falling back to the
// built-in defaults when the persisted option is empty.
func GetStripeAudPresets() []int {
	if len(paymentSetting.AudPresets) > 0 {
		return paymentSetting.AudPresets
	}
	return defaultStripeAudPresets
}

// GetStripeCnyPresets returns the CNY preset catalog, falling back to the
// built-in defaults when the persisted option is empty.
func GetStripeCnyPresets() []int {
	if len(paymentSetting.CnyPresets) > 0 {
		return paymentSetting.CnyPresets
	}
	return defaultStripeCnyPresets
}

func IsPaymentComplianceConfirmed() bool {
	return paymentSetting.ComplianceConfirmed &&
		paymentSetting.ComplianceTermsVersion == CurrentComplianceTermsVersion
}
