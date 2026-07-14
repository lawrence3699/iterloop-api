package controller

import (
	"errors"
	"math"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
)

type iterLoopPricingUpdateRequest struct {
	CodexRatio  float64 `json:"codex_ratio"`
	ClaudeRatio float64 `json:"claude_ratio"`
	GrokRatio   float64 `json:"grok_ratio"`
	Confirm     bool    `json:"confirm"`
}

func validateIterLoopPricingRatios(codexRatio float64, claudeRatio float64, grokRatio float64) error {
	for _, ratio := range []float64{codexRatio, claudeRatio, grokRatio} {
		if math.IsNaN(ratio) || math.IsInf(ratio, 0) || ratio <= 0 || ratio > 10 {
			return errors.New("pricing ratios must be greater than 0 and no more than 10")
		}
	}
	return nil
}

func iterLoopPricingSettingsPayload() gin.H {
	pricing := operation_setting.GetIterLoopPricingSetting()
	return gin.H{
		"enabled":       pricing.Enabled,
		"codex_ratio":   pricing.CodexRatio,
		"claude_ratio":  pricing.ClaudeRatio,
		"grok_ratio":    pricing.GrokRatio,
		"combined_mode": pricing.CombinedMode,
	}
}

func GetIterLoopPricingSettings(c *gin.Context) {
	common.ApiSuccess(c, iterLoopPricingSettingsPayload())
}

func UpdateIterLoopPricingSettings(c *gin.Context) {
	request := &iterLoopPricingUpdateRequest{}
	if err := c.ShouldBindJSON(request); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := validateIterLoopPricingRatios(request.CodexRatio, request.ClaudeRatio, request.GrokRatio); err != nil {
		common.ApiError(c, err)
		return
	}
	current := iterLoopPricingSettingsPayload()
	preview := gin.H{
		"enabled":       true,
		"codex_ratio":   request.CodexRatio,
		"claude_ratio":  request.ClaudeRatio,
		"grok_ratio":    request.GrokRatio,
		"combined_mode": "model-family",
	}
	if !request.Confirm {
		common.ApiSuccess(c, gin.H{"applied": false, "current": current, "preview": preview})
		return
	}
	if err := model.UpdateOptionsBulk(map[string]string{
		"iterloop_pricing_setting.enabled":       "true",
		"iterloop_pricing_setting.codex_ratio":   strconv.FormatFloat(request.CodexRatio, 'f', -1, 64),
		"iterloop_pricing_setting.claude_ratio":  strconv.FormatFloat(request.ClaudeRatio, 'f', -1, 64),
		"iterloop_pricing_setting.grok_ratio":    strconv.FormatFloat(request.GrokRatio, 'f', -1, 64),
		"iterloop_pricing_setting.combined_mode": "model-family",
	}); err != nil {
		common.ApiError(c, err)
		return
	}
	recordManageAudit(c, "iterloop.pricing_update", map[string]interface{}{
		"previous_codex_ratio":  current["codex_ratio"],
		"previous_claude_ratio": current["claude_ratio"],
		"previous_grok_ratio":   current["grok_ratio"],
		"codex_ratio":           request.CodexRatio,
		"claude_ratio":          request.ClaudeRatio,
		"grok_ratio":            request.GrokRatio,
		"combined_mode":         "model-family",
	})
	common.ApiSuccess(c, gin.H{"applied": true, "current": current, "preview": iterLoopPricingSettingsPayload()})
}
