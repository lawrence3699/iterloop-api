package model

import (
	"sort"

	"github.com/QuantumNous/new-api/common"
)

type SelfAnalyticsTotals struct {
	InputTokens  int64 `json:"input_tokens"`
	OutputTokens int64 `json:"output_tokens"`
	CachedTokens int64 `json:"cached_tokens"`
	Requests     int64 `json:"requests"`
	Quota        int64 `json:"quota"`
}

type SelfAnalyticsTrendPoint struct {
	Timestamp    int64 `json:"timestamp"`
	InputTokens  int64 `json:"input_tokens"`
	OutputTokens int64 `json:"output_tokens"`
	CachedTokens int64 `json:"cached_tokens"`
	Requests     int64 `json:"requests"`
	Quota        int64 `json:"quota"`
}

type SelfAnalyticsModelPoint struct {
	ModelName    string `json:"model_name"`
	InputTokens  int64  `json:"input_tokens"`
	OutputTokens int64  `json:"output_tokens"`
	CachedTokens int64  `json:"cached_tokens"`
	Requests     int64  `json:"requests"`
	Quota        int64  `json:"quota"`
}

type SelfAnalyticsTokenPoint struct {
	TokenID  int   `json:"token_id"`
	Requests int64 `json:"requests"`
	Quota    int64 `json:"quota"`
}

type SelfAnalytics struct {
	Totals  SelfAnalyticsTotals       `json:"totals"`
	Trend   []SelfAnalyticsTrendPoint `json:"trend"`
	Models  []SelfAnalyticsModelPoint `json:"models"`
	ByToken []SelfAnalyticsTokenPoint `json:"by_token"`
}

type selfAnalyticsLogOther struct {
	CacheTokens int64 `json:"cache_tokens"`
}

// GetSelfAnalytics aggregates consume-log metadata for one authenticated user.
// It deliberately selects no prompt, response, content, IP, channel, request ID,
// or administrator-only fields.
func GetSelfAnalytics(userID int, startTimestamp int64, endTimestamp int64, tokenID *int) (SelfAnalytics, error) {
	rows := make([]Log, 0)
	query := LOG_DB.Model(&Log{}).
		Select("created_at, model_name, prompt_tokens, completion_tokens, quota, token_id, other").
		Where("user_id = ? AND type = ? AND created_at >= ? AND created_at <= ?", userID, LogTypeConsume, startTimestamp, endTimestamp)
	if tokenID != nil {
		query = query.Where("token_id = ?", *tokenID)
	}
	if err := query.Find(&rows).Error; err != nil {
		return SelfAnalytics{}, err
	}

	result := SelfAnalytics{
		Trend:   make([]SelfAnalyticsTrendPoint, 0),
		Models:  make([]SelfAnalyticsModelPoint, 0),
		ByToken: make([]SelfAnalyticsTokenPoint, 0),
	}
	trendByHour := make(map[int64]*SelfAnalyticsTrendPoint)
	modelsByName := make(map[string]*SelfAnalyticsModelPoint)
	tokensByID := make(map[int]*SelfAnalyticsTokenPoint)

	for index := range rows {
		row := rows[index]
		cachedTokens := int64(0)
		if row.Other != "" {
			var other selfAnalyticsLogOther
			if err := common.UnmarshalJsonStr(row.Other, &other); err == nil && other.CacheTokens > 0 {
				cachedTokens = other.CacheTokens
			}
		}

		inputTokens := int64(row.PromptTokens)
		outputTokens := int64(row.CompletionTokens)
		quota := int64(row.Quota)
		result.Totals.InputTokens += inputTokens
		result.Totals.OutputTokens += outputTokens
		result.Totals.CachedTokens += cachedTokens
		result.Totals.Requests++
		result.Totals.Quota += quota

		hour := row.CreatedAt - row.CreatedAt%3600
		trendPoint, ok := trendByHour[hour]
		if !ok {
			trendPoint = &SelfAnalyticsTrendPoint{Timestamp: hour}
			trendByHour[hour] = trendPoint
		}
		trendPoint.InputTokens += inputTokens
		trendPoint.OutputTokens += outputTokens
		trendPoint.CachedTokens += cachedTokens
		trendPoint.Requests++
		trendPoint.Quota += quota

		modelName := row.ModelName
		if modelName == "" {
			modelName = "unknown"
		}
		modelPoint, ok := modelsByName[modelName]
		if !ok {
			modelPoint = &SelfAnalyticsModelPoint{ModelName: modelName}
			modelsByName[modelName] = modelPoint
		}
		modelPoint.InputTokens += inputTokens
		modelPoint.OutputTokens += outputTokens
		modelPoint.CachedTokens += cachedTokens
		modelPoint.Requests++
		modelPoint.Quota += quota

		tokenPoint, ok := tokensByID[row.TokenId]
		if !ok {
			tokenPoint = &SelfAnalyticsTokenPoint{TokenID: row.TokenId}
			tokensByID[row.TokenId] = tokenPoint
		}
		tokenPoint.Requests++
		tokenPoint.Quota += quota
	}

	for _, point := range trendByHour {
		result.Trend = append(result.Trend, *point)
	}
	sort.Slice(result.Trend, func(i int, j int) bool {
		return result.Trend[i].Timestamp < result.Trend[j].Timestamp
	})

	for _, point := range modelsByName {
		result.Models = append(result.Models, *point)
	}
	sort.Slice(result.Models, func(i int, j int) bool {
		if result.Models[i].Quota == result.Models[j].Quota {
			return result.Models[i].ModelName < result.Models[j].ModelName
		}
		return result.Models[i].Quota > result.Models[j].Quota
	})

	for _, point := range tokensByID {
		result.ByToken = append(result.ByToken, *point)
	}
	sort.Slice(result.ByToken, func(i int, j int) bool {
		return result.ByToken[i].TokenID < result.ByToken[j].TokenID
	})

	return result, nil
}
