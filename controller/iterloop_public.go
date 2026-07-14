package controller

import (
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/billing_setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
)

func IterLoopHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"service": "iterloop-api",
		"time":    common.GetTimestamp(),
	})
}

func IterLoopPricing(c *gin.Context) {
	pricing := operation_setting.GetIterLoopPricingSetting()
	c.JSON(http.StatusOK, gin.H{
		"schema_version":  "2026-07-14",
		"kind":            "iterloop.public_pricing_snapshot",
		"currency":        "CNY",
		"currency_symbol": "¥",
		"quota_per_unit":  common.QuotaPerUnit,
		"groups": gin.H{
			"codex-standard":  gin.H{"ratio": pricing.CodexRatio, "provider": "OpenAI-compatible"},
			"claude-standard": gin.H{"ratio": pricing.ClaudeRatio, "provider": "Anthropic-compatible"},
			"grok-standard":   gin.H{"ratio": pricing.GrokRatio, "provider": "xAI"},
			"combined-standard": gin.H{
				"codex_ratio": pricing.CodexRatio, "claude_ratio": pricing.ClaudeRatio, "grok_ratio": pricing.GrokRatio,
				"mode": pricing.CombinedMode,
			},
		},
		"models": gin.H{
			"grok-4.5": gin.H{"provider": "xAI", "billing_mode": billing_setting.BillingModeTieredExpr, "billing_expr": billing_setting.Grok45BillingExpr, "group": "grok-standard"},
			"grok-4.3": gin.H{"provider": "xAI", "billing_mode": billing_setting.BillingModeTieredExpr, "billing_expr": billing_setting.Grok43BillingExpr, "group": "grok-standard"},
		},
		"endpoints": gin.H{
			"responses":        "/v1/responses",
			"chat_completions": "/v1/chat/completions",
			"messages":         "/v1/messages",
			"models":           "/v1/models",
		},
		"websockets":   false,
		"hosted_tools": gin.H{"web_search": false, "x_search": false},
	})
}

func IterLoopAPICatalog(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"linkset": []gin.H{{
			"anchor":       "https://api.iter-loop.com",
			"service-desc": []gin.H{{"href": "https://api.iter-loop.com/openapi.json", "type": "application/json"}},
			"service-meta": []gin.H{{"href": "https://api.iter-loop.com/pricing.json", "type": "application/json"}},
			"status":       []gin.H{{"href": "https://api.iter-loop.com/healthz", "type": "application/json"}},
		}},
	})
}

func IterLoopOpenAPI(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"openapi": "3.1.0",
		"info": gin.H{
			"title":       "IterLoop API",
			"version":     "2026-07-14",
			"description": "OpenAI- and Anthropic-compatible model gateway for governed Codex, Claude, and Grok access.",
		},
		"servers": []gin.H{{"url": "https://api.iter-loop.com"}},
		"components": gin.H{
			"securitySchemes": gin.H{
				"bearerAuth": gin.H{"type": "http", "scheme": "bearer", "bearerFormat": "IterLoop API key"},
			},
		},
		"security": []gin.H{{"bearerAuth": []string{}}},
		"paths": gin.H{
			"/v1/models":           gin.H{"get": openAPIOperation("List available models", false)},
			"/v1/responses":        gin.H{"post": openAPIOperation("Create an OpenAI Responses-compatible response", true)},
			"/v1/chat/completions": gin.H{"post": openAPIOperation("Create an OpenAI Chat Completions-compatible response", true)},
			"/v1/messages":         gin.H{"post": openAPIOperation("Create an Anthropic Messages-compatible response", true)},
		},
	})
}

func openAPIOperation(summary string, hasBody bool) gin.H {
	operation := gin.H{
		"summary": summary,
		"responses": gin.H{
			"200": gin.H{"description": "Successful response or SSE stream"},
			"400": gin.H{"description": "Invalid request"},
			"401": gin.H{"description": "Missing or invalid API key"},
			"403": gin.H{"description": "Key policy rejected the model, IP, expiry, or quota"},
		},
	}
	if hasBody {
		operation["requestBody"] = gin.H{
			"required": true,
			"content":  gin.H{"application/json": gin.H{"schema": gin.H{"type": "object", "additionalProperties": true}}},
		}
	}
	return operation
}
