package model

import (
	"errors"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupDesktopTest(t *testing.T) *IssuanceProfile {
	t.Helper()
	setupIssuanceTest(t)
	require.NoError(t, DB.AutoMigrate(&DesktopDevice{}, &DesktopGrant{}, &DesktopOAuthCode{}, &DesktopOAuthRequest{}))
	for _, target := range []any{&DesktopDevice{}, &DesktopGrant{}, &DesktopOAuthCode{}, &DesktopOAuthRequest{}} {
		require.NoError(t, DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(target).Error)
	}
	t.Cleanup(func() {
		for _, target := range []any{&DesktopDevice{}, &DesktopGrant{}, &DesktopOAuthCode{}, &DesktopOAuthRequest{}} {
			_ = DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(target).Error
		}
	})
	return createIssuanceProfileFixture(t, IssuanceModeCombined)
}

func TestDesktopOAuthRequestCanOnlyBeConsumedOnce(t *testing.T) {
	setupDesktopTest(t)
	rawRequest, err := CreateDesktopOAuthRequest(DesktopOAuthRequestInput{
		Provider: "google", CallbackUrl: "http://127.0.0.1:12345/iterloop-oauth?state=test-state",
		ClientState: "test-state", CodeChallenge: strings.Repeat("c", 43),
	})
	require.NoError(t, err)

	request, err := ConsumeDesktopOAuthRequest(rawRequest)
	require.NoError(t, err)
	assert.Equal(t, "google", request.Provider)
	assert.Equal(t, "test-state", request.ClientState)
	_, err = ConsumeDesktopOAuthRequest(rawRequest)
	assert.ErrorIs(t, err, ErrDesktopOAuthCodeInvalid)
}

func TestDesktopOAuthCodeUsesPKCEAndCanOnlyBeExchangedOnce(t *testing.T) {
	profile := setupDesktopTest(t)
	user := &User{
		Username: "google-user", DisplayName: "Google User", Email: "google@example.com",
		Role: common.RoleCommonUser, Status: common.UserStatusEnabled, Group: "default",
	}
	require.NoError(t, user.Insert(0))
	verifier := strings.Repeat("v", 64)
	code, err := CreateDesktopOAuthCode(user.Id, "google", desktopPKCEChallenge(verifier))
	require.NoError(t, err)

	input := DesktopEnrollmentInput{
		InstallId: "google-install", DeviceName: "Google Mac", Platform: "macos", AppVersion: "0.1.1",
	}
	_, err = ExchangeDesktopOAuthCode(profile, code, strings.Repeat("x", 64), input)
	assert.ErrorIs(t, err, ErrDesktopOAuthCodeInvalid)

	result, err := ExchangeDesktopOAuthCode(profile, code, verifier, input)
	require.NoError(t, err)
	assert.Equal(t, user.Id, result.User.Id)
	assert.Contains(t, result.Credential.ApiKey, "sk-")
	assert.NotEmpty(t, result.RefreshToken)

	_, err = ExchangeDesktopOAuthCode(profile, code, verifier, DesktopEnrollmentInput{
		InstallId: "second-google-install", DeviceName: "Second Mac", Platform: "macos", AppVersion: "0.1.1",
	})
	assert.ErrorIs(t, err, ErrDesktopOAuthCodeInvalid)

	var grantCount int64
	var deviceCount int64
	require.NoError(t, DB.Model(&DesktopGrant{}).Count(&grantCount).Error)
	require.NoError(t, DB.Model(&DesktopDevice{}).Count(&deviceCount).Error)
	assert.EqualValues(t, 1, grantCount)
	assert.EqualValues(t, 1, deviceCount)
}

func desktopEnrollmentFixture(installId string) DesktopEnrollmentInput {
	return DesktopEnrollmentInput{
		Username: "desktop-user", Password: "password123", Email: "desktop@example.com",
		InstallId: installId, DeviceName: "Windows PC", Platform: "windows", AppVersion: "0.1.0",
	}
}

func TestCreateDesktopEnrollmentAndRotateSession(t *testing.T) {
	profile := setupDesktopTest(t)
	result, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("install-one"))
	require.NoError(t, err)
	require.NotNil(t, result.User)
	require.NotNil(t, result.Device)
	assert.Equal(t, "desktop@example.com", result.User.Email)
	assert.NotEqual(t, result.RefreshToken, result.Device.RefreshTokenHash)
	assert.Contains(t, result.Credential.ApiKey, "sk-")
	assert.Equal(t, []string{"gpt-5.5", "gpt-5.6-sol", "claude-sonnet-4-6"}, result.Credential.Models)

	var grants int64
	var tokens int64
	require.NoError(t, DB.Model(&DesktopGrant{}).Count(&grants).Error)
	require.NoError(t, DB.Model(&Token{}).Count(&tokens).Error)
	assert.EqualValues(t, 1, grants)
	assert.EqualValues(t, 1, tokens)

	newRefreshToken, summary, err := RefreshDesktopSession(result.RefreshToken, "0.1.1")
	require.NoError(t, err)
	assert.NotEqual(t, result.RefreshToken, newRefreshToken)
	assert.Empty(t, summary.Credential.ApiKey)
	assert.Equal(t, DesktopServiceStatusReady, summary.ServiceStatus)
	assert.Equal(t, "0.1.1", summary.Device.AppVersion)
	_, err = FindActiveDesktopDeviceByToken(result.RefreshToken)
	assert.ErrorIs(t, err, ErrDesktopDeviceNotFound)
	_, err = FindActiveDesktopDeviceByToken(newRefreshToken)
	require.NoError(t, err)
	grant, err := GetDesktopGrantForUser(DB, result.User.Id)
	require.NoError(t, err)
	require.NoError(t, DB.Model(&Token{}).Where("id = ?", grant.TokenId).Update("status", common.TokenStatusDisabled).Error)
	latestRefreshToken, disabledSummary, err := RefreshDesktopSession(newRefreshToken, "0.1.2")
	require.NoError(t, err)
	assert.NotEmpty(t, latestRefreshToken)
	assert.Equal(t, DesktopServiceStatusKeyBad, disabledSummary.ServiceStatus)
	_, _, err = RefreshDesktopSession(latestRefreshToken, strings.Repeat("v", 33))
	assert.ErrorIs(t, err, ErrDesktopInvalidDevice)
}

