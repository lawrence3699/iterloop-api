package controller

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

type upstreamAccountSummary struct {
	Total         int `json:"total"`
	Active        int `json:"active"`
	Disabled      int `json:"disabled"`
	Error         int `json:"error"`
	Unavailable   int `json:"unavailable"`
	Codex         int `json:"codex"`
	Claude        int `json:"claude"`
	XAI           int `json:"xai"`
	XAIActive     int `json:"xai_active"`
	XAIFailed     int `json:"xai_failed"`
	SpendingLimit int `json:"xai_spending_limit"`
}

type upstreamQuotaSummary struct {
	Queried                  int      `json:"queried"`
	Failed                   int      `json:"failed"`
	BelowThirty              int      `json:"below_thirty"`
	Exhausted                int      `json:"exhausted"`
	FiveHourAverageRemaining *float64 `json:"five_hour_average_remaining,omitempty"`
	WeeklyAverageRemaining   *float64 `json:"weekly_average_remaining,omitempty"`
	FiveHourMinimumRemaining *float64 `json:"five_hour_minimum_remaining,omitempty"`
	WeeklyMinimumRemaining   *float64 `json:"weekly_minimum_remaining,omitempty"`
}

type upstreamHealthResponse struct {
	Configured bool                   `json:"configured"`
	Accounts   upstreamAccountSummary `json:"accounts"`
	Quota      *upstreamQuotaSummary  `json:"quota,omitempty"`
	UpdatedAt  int64                  `json:"updated_at"`
	Message    string                 `json:"message,omitempty"`
}

type upstreamHealthCache struct {
	sync.RWMutex
	value     upstreamHealthResponse
	expiresAt time.Time
}

var iterLoopUpstreamCache upstreamHealthCache

func managementConfig() (string, string) {
	base := strings.TrimRight(strings.TrimSpace(os.Getenv("ITERLOOP_UPSTREAM_MANAGEMENT_URL")), "/")
	key := strings.TrimSpace(os.Getenv("ITERLOOP_UPSTREAM_MANAGEMENT_KEY"))
	return base, key
}

func managementRequest(ctx context.Context, client *http.Client, method string, url string, key string, body any) (map[string]any, error) {
	var reader io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reader = bytes.NewReader(raw)
	}
	request, err := http.NewRequestWithContext(ctx, method, url, reader)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Authorization", "Bearer "+key)
	request.Header.Set("Content-Type", "application/json")
	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(response.Body, 8<<20))
	if err != nil {
		return nil, err
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, errors.New("upstream management request failed: " + response.Status)
	}
	data := map[string]any{}
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &data); err != nil {
			return nil, err
		}
	}
	return data, nil
}

func mapValue(node map[string]any, keys ...string) map[string]any {
	for _, key := range keys {
		if value, ok := node[key].(map[string]any); ok {
			return value
		}
	}
	return nil
}

