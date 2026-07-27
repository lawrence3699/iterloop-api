package operation_setting

import (
	"strings"

	"github.com/QuantumNous/new-api/setting/config"
)

type IterLoopPricingSetting struct {
	Enabled         bool    `json:"enabled"`
	CodexRatio      float64 `json:"codex_ratio"`
	ClaudeRatio     float64 `json:"claude_ratio"`
	GrokRatio       float64 `json:"grok_ratio"`
	CombinedMode    string  `json:"combined_mode"`
	CNYExchangeRate float64 `json:"cny_exchange_rate"`
	AUDExchangeRate float64 `json:"aud_exchange_rate"`
	ReferenceURL    string  `json:"reference_url"`
	ReferenceDate   string  `json:"reference_date"`
}

var iterLoopPricingSetting = IterLoopPricingSetting{
	Enabled:         true,
	CodexRatio:      1.0,
	ClaudeRatio:     1.0,
	GrokRatio:       1.0,
	CombinedMode:    "model-family",
	CNYExchangeRate: 7.3,
	AUDExchangeRate: 1.52,
	ReferenceURL:    "https://faroapi.com/pricing",
	ReferenceDate:   "2026-07-19",
}

func init() {
	config.GlobalConfig.Register("iterloop_pricing_setting", &iterLoopPricingSetting)
}

func GetIterLoopPricingSetting() *IterLoopPricingSetting {
	return &iterLoopPricingSetting
}

func IsClaudeModel(modelName string) bool {
	return strings.Contains(strings.ToLower(strings.TrimSpace(modelName)), "claude")
}

func IsGrokModel(modelName string) bool {
	return strings.HasPrefix(strings.ToLower(strings.TrimSpace(modelName)), "grok-")
}

func GetIterLoopGroupModelRatio(group string, modelName string) (float64, bool) {
	setting := GetIterLoopPricingSetting()
	if !setting.Enabled {
		return 0, false
	}
	switch strings.ToLower(strings.TrimSpace(group)) {
	case "codex-standard":
		return setting.CodexRatio, true
	case "claude-standard":
		return setting.ClaudeRatio, true
	case "grok-standard":
		return setting.GrokRatio, true
	case "combined-standard":
		if IsClaudeModel(modelName) {
			return setting.ClaudeRatio, true
		}
		if IsGrokModel(modelName) {
			return setting.GrokRatio, true
		}
		return setting.CodexRatio, true
	default:
		return 0, false
	}
}