func TestLinkDesktopDeviceReusesStarterCredential(t *testing.T) {
	profile := setupDesktopTest(t)
	first, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("install-one"))
	require.NoError(t, err)

	second, err := LinkDesktopDevice(profile, first.User.Email, DesktopEnrollmentInput{
		InstallId: "install-two", DeviceName: "Second PC", Platform: "windows", AppVersion: "0.1.0",
	})
	require.NoError(t, err)
	assert.Equal(t, first.Credential.ApiKey, second.Credential.ApiKey)

	var grantCount int64
	var issuanceCount int64
	var deviceCount int64
	require.NoError(t, DB.Model(&DesktopGrant{}).Count(&grantCount).Error)
	require.NoError(t, DB.Model(&Issuance{}).Count(&issuanceCount).Error)
	require.NoError(t, DB.Model(&DesktopDevice{}).Count(&deviceCount).Error)
	assert.EqualValues(t, 1, grantCount)
	assert.EqualValues(t, 1, issuanceCount)
	assert.EqualValues(t, 2, deviceCount)
}

func TestLinkDesktopDeviceReportsOriginalStarterProfile(t *testing.T) {
	profile := setupDesktopTest(t)
	first, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("install-one"))
	require.NoError(t, err)
	newProfileValue := *profile
	newProfileValue.Id = 0
	newProfileValue.Name = "Replacement desktop starter"
	newProfileValue.CreatedTime = 0
	newProfileValue.UpdatedTime = 0
	require.NoError(t, newProfileValue.Insert())
	newProfile := &newProfileValue

	linked, err := LinkDesktopDevice(newProfile, first.User.Email, DesktopEnrollmentInput{
		InstallId: "install-two", DeviceName: "Second PC", Platform: "windows", AppVersion: "0.1.0",
	})
	require.NoError(t, err)
	assert.Equal(t, profile.Id, linked.Profile.Id)
	assert.Equal(t, first.Credential.ApiKey, linked.Credential.ApiKey)
}

func TestLinkDesktopDeviceRestoresGrantAfterEnrollmentCloses(t *testing.T) {
	profile := setupDesktopTest(t)
	first, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("install-one"))
	require.NoError(t, err)
	require.NoError(t, DB.Model(profile).Update("enabled", false).Error)

	linked, err := LinkDesktopDevice(nil, first.User.Email, DesktopEnrollmentInput{
		InstallId: "install-two", DeviceName: "Second PC", Platform: "windows", AppVersion: "0.1.0",
	})
	require.NoError(t, err)
	assert.Equal(t, profile.Id, linked.Profile.Id)
	assert.Equal(t, first.Credential.ApiKey, linked.Credential.ApiKey)
}

func TestDesktopEnrollmentRejectsInvalidInput(t *testing.T) {
	profile := setupDesktopTest(t)
	invalidDevice := desktopEnrollmentFixture("")
	_, err := CreateDesktopEnrollment(profile, invalidDevice)
	assert.ErrorIs(t, err, ErrDesktopInvalidDevice)

	invalidAccount := desktopEnrollmentFixture("install-one")
	invalidAccount.Password = "short"
	_, err = CreateDesktopEnrollment(profile, invalidAccount)
	assert.ErrorIs(t, err, ErrDesktopInvalidEnrollment)
}

