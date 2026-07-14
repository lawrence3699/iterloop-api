package model

import (
	"fmt"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupIssuanceTest(t *testing.T) {
	t.Helper()
	require.NoError(t, DB.AutoMigrate(&User{}, &Token{}, &IssuanceProfile{}, &Issuance{}, &Log{}))
	for _, target := range []any{&Issuance{}, &IssuanceProfile{}, &Token{}, &User{}, &Log{}} {
		require.NoError(t, DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(target).Error)
	}
	previousQuota := common.QuotaForNewUser
	common.QuotaForNewUser = 0
	t.Cleanup(func() {
		common.QuotaForNewUser = previousQuota
		for _, target := range []any{&Issuance{}, &IssuanceProfile{}, &Token{}, &User{}, &Log{}} {
			_ = DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(target).Error
		}
	})
}

func createIssuanceProfileFixture(t *testing.T, mode string) *IssuanceProfile {
	t.Helper()
	profile := &IssuanceProfile{
		Name: "Standard access", Description: "Test profile", Mode: mode,
		BalanceQuota: 5000, KeyQuota: 1000, KeyCount: 1, ExpireDays: 30,
		CodexModels: "gpt-5.5,gpt-5.6-sol", ClaudeModels: "claude-sonnet-4-6",
		CodexGroup: "codex-standard", ClaudeGroup: "claude-standard", GrokGroup: "grok-standard", CombinedGroup: "combined-standard",
		Enabled: true, CreatedBy: 99,
	}
	require.NoError(t, profile.Insert())
	return profile
}

func TestIssueAccessCreatesUserBalanceAndCombinedKey(t *testing.T) {
	setupIssuanceTest(t)
	profile := createIssuanceProfileFixture(t, IssuanceModeCombined)

	result, err := IssueAccess(profile, "New.User@example.com", "first issue", 99, IssueAccessOptions{})
	require.NoError(t, err)
	require.True(t, result.AccountCreated)
	require.NotEmpty(t, result.TemporaryPassword)
	require.Len(t, result.Credentials, 1)
	assert.Equal(t, "combined-standard", result.Credentials[0].Group)
	assert.Equal(t, []string{"gpt-5.5", "gpt-5.6-sol", "claude-sonnet-4-6"}, result.Credentials[0].Models)
	assert.Contains(t, result.Credentials[0].ApiKey, "sk-")

	var user User
	require.NoError(t, DB.First(&user, "id = ?", result.User.Id).Error)
	assert.Equal(t, "new.user@example.com", user.Email)
	assert.Equal(t, 5000, user.Quota)

	var token Token
	require.NoError(t, DB.First(&token, "id = ?", result.Credentials[0].TokenId).Error)
	assert.Equal(t, 1000, token.RemainQuota)
	assert.Equal(t, common.TokenStatusEnabled, token.Status)
	assert.True(t, token.ModelLimitsEnabled)
}

func TestIssueAccessExistingUserSplitAndRevoke(t *testing.T) {
	setupIssuanceTest(t)
	user := &User{Username: "existing", Password: "password123", Email: "existing@example.com", Status: common.UserStatusEnabled, Role: common.RoleCommonUser, Group: "default"}
	require.NoError(t, user.Insert(0))
	profile := createIssuanceProfileFixture(t, IssuanceModeSplit)

	result, err := IssueAccess(profile, user.Email, "split issue", 99, IssueAccessOptions{})
	require.NoError(t, err)
	assert.False(t, result.AccountCreated)
	require.Len(t, result.Credentials, 2)
	assert.Equal(t, "codex-standard", result.Credentials[0].Group)
	assert.Equal(t, "claude-standard", result.Credentials[1].Group)

	require.NoError(t, DB.First(&user, "id = ?", user.Id).Error)
	assert.Equal(t, 5000, user.Quota)

	revoked, err := RevokeIssuance(result.Issuance.Id)
	require.NoError(t, err)
	assert.Equal(t, IssuanceStatusRevoked, revoked.Status)
	for _, credential := range result.Credentials {
		var token Token
		require.NoError(t, DB.First(&token, "id = ?", credential.TokenId).Error)
		assert.Equal(t, common.TokenStatusDisabled, token.Status, fmt.Sprintf("token %d should be disabled", credential.TokenId))
	}
}

func TestIssueAccessCreatesGrokOnlyKey(t *testing.T) {
	setupIssuanceTest(t)
	profile := &IssuanceProfile{
		Name: "Grok access", Mode: IssuanceModeGrok, KeyCount: 1,
		GrokModels: "grok-4.5,grok-4.3", GrokGroup: "grok-standard", Enabled: true,
	}
	require.NoError(t, profile.Insert())

	result, err := IssueAccess(profile, "grok@example.com", "", 99, IssueAccessOptions{})
	require.NoError(t, err)
	require.Len(t, result.Credentials, 1)
	assert.Equal(t, "grok-standard", result.Credentials[0].Group)
	assert.Equal(t, []string{"grok-4.5", "grok-4.3"}, result.Credentials[0].Models)
}

func TestIssueAccessCombinedAndSplitUseConfiguredFamilies(t *testing.T) {
	setupIssuanceTest(t)
	combined := &IssuanceProfile{
		Name: "Three family", Mode: IssuanceModeCombined, KeyCount: 1,
		CodexModels: "gpt-5.5", ClaudeModels: "claude-sonnet-4-6", GrokModels: "grok-4.5",
		CombinedGroup: "combined-standard", Enabled: true,
	}
	require.NoError(t, combined.Insert())
	combinedResult, err := IssueAccess(combined, "combined@example.com", "", 99, IssueAccessOptions{})
	require.NoError(t, err)
	require.Len(t, combinedResult.Credentials, 1)
	assert.Equal(t, []string{"gpt-5.5", "claude-sonnet-4-6", "grok-4.5"}, combinedResult.Credentials[0].Models)

	split := &IssuanceProfile{
		Name: "Claude Grok split", Mode: IssuanceModeSplit, KeyCount: 1,
		ClaudeModels: "claude-sonnet-4-6", GrokModels: "grok-4.3",
		ClaudeGroup: "claude-standard", GrokGroup: "grok-standard", Enabled: true,
	}
	require.NoError(t, split.Insert())
	splitResult, err := IssueAccess(split, "split-grok@example.com", "", 99, IssueAccessOptions{})
	require.NoError(t, err)
	require.Len(t, splitResult.Credentials, 2)
	assert.Equal(t, "claude-standard", splitResult.Credentials[0].Group)
	assert.Equal(t, "grok-standard", splitResult.Credentials[1].Group)
}

func TestIssuanceProfileValidation(t *testing.T) {
	profile := &IssuanceProfile{Name: "Codex", Mode: IssuanceModeCodex, KeyCount: 1, Enabled: true}
	err := profile.Normalize()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "Codex model")

	profile.CodexModels = "gpt-5.5, gpt-5.5, gpt-5.6-sol"
	require.NoError(t, profile.Normalize())
	assert.Equal(t, "gpt-5.5,gpt-5.6-sol", profile.CodexModels)

	combined := &IssuanceProfile{Name: "Invalid combined", Mode: IssuanceModeCombined, CodexModels: "gpt-5.5", KeyCount: 1}
	err = combined.Normalize()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "two model families")
}

func TestIssuanceProfileInsertPreservesDisabledState(t *testing.T) {
	setupIssuanceTest(t)
	profile := &IssuanceProfile{
		Name: "Disabled access", Mode: IssuanceModeCodex, KeyCount: 1,
		CodexModels: "gpt-5.5", Enabled: false,
	}

	require.NoError(t, profile.Insert())
	assert.False(t, profile.Enabled)

	stored, err := GetIssuanceProfileById(profile.Id)
	require.NoError(t, err)
	assert.False(t, stored.Enabled)
}
