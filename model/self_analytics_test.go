package model

import (
	"fmt"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupSelfAnalyticsTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	originalDB := DB
	originalLogDB := LOG_DB
	originalMainDatabaseType := common.MainDatabaseType()
	originalLogDatabaseType := common.LogDatabaseType()
	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&Log{}))
	DB = db
	LOG_DB = db
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)

	t.Cleanup(func() {
		DB = originalDB
		LOG_DB = originalLogDB
		common.SetDatabaseTypes(originalMainDatabaseType, originalLogDatabaseType)
		sqlDB, dbErr := db.DB()
		if dbErr == nil {
			require.NoError(t, sqlDB.Close())
		}
	})
	return db
}

func TestGetSelfAnalyticsAggregatesCurrentUserAndCacheMetadata(t *testing.T) {
	db := setupSelfAnalyticsTestDB(t)
	logs := []Log{
		{UserId: 7, Type: LogTypeConsume, CreatedAt: 3700, TokenId: 11, ModelName: "gpt-5.5", PromptTokens: 100, CompletionTokens: 20, Quota: 60, Other: `{"cache_tokens":40,"admin_info":{"use_channel":[1]}}`},
		{UserId: 7, Type: LogTypeConsume, CreatedAt: 3900, TokenId: 22, ModelName: "gpt-5.5", PromptTokens: 50, CompletionTokens: 10, Quota: 30, Other: `{"cache_tokens":10}`},
		{UserId: 7, Type: LogTypeConsume, CreatedAt: 7300, TokenId: 11, ModelName: "claude-fable-5", PromptTokens: 80, CompletionTokens: 40, Quota: 90, Other: "not-json"},
		{UserId: 8, Type: LogTypeConsume, CreatedAt: 3800, TokenId: 11, ModelName: "private-model", PromptTokens: 999, CompletionTokens: 999, Quota: 999, Other: `{"cache_tokens":999}`},
		{UserId: 7, Type: LogTypeError, CreatedAt: 3800, TokenId: 11, ModelName: "failed-model", PromptTokens: 999, CompletionTokens: 999, Quota: 999},
	}
	require.NoError(t, db.Create(&logs).Error)

	analytics, err := GetSelfAnalytics(7, 3600, 8000, nil)
	require.NoError(t, err)
	assert.Equal(t, SelfAnalyticsTotals{InputTokens: 230, OutputTokens: 70, CachedTokens: 50, Requests: 3, Quota: 180}, analytics.Totals)
	require.Len(t, analytics.Trend, 2)
	assert.EqualValues(t, 3600, analytics.Trend[0].Timestamp)
	assert.EqualValues(t, 2, analytics.Trend[0].Requests)
	assert.EqualValues(t, 7200, analytics.Trend[1].Timestamp)
	require.Len(t, analytics.Models, 2)
	assert.Equal(t, "claude-fable-5", analytics.Models[0].ModelName)
	assert.EqualValues(t, 90, analytics.Models[0].Quota)
	assert.Equal(t, "gpt-5.5", analytics.Models[1].ModelName)
	assert.Equal(t, []SelfAnalyticsTokenPoint{{TokenID: 11, Requests: 2, Quota: 150}, {TokenID: 22, Requests: 1, Quota: 30}}, analytics.ByToken)
}

func TestGetSelfAnalyticsFiltersByOwnedTokenWithinUserScope(t *testing.T) {
	db := setupSelfAnalyticsTestDB(t)
	require.NoError(t, db.Create(&[]Log{
		{UserId: 7, Type: LogTypeConsume, CreatedAt: 3700, TokenId: 11, ModelName: "gpt-5.5", PromptTokens: 10, CompletionTokens: 2, Quota: 6},
		{UserId: 7, Type: LogTypeConsume, CreatedAt: 3700, TokenId: 22, ModelName: "claude-fable-5", PromptTokens: 20, CompletionTokens: 4, Quota: 12},
		{UserId: 8, Type: LogTypeConsume, CreatedAt: 3700, TokenId: 11, ModelName: "private-model", PromptTokens: 100, CompletionTokens: 100, Quota: 100},
	}).Error)

	tokenID := 11
	analytics, err := GetSelfAnalytics(7, 3600, 7200, &tokenID)
	require.NoError(t, err)
	assert.Equal(t, SelfAnalyticsTotals{InputTokens: 10, OutputTokens: 2, Requests: 1, Quota: 6}, analytics.Totals)
	require.Len(t, analytics.Models, 1)
	assert.Equal(t, "gpt-5.5", analytics.Models[0].ModelName)
}

func TestGetSelfAnalyticsQueryIsPortableAcrossSupportedDialects(t *testing.T) {
	originalLogDB := LOG_DB
	t.Cleanup(func() { LOG_DB = originalLogDB })

	tests := []struct {
		name string
		open func() (*gorm.DB, error)
	}{
		{
			name: "mysql",
			open: func() (*gorm.DB, error) {
				return gorm.Open(mysql.New(mysql.Config{
					DSN:                       "user:pass@tcp(localhost:3306)/iterloop",
					SkipInitializeWithVersion: true,
				}), &gorm.Config{DryRun: true, DisableAutomaticPing: true})
			},
		},
		{
			name: "postgresql",
			open: func() (*gorm.DB, error) {
				return gorm.Open(postgres.Open("host=localhost user=iterloop password=pass dbname=iterloop sslmode=disable"), &gorm.Config{DryRun: true, DisableAutomaticPing: true})
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, err := test.open()
			require.NoError(t, err)
			LOG_DB = db
			analytics, queryErr := GetSelfAnalytics(7, 1, 2, nil)
			require.NoError(t, queryErr)
			assert.Empty(t, analytics.Trend)
			assert.Empty(t, analytics.Models)
		})
	}
}