func TestDesktopEnrollmentDuplicateEmailRollsBack(t *testing.T) {
	profile := setupDesktopTest(t)
	_, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("install-one"))
	require.NoError(t, err)

	duplicate := desktopEnrollmentFixture("install-two")
	duplicate.Username = "different-user"
	_, err = CreateDesktopEnrollment(profile, duplicate)
	require.Error(t, err)

	var userCount int64
	var tokenCount int64
	var deviceCount int64
	require.NoError(t, DB.Model(&User{}).Count(&userCount).Error)
	require.NoError(t, DB.Model(&Token{}).Count(&tokenCount).Error)
	require.NoError(t, DB.Model(&DesktopDevice{}).Count(&deviceCount).Error)
	assert.EqualValues(t, 1, userCount)
	assert.EqualValues(t, 1, tokenCount)
	assert.EqualValues(t, 1, deviceCount)
}

func TestDesktopEnrollmentDuplicateUsernameReturnsStableError(t *testing.T) {
	profile := setupDesktopTest(t)
	_, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("install-one"))
	require.NoError(t, err)

	duplicate := desktopEnrollmentFixture("install-two")
	duplicate.Email = "different@example.com"
	_, err = CreateDesktopEnrollment(profile, duplicate)
	assert.ErrorIs(t, err, ErrDesktopUsernameUnavailable)

	var userCount int64
	var grantCount int64
	require.NoError(t, DB.Model(&User{}).Count(&userCount).Error)
	require.NoError(t, DB.Model(&DesktopGrant{}).Count(&grantCount).Error)
	assert.EqualValues(t, 1, userCount)
	assert.EqualValues(t, 1, grantCount)
}

func TestDesktopEnrollmentDeviceConflictRollsBackWholeTransaction(t *testing.T) {
	profile := setupDesktopTest(t)
	_, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("claimed-install"))
	require.NoError(t, err)

	conflict := desktopEnrollmentFixture("claimed-install")
	conflict.Username = "second-desktop-user"
	conflict.Email = "second-desktop@example.com"
	_, err = CreateDesktopEnrollment(profile, conflict)
	assert.ErrorIs(t, err, ErrDesktopInstallClaimed)

	var users int64
	var grants int64
	var tokens int64
	var issuances int64
	require.NoError(t, DB.Model(&User{}).Count(&users).Error)
	require.NoError(t, DB.Model(&DesktopGrant{}).Count(&grants).Error)
	require.NoError(t, DB.Model(&Token{}).Count(&tokens).Error)
	require.NoError(t, DB.Model(&Issuance{}).Count(&issuances).Error)
	assert.EqualValues(t, 1, users)
	assert.EqualValues(t, 1, grants)
	assert.EqualValues(t, 1, tokens)
	assert.EqualValues(t, 1, issuances)
}

func TestDesktopCredentialRotationAndDeviceRevoke(t *testing.T) {
	profile := setupDesktopTest(t)
	result, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("install-one"))
	require.NoError(t, err)
	oldKey := result.Credential.ApiKey

	newKey, err := RotateDesktopCredential(result.RefreshToken)
	require.NoError(t, err)
	assert.NotEqual(t, oldKey, newKey)
	grant, err := GetDesktopGrantForUser(DB, result.User.Id)
	require.NoError(t, err)
	token, err := GetTokenByIds(grant.TokenId, result.User.Id)
	require.NoError(t, err)
	assert.Equal(t, newKey, "sk-"+token.Key)

	require.NoError(t, RevokeDesktopDevice(result.Device.Id, result.User.Id, true))
	_, err = FindActiveDesktopDeviceByToken(result.RefreshToken)
	assert.ErrorIs(t, err, ErrDesktopDeviceRevoked)
	require.NoError(t, DB.First(token, token.Id).Error)
	assert.Equal(t, common.TokenStatusDisabled, token.Status)
}

func TestDesktopStarterProfileMustBeSingleCombinedKey(t *testing.T) {
	profile := &IssuanceProfile{
		Id: 1, Name: "Split", Mode: IssuanceModeSplit, KeyCount: 1, Enabled: true,
		CodexModels: "gpt-5.6-sol", ClaudeModels: "claude-sonnet-4-6",
	}
	assert.ErrorIs(t, ValidateDesktopStarterProfile(profile), ErrDesktopStarterInvalid)
	profile.Mode = IssuanceModeCombined
	profile.KeyCount = 2
	assert.ErrorIs(t, ValidateDesktopStarterProfile(profile), ErrDesktopStarterInvalid)
	profile.KeyCount = 1
	require.NoError(t, ValidateDesktopStarterProfile(profile))
	profile.Enabled = false
	assert.ErrorIs(t, ValidateDesktopStarterProfile(profile), ErrDesktopStarterUnavailable)

	_, err := GetDesktopGrantForUser(nil, 999999)
	assert.True(t, errors.Is(err, gorm.ErrRecordNotFound))
}
