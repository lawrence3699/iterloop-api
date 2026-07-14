package operation_setting

import (
	"strings"

	"github.com/QuantumNous/new-api/setting/config"
)

type IterLoopPricingSetting struct {
	Enabled      bool    `json:"enabled"`
	CodexRatio   float64 `json:"codex_ratio"`
	ClaudeRatio  float64 `json:"claude_ratio"`
	CombinedMode string  `json:"combined_mode"`
}

var iterLoopPricingSetting = IterLoopPricingSetting{
	Enabled:      true,
	CodexRatio:   0.4,
	ClaudeRatio:  0.7,
	CombinedMode: "model-family",
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
	case "combined-standard":
		if IsClaudeModel(modelName) {
			return setting.ClaudeRatio, true
		}
		return setting.CodexRatio, true
	default:
		return 0, false
	}
}
