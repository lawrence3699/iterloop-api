package model

import (
	"errors"
	"fmt"
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
	require.NoError(t, DB.AutoMigrate(&DesktopDevice{}, &DesktopGrant{}, &DesktopOAuthCode{}, &DesktopOAuthRequest{}, &UserOAuthBinding{}))
	for _, target := range []any{&DesktopDevice{}, &DesktopGrant{}, &DesktopOAuthCode{}, &DesktopOAuthRequest{}, &UserOAuthBinding{}} {
		require.NoError(t, DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(target).Error)
	}
	t.Cleanup(func() {
		for _, target := range []any{&DesktopDevice{}, &DesktopGrant{}, &DesktopOAuthCode{}, &DesktopOAuthRequest{}, &UserOAuthBinding{}} {
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

func TestDesktopOAuthBrowserStateCanOnlyBeClaimedOnce(t *testing.T) {
	setupDesktopTest(t)
	rawRequest, err := CreateDesktopOAuthRequest(DesktopOAuthRequestInput{
		Provider: "google", CallbackUrl: "http://127.0.0.1:12345/iterloop-oauth?state=client-state",
		ClientState: "client-state", CodeChallenge: strings.Repeat("c", 43),
	})
	require.NoError(t, err)
	request, err := ConsumeDesktopOAuthRequest(rawRequest)
	require.NoError(t, err)
	require.NoError(t, BindDesktopOAuthRequestState(request.Id, "provider-state"))

	claimed, err := ClaimDesktopOAuthRequestByState("google", "provider-state")
	require.NoError(t, err)
	assert.Equal(t, request.Id, claimed.Id)
	assert.NotZero(t, claimed.CallbackConsumedTime)

	repeated, err := ClaimDesktopOAuthRequestByState("google", "provider-state")
	assert.ErrorIs(t, err, ErrDesktopOAuthCallbackConsumed)
	require.NotNil(t, repeated)
	assert.Equal(t, request.Id, repeated.Id)
	missing, err := ClaimDesktopOAuthRequestByState("google", "different-state")
	assert.ErrorIs(t, err, ErrDesktopOAuthCodeInvalid)
	assert.Nil(t, missing)
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

func desktopOAuthIdentityFixture() DesktopOAuthIdentityInput {
	return DesktopOAuthIdentityInput{
		Provider: "google", ProviderId: 101, ProviderUserId: "google-subject-1",
		Username: "google-user", DisplayName: "Google User", Email: "google@example.com",
		UsernamePrefix: "google_", RegistrationOpen: true,
	}
}

func assertDesktopOAuthIdentityCleared(t *testing.T, code DesktopOAuthCode) {
	t.Helper()
	assert.Zero(t, code.OAuthProviderId)
	assert.Empty(t, code.OAuthProviderUserId)
	assert.Empty(t, code.OAuthUsername)
	assert.Empty(t, code.OAuthDisplayName)
	assert.Empty(t, code.OAuthEmail)
	assert.Empty(t, code.OAuthUsernamePrefix)
	assert.False(t, code.OAuthRegistrationOpen)
	assert.Empty(t, code.CodeChallenge)
}

func TestPendingDesktopOAuthCreatesAtomicallyAndReusesStarterGrant(t *testing.T) {
	profile := setupDesktopTest(t)
	verifier := strings.Repeat("v", 64)
	identity := desktopOAuthIdentityFixture()
	code, err := CreatePendingDesktopOAuthCode(identity, desktopPKCEChallenge(verifier))
	require.NoError(t, err)

	first, err := ExchangeDesktopOAuthCode(profile, code, verifier, DesktopEnrollmentInput{
		InstallId: "google-install-one", DeviceName: "Google Mac", Platform: "macos", AppVersion: "0.1.1",
	})
	require.NoError(t, err)
	assert.Equal(t, "google@example.com", first.User.Email)
	assert.Contains(t, first.Credential.ApiKey, "sk-")
	var consumedCode DesktopOAuthCode
	require.NoError(t, DB.Where("code_hash = ?", HashDesktopToken(code)).First(&consumedCode).Error)
	assert.Equal(t, first.User.Id, consumedCode.UserId)
	assert.NotZero(t, consumedCode.ConsumedTime)
	assertDesktopOAuthIdentityCleared(t, consumedCode)
	binding, err := GetUserByOAuthBinding(identity.ProviderId, identity.ProviderUserId)
	require.NoError(t, err)
	assert.Equal(t, first.User.Id, binding.Id)

	// Closing new registrations after the first connection must not prevent the
	// already bound Google account from linking another device.
	identity.RegistrationOpen = false
	secondCode, err := CreatePendingDesktopOAuthCode(identity, desktopPKCEChallenge(verifier))
	require.NoError(t, err)
	second, err := ExchangeDesktopOAuthCode(profile, secondCode, verifier, DesktopEnrollmentInput{
		InstallId: "google-install-two", DeviceName: "Second Google Mac", Platform: "macos", AppVersion: "0.1.1",
	})
	require.NoError(t, err)
	assert.Equal(t, first.User.Id, second.User.Id)
	assert.Equal(t, first.Credential.ApiKey, second.Credential.ApiKey)

	for target, expected := range map[any]int64{
		&User{}: 1, &UserOAuthBinding{}: 1, &DesktopGrant{}: 1,
		&Token{}: 1, &Issuance{}: 1, &DesktopDevice{}: 2,
	} {
		var count int64
		require.NoError(t, DB.Model(target).Count(&count).Error)
		assert.Equal(t, expected, count)
	}
}

func TestDesktopOAuthCleanupRetainsActiveAndRedactsExpiredIdentity(t *testing.T) {
	setupDesktopTest(t)
	now := common.GetTimestamp()
	verifier := strings.Repeat("v", 64)

	activeCode, err := CreatePendingDesktopOAuthCode(desktopOAuthIdentityFixture(), desktopPKCEChallenge(verifier))
	require.NoError(t, err)
	activeRequest, err := CreateDesktopOAuthRequest(DesktopOAuthRequestInput{
		Provider: "google", CallbackUrl: "http://127.0.0.1:12345/iterloop-oauth?state=active",
		ClientState: "active", CodeChallenge: desktopPKCEChallenge(verifier),
	})
	require.NoError(t, err)

	result, err := CleanupDesktopOAuthTemporaryData(now, DesktopOAuthRetentionSeconds)
	require.NoError(t, err)
	assert.Zero(t, result.CodesRedacted)
	assert.Zero(t, result.CodesDeleted)
	assert.Zero(t, result.RequestsDeleted)

	var retainedCode DesktopOAuthCode
	require.NoError(t, DB.Where("code_hash = ?", HashDesktopToken(activeCode)).First(&retainedCode).Error)
	assert.Equal(t, "google-subject-1", retainedCode.OAuthProviderUserId)
	assert.NotEmpty(t, retainedCode.CodeChallenge)
	var retainedRequest DesktopOAuthRequest
	require.NoError(t, DB.Where("request_hash = ?", HashDesktopToken(activeRequest)).First(&retainedRequest).Error)
	assert.Equal(t, "active", retainedRequest.ClientState)

	expiredCode, err := CreatePendingDesktopOAuthCode(desktopOAuthIdentityFixture(), desktopPKCEChallenge(verifier))
	require.NoError(t, err)
	require.NoError(t, DB.Model(&DesktopOAuthCode{}).
		Where("code_hash = ?", HashDesktopToken(expiredCode)).
		Update("expires_time", now-1).Error)

	result, err = CleanupDesktopOAuthTemporaryData(now, DesktopOAuthRetentionSeconds)
	require.NoError(t, err)
	assert.EqualValues(t, 1, result.CodesRedacted)
	assert.Zero(t, result.CodesDeleted)

	var redactedCode DesktopOAuthCode
	require.NoError(t, DB.Where("code_hash = ?", HashDesktopToken(expiredCode)).First(&redactedCode).Error)
	assertDesktopOAuthIdentityCleared(t, redactedCode)
	require.NoError(t, DB.Where("code_hash = ?", HashDesktopToken(activeCode)).First(&retainedCode).Error)
	assert.Equal(t, "google-subject-1", retainedCode.OAuthProviderUserId)
}

func TestDesktopOAuthCleanupDeletesOldTerminalRecords(t *testing.T) {
	setupDesktopTest(t)
	now := common.GetTimestamp()
	old := now - DesktopOAuthRetentionSeconds - 1
	verifier := strings.Repeat("v", 64)

	oldCode, err := CreatePendingDesktopOAuthCode(desktopOAuthIdentityFixture(), desktopPKCEChallenge(verifier))
	require.NoError(t, err)
	require.NoError(t, DB.Model(&DesktopOAuthCode{}).
		Where("code_hash = ?", HashDesktopToken(oldCode)).
		Updates(map[string]any{"expires_time": old, "consumed_time": old}).Error)

	requestStatuses := []map[string]any{
		{"expires_time": old},
		{"expires_time": now - 1, "consumed_time": old},
		{"expires_time": now - 1, "consumed_time": old, "callback_consumed_time": old},
	}
	requestHashes := make([]string, 0, len(requestStatuses))
	for index, status := range requestStatuses {
		rawRequest, createErr := CreateDesktopOAuthRequest(DesktopOAuthRequestInput{
			Provider: "google", CallbackUrl: "http://127.0.0.1:12345/iterloop-oauth",
			ClientState: fmt.Sprintf("terminal-%d", index), CodeChallenge: desktopPKCEChallenge(verifier),
		})
		require.NoError(t, createErr)
		hash := HashDesktopToken(rawRequest)
		requestHashes = append(requestHashes, hash)
		require.NoError(t, DB.Model(&DesktopOAuthRequest{}).Where("request_hash = ?", hash).Updates(status).Error)
	}

	result, err := CleanupDesktopOAuthTemporaryData(now, DesktopOAuthRetentionSeconds)
	require.NoError(t, err)
	assert.EqualValues(t, 1, result.CodesDeleted)
	assert.EqualValues(t, len(requestStatuses), result.RequestsDeleted)

	var codeCount int64
	require.NoError(t, DB.Model(&DesktopOAuthCode{}).Where("code_hash = ?", HashDesktopToken(oldCode)).Count(&codeCount).Error)
	assert.Zero(t, codeCount)
	var requestCount int64
	require.NoError(t, DB.Model(&DesktopOAuthRequest{}).Where("request_hash IN ?", requestHashes).Count(&requestCount).Error)
	assert.Zero(t, requestCount)
}

func TestPendingDesktopOAuthRollsBackUserBindingGrantAndDeviceTogether(t *testing.T) {
	profile := setupDesktopTest(t)
	_, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("claimed-google-install"))
	require.NoError(t, err)
	verifier := strings.Repeat("v", 64)
	code, err := CreatePendingDesktopOAuthCode(desktopOAuthIdentityFixture(), desktopPKCEChallenge(verifier))
	require.NoError(t, err)

	_, err = ExchangeDesktopOAuthCode(profile, code, verifier, DesktopEnrollmentInput{
		InstallId: "claimed-google-install", DeviceName: "Conflicting Mac", Platform: "macos", AppVersion: "0.1.1",
	})
	assert.ErrorIs(t, err, ErrDesktopInstallClaimed)

	for target := range map[any]struct{}{
		&User{}: {}, &DesktopGrant{}: {}, &Token{}: {}, &Issuance{}: {}, &DesktopDevice{}: {},
	} {
		var count int64
		require.NoError(t, DB.Model(target).Count(&count).Error)
		assert.EqualValues(t, 1, count)
	}
	var bindingCount int64
	require.NoError(t, DB.Model(&UserOAuthBinding{}).Count(&bindingCount).Error)
	assert.Zero(t, bindingCount)
	var pendingCode DesktopOAuthCode
	require.NoError(t, DB.Where("code_hash = ?", HashDesktopToken(code)).First(&pendingCode).Error)
	assert.Zero(t, pendingCode.ConsumedTime)
	assert.Equal(t, "google-subject-1", pendingCode.OAuthProviderUserId)
	assert.NotEmpty(t, pendingCode.CodeChallenge)
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

func TestDesktopRefreshTokenGraceRecoversWithoutExtendingDeadline(t *testing.T) {
	profile := setupDesktopTest(t)
	enrollment, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("grace-install"))
	require.NoError(t, err)
	originalToken := enrollment.RefreshToken

	firstToken, _, err := RefreshDesktopSession(originalToken, "0.1.1")
	require.NoError(t, err)
	device := &DesktopDevice{}
	require.NoError(t, DB.First(device, enrollment.Device.Id).Error)
	originalDeadline := device.RefreshTokenGraceExpiresTime
	assert.Equal(t, HashDesktopToken(originalToken), device.PreviousRefreshTokenHash)
	assert.Equal(t, HashDesktopToken(firstToken), device.RefreshTokenHash)
	assert.GreaterOrEqual(t, originalDeadline, common.GetTimestamp()+DesktopRefreshTokenGraceSeconds-1)

	recoveredToken, _, err := RefreshDesktopSession(originalToken, "0.1.2")
	require.NoError(t, err)
	assert.NotEqual(t, firstToken, recoveredToken)
	require.NoError(t, DB.First(device, enrollment.Device.Id).Error)
	assert.Equal(t, originalDeadline, device.RefreshTokenGraceExpiresTime)
	assert.Equal(t, HashDesktopToken(originalToken), device.PreviousRefreshTokenHash)
	assert.Equal(t, HashDesktopToken(recoveredToken), device.RefreshTokenHash)
	_, err = FindActiveDesktopDeviceByToken(firstToken)
	assert.ErrorIs(t, err, ErrDesktopDeviceNotFound)
	_, err = FindActiveDesktopDeviceByToken(recoveredToken)
	require.NoError(t, err)
}

func TestDesktopRefreshTokenGraceRejectsExpiredTokenWithoutRotatingCurrent(t *testing.T) {
	profile := setupDesktopTest(t)
	enrollment, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("expired-grace-install"))
	require.NoError(t, err)
	currentToken, _, err := RefreshDesktopSession(enrollment.RefreshToken, "0.1.1")
	require.NoError(t, err)
	require.NoError(t, DB.Model(&DesktopDevice{}).
		Where("id = ?", enrollment.Device.Id).
		Update("refresh_token_grace_expires_time", common.GetTimestamp()-1).Error)

	_, _, err = RefreshDesktopSession(enrollment.RefreshToken, "0.1.2")
	assert.ErrorIs(t, err, ErrDesktopDeviceNotFound)
	_, err = FindActiveDesktopDeviceByToken(currentToken)
	require.NoError(t, err)
}

func TestDesktopRefreshRejectsCurrentAndGraceTokensAfterRevoke(t *testing.T) {
	profile := setupDesktopTest(t)
	enrollment, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("revoked-grace-install"))
	require.NoError(t, err)
	currentToken, _, err := RefreshDesktopSession(enrollment.RefreshToken, "0.1.1")
	require.NoError(t, err)
	require.NoError(t, RevokeDesktopDevice(enrollment.Device.Id, enrollment.User.Id, false))

	_, _, err = RefreshDesktopSession(currentToken, "0.1.2")
	assert.ErrorIs(t, err, ErrDesktopDeviceRevoked)
	_, _, err = RefreshDesktopSession(enrollment.RefreshToken, "0.1.2")
	assert.ErrorIs(t, err, ErrDesktopDeviceRevoked)
}

func TestDesktopRefreshTokensAreStoredOnlyAsHashesAndHiddenFromJSON(t *testing.T) {
	profile := setupDesktopTest(t)
	enrollment, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("hashed-grace-install"))
	require.NoError(t, err)
	originalToken := enrollment.RefreshToken
	currentToken, _, err := RefreshDesktopSession(originalToken, "0.1.1")
	require.NoError(t, err)
	device := &DesktopDevice{}
	require.NoError(t, DB.First(device, enrollment.Device.Id).Error)

	assert.Equal(t, HashDesktopToken(currentToken), device.RefreshTokenHash)
	assert.Equal(t, HashDesktopToken(originalToken), device.PreviousRefreshTokenHash)
	assert.NotEqual(t, currentToken, device.RefreshTokenHash)
	assert.NotEqual(t, originalToken, device.PreviousRefreshTokenHash)
	serialized, err := common.Marshal(device)
	require.NoError(t, err)
	assert.NotContains(t, string(serialized), currentToken)
	assert.NotContains(t, string(serialized), originalToken)
	assert.NotContains(t, string(serialized), "refresh_token_hash")
	assert.NotContains(t, string(serialized), "previous_refresh_token_hash")
}

func TestDesktopRelinkClearsPreviousRefreshTokenGrace(t *testing.T) {
	profile := setupDesktopTest(t)
	enrollment, err := CreateDesktopEnrollment(profile, desktopEnrollmentFixture("relink-grace-install"))
	require.NoError(t, err)
	rotatedToken, _, err := RefreshDesktopSession(enrollment.RefreshToken, "0.1.1")
	require.NoError(t, err)

	relinked, err := LinkDesktopDevice(profile, enrollment.User.Email, DesktopEnrollmentInput{
		InstallId: "relink-grace-install", DeviceName: "Relinked PC", Platform: "windows", AppVersion: "0.1.2",
	})
	require.NoError(t, err)
	device := &DesktopDevice{}
	require.NoError(t, DB.First(device, enrollment.Device.Id).Error)
	assert.Empty(t, device.PreviousRefreshTokenHash)
	assert.Zero(t, device.RefreshTokenGraceExpiresTime)
	assert.Equal(t, HashDesktopToken(relinked.RefreshToken), device.RefreshTokenHash)

	_, _, err = RefreshDesktopSession(enrollment.RefreshToken, "0.1.3")
	assert.ErrorIs(t, err, ErrDesktopDeviceNotFound)
	_, _, err = RefreshDesktopSession(rotatedToken, "0.1.3")
	assert.ErrorIs(t, err, ErrDesktopDeviceNotFound)
	_, _, err = RefreshDesktopSession(relinked.RefreshToken, "0.1.3")
	require.NoError(t, err)
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
