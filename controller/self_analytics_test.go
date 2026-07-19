package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type selfAnalyticsResponse struct {
	Success bool                `json:"success"`
	Message string              `json:"message"`
	Data    model.SelfAnalytics `json:"data"`
}

func setupSelfAnalyticsControllerTestDB(t *testing.T) {
	t.Helper()
	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.Log{}))
	require.NoError(t, db.Create(&[]model.Log{
		{UserId: 1, Type: model.LogTypeConsume, CreatedAt: 1000, TokenId: 11, ModelName: "gpt-5.5", PromptTokens: 10, CompletionTokens: 2, Quota: 6, Other: `{"cache_tokens":4}`},
		{UserId: 2, Type: model.LogTypeConsume, CreatedAt: 1000, TokenId: 11, ModelName: "private-model", PromptTokens: 100, CompletionTokens: 100, Quota: 100},
	}).Error)
}

func runSelfAnalyticsRequest(t *testing.T, target string, userID int) selfAnalyticsResponse {
	t.Helper()
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("id", userID)
	ctx.Request = httptest.NewRequest(http.MethodGet, target, nil)

	GetSelfAnalytics(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var payload selfAnalyticsResponse
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &payload))
	return payload
}

func TestGetSelfAnalyticsReturnsOnlyAuthenticatedUserAggregation(t *testing.T) {
	setupSelfAnalyticsControllerTestDB(t)
	payload := runSelfAnalyticsRequest(t, "/api/data/self/analytics?start_timestamp=900&end_timestamp=1100", 1)
	require.True(t, payload.Success, payload.Message)
	assert.Equal(t, model.SelfAnalyticsTotals{InputTokens: 10, OutputTokens: 2, CachedTokens: 4, Requests: 1, Quota: 6}, payload.Data.Totals)
	require.Len(t, payload.Data.Models, 1)
	assert.Equal(t, "gpt-5.5", payload.Data.Models[0].ModelName)
}

func TestGetSelfAnalyticsValidatesRangeAndTokenFilter(t *testing.T) {
	setupSelfAnalyticsControllerTestDB(t)
	tests := []struct {
		target  string
		message string
	}{
		{"/api/data/self/analytics?start_timestamp=bad&end_timestamp=1100", "invalid start_timestamp"},
		{"/api/data/self/analytics?start_timestamp=1100&end_timestamp=900", "invalid time range"},
		{"/api/data/self/analytics?start_timestamp=1&end_timestamp=2678402", "time range cannot exceed 31 days"},
		{"/api/data/self/analytics?start_timestamp=900&end_timestamp=1100&token_id=0", "invalid token_id"},
	}
	for _, test := range tests {
		t.Run(test.message, func(t *testing.T) {
			payload := runSelfAnalyticsRequest(t, test.target, 1)
			assert.False(t, payload.Success)
			assert.Equal(t, test.message, payload.Message)
		})
	}
}