func stringValue(node map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := node[key].(string); ok {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func boolValue(node map[string]any, keys ...string) bool {
	for _, key := range keys {
		if value, ok := node[key].(bool); ok {
			return value
		}
	}
	return false
}

func floatValue(node map[string]any, keys ...string) (float64, bool) {
	for _, key := range keys {
		switch value := node[key].(type) {
		case float64:
			return value, true
		case json.Number:
			parsed, err := value.Float64()
			return parsed, err == nil
		}
	}
	return 0, false
}

func parseBodyObject(value any) map[string]any {
	switch body := value.(type) {
	case map[string]any:
		return body
	case string:
		parsed := map[string]any{}
		if json.Unmarshal([]byte(body), &parsed) == nil {
			return parsed
		}
	}
	return nil
}

func upstreamProvider(file map[string]any) string {
	provider := strings.ToLower(stringValue(file, "provider", "type"))
	return strings.ReplaceAll(provider, "_", "-")
}

func upstreamFileUnavailable(file map[string]any) bool {
	return boolValue(file, "disabled") || boolValue(file, "unavailable")
}

func upstreamFileContains(file map[string]any, needle string) bool {
	needle = strings.ToLower(strings.TrimSpace(needle))
	if needle == "" {
		return false
	}
	for _, key := range []string{"status", "state", "status_message", "error", "message"} {
		value, ok := file[key]
		if !ok || value == nil {
			continue
		}
		raw, err := json.Marshal(value)
		if err == nil && strings.Contains(strings.ToLower(string(raw)), needle) {
			return true
		}
	}
	return false
}

func aggregateAccounts(files []map[string]any) upstreamAccountSummary {
	summary := upstreamAccountSummary{}
	for _, file := range files {
		provider := upstreamProvider(file)
		if provider != "codex" && provider != "claude" && provider != "xai" {
			continue
		}
		summary.Total++
		if provider == "codex" {
			summary.Codex++
		} else if provider == "claude" {
			summary.Claude++
		} else {
			summary.XAI++
		}
		status := strings.ToLower(stringValue(file, "status", "state"))
		spendingLimit := provider == "xai" && upstreamFileContains(file, "spending-limit")
		if spendingLimit {
			summary.SpendingLimit++
		}
		if boolValue(file, "disabled") || status == "disabled" {
			summary.Disabled++
			if provider == "xai" {
				summary.XAIFailed++
			}
			continue
		}
		if boolValue(file, "unavailable") || status == "unavailable" {
			summary.Unavailable++
			if provider == "xai" {
				summary.XAIFailed++
			}
			continue
		}
		if status == "error" || stringValue(file, "status_message", "error") != "" || spendingLimit {
			summary.Error++
			if provider == "xai" {
				summary.XAIFailed++
			}
			continue
		}
		summary.Active++
		if provider == "xai" {
			summary.XAIActive++
		}
	}
	return summary
}

func codexRemaining(body map[string]any) (*float64, *float64) {
	rate := mapValue(body, "rate_limit", "rateLimit")
	if rate == nil {
		return nil, nil
	}
	remaining := func(window map[string]any) *float64 {
		if window == nil {
			return nil
		}
		used, ok := floatValue(window, "used_percent", "usedPercent")
		if !ok {
			return nil
		}
		value := 100 - used
		if value < 0 {
			value = 0
		}
		if value > 100 {
			value = 100
		}
		return &value
	}
	return remaining(mapValue(rate, "primary_window", "primaryWindow")), remaining(mapValue(rate, "secondary_window", "secondaryWindow"))
}

func claudeRemaining(body map[string]any) (*float64, *float64) {
	remaining := func(window map[string]any) *float64 {
		if window == nil {
			return nil
		}
		used, ok := floatValue(window, "utilization", "percent")
		if !ok {
			return nil
		}
		value := 100 - used
		if value < 0 {
			value = 0
		}
		if value > 100 {
			value = 100
		}
		return &value
	}
	return remaining(mapValue(body, "five_hour")), remaining(mapValue(body, "seven_day"))
}

func quotaPayload(file map[string]any) (map[string]any, string, error) {
	authIndex := stringValue(file, "auth_index", "authIndex")
	if authIndex == "" {
		return nil, "", errors.New("missing auth index")
	}
	provider := upstreamProvider(file)
	header := map[string]any{"Authorization": "Bearer $TOKEN$", "Content-Type": "application/json"}
	url := ""
	if provider == "codex" {
		url = "https://chatgpt.com/backend-api/wham/usage"
		header["User-Agent"] = "codex_cli_rs/0.76.0 (IterLoop API quota monitor)"
		idToken := mapValue(file, "id_token")
		accountId := stringValue(idToken, "chatgpt_account_id")
		if accountId == "" {
			accountId = stringValue(file, "chatgpt_account_id", "account_id")
		}
		if accountId != "" {
			header["Chatgpt-Account-Id"] = accountId
		}
	} else if provider == "claude" {
		url = "https://api.anthropic.com/api/oauth/usage"
		header["anthropic-beta"] = "oauth-2025-04-20"
	} else {
		return nil, provider, errors.New("unsupported provider")
	}
	return map[string]any{"authIndex": authIndex, "method": "GET", "url": url, "header": header}, provider, nil
}

func aggregateQuota(ctx context.Context, client *http.Client, base string, key string, files []map[string]any) *upstreamQuotaSummary {
	type result struct {
		five, weekly *float64
		err          error
	}
	jobs := make(chan map[string]any)
	results := make(chan result)
	workers := 8
	if len(files) < workers {
		workers = len(files)
	}
	var waitGroup sync.WaitGroup
	for index := 0; index < workers; index++ {
		waitGroup.Add(1)
		go func() {
			defer waitGroup.Done()
			for file := range jobs {
				if upstreamFileUnavailable(file) {
					continue
				}
				payload, provider, err := quotaPayload(file)
				if err != nil {
					results <- result{err: err}
					continue
				}
				response, err := managementRequest(ctx, client, http.MethodPost, base+"/v0/management/api-call", key, payload)
				if err != nil {
					results <- result{err: err}
					continue
				}
				status, ok := floatValue(response, "status_code")
				if ok && (status < 200 || status >= 300) {
					results <- result{err: errors.New("quota probe failed")}
					continue
				}
				body := parseBodyObject(response["body"])
				if body == nil {
					results <- result{err: errors.New("invalid quota response")}
					continue
				}
				var five, weekly *float64
				if provider == "codex" {
					five, weekly = codexRemaining(body)
				} else {
					five, weekly = claudeRemaining(body)
				}
				results <- result{five: five, weekly: weekly}
			}
		}()
	}
	go func() {
		defer close(jobs)
		for _, file := range files {
			select {
			case jobs <- file:
			case <-ctx.Done():
				return
			}
		}
	}()
	go func() {
		waitGroup.Wait()
		close(results)
	}()

	summary := &upstreamQuotaSummary{}
	fiveValues := make([]float64, 0)
	weeklyValues := make([]float64, 0)
	for item := range results {
		if item.err != nil {
			summary.Failed++
			continue
		}
		summary.Queried++
		lowest := 101.0
		if item.five != nil {
			fiveValues = append(fiveValues, *item.five)
			if *item.five < lowest {
				lowest = *item.five
			}
		}
		if item.weekly != nil {
			weeklyValues = append(weeklyValues, *item.weekly)
			if *item.weekly < lowest {
				lowest = *item.weekly
			}
		}
		if lowest <= 0 {
			summary.Exhausted++
		}
		if lowest < 30 {
			summary.BelowThirty++
		}
	}
	averageAndMinimum := func(values []float64) (*float64, *float64) {
		if len(values) == 0 {
			return nil, nil
		}
		total, minimum := 0.0, values[0]
		for _, value := range values {
			total += value
			if value < minimum {
				minimum = value
			}
		}
		average := total / float64(len(values))
		return &average, &minimum
	}
	summary.FiveHourAverageRemaining, summary.FiveHourMinimumRemaining = averageAndMinimum(fiveValues)
	summary.WeeklyAverageRemaining, summary.WeeklyMinimumRemaining = averageAndMinimum(weeklyValues)
	return summary
}

func loadUpstreamHealth(includeQuota bool) (upstreamHealthResponse, error) {
	base, key := managementConfig()
	if base == "" || key == "" {
		return upstreamHealthResponse{Configured: false, UpdatedAt: common.GetTimestamp(), Message: "upstream management endpoint is not configured"}, nil
	}
	client := &http.Client{Timeout: 125 * time.Second}
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	data, err := managementRequest(ctx, client, http.MethodGet, base+"/v0/management/auth-files", key, nil)
	if err != nil {
		return upstreamHealthResponse{}, err
	}
	rawFiles, _ := data["files"].([]any)
	files := make([]map[string]any, 0, len(rawFiles))
	quotaFiles := make([]map[string]any, 0, len(rawFiles))
	for _, raw := range rawFiles {
		if file, ok := raw.(map[string]any); ok {
			provider := upstreamProvider(file)
			if provider == "codex" || provider == "claude" || provider == "xai" {
				files = append(files, file)
			}
			if provider == "codex" || provider == "claude" {
				quotaFiles = append(quotaFiles, file)
			}
		}
	}
	response := upstreamHealthResponse{Configured: true, Accounts: aggregateAccounts(files), UpdatedAt: common.GetTimestamp()}
	if includeQuota {
		response.Quota = aggregateQuota(ctx, client, base, key, quotaFiles)
	}
	return response, nil
}

func GetIterLoopUpstreamHealth(c *gin.Context) {
	includeQuota := c.Query("refresh_quota") == "1"
	if !includeQuota {
		iterLoopUpstreamCache.RLock()
		if time.Now().Before(iterLoopUpstreamCache.expiresAt) {
			value := iterLoopUpstreamCache.value
			iterLoopUpstreamCache.RUnlock()
			common.ApiSuccess(c, value)
			return
		}
		iterLoopUpstreamCache.RUnlock()
	}
	value, err := loadUpstreamHealth(includeQuota)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	iterLoopUpstreamCache.Lock()
	iterLoopUpstreamCache.value = value
	iterLoopUpstreamCache.expiresAt = time.Now().Add(5 * time.Minute)
	iterLoopUpstreamCache.Unlock()
	common.ApiSuccess(c, value)
}
