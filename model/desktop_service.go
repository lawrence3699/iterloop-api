package model

import (
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

var (
	ErrDesktopStarterUnavailable    = errors.New("desktop starter profile is unavailable")
	ErrDesktopStarterInvalid        = errors.New("desktop starter profile must be an enabled, single-key Codex and Claude combined profile")
	ErrDesktopCredentialUnavailable = errors.New("desktop credential is unavailable")
	ErrDesktopInvalidDevice         = errors.New("invalid desktop device")
	ErrDesktopInvalidEnrollment     = errors.New("invalid desktop enrollment")
	ErrDesktopUsernameUnavailable   = errors.New("desktop username is unavailable")
	ErrDesktopOAuthIdentityInvalid  = errors.New("desktop oauth identity is invalid")
	ErrDesktopOAuthRegisterDisabled = errors.New("desktop oauth registration is disabled")
)

type DesktopEnrollmentInput struct {
	Username   string
	Password   string
	Email      string
	InstallId  string
	DeviceName string
	Platform   string
	AppVersion string
}

type DesktopEnrollmentResult struct {
	User         *User
	Device       *DesktopDevice
	Profile      *IssuanceProfile
	Credential   IssuedCredential
	RefreshToken string
}

type DesktopSessionSummary struct {
	User          *User
	Device        *DesktopDevice
	Profile       *IssuanceProfile
	Credential    IssuedCredential
	ServiceStatus string
}

type DesktopOAuthRequestInput struct {
	Provider      string
	CallbackUrl   string
	ClientState   string
	CodeChallenge string
}

type DesktopOAuthIdentityInput struct {
	Provider         string
	ProviderId       int
	ProviderUserId   string
	Username         string
	DisplayName      string
	Email            string
	UsernamePrefix   string
	RegistrationOpen bool
}

var (
	ErrDesktopOAuthCodeInvalid      = errors.New("desktop oauth code is invalid")
	ErrDesktopOAuthCodeExpired      = errors.New("desktop oauth code is expired")
	ErrDesktopOAuthCallbackConsumed = errors.New("desktop oauth browser callback is already consumed")
)

func ValidateDesktopStarterProfile(profile *IssuanceProfile) error {
	if profile == nil || profile.Id <= 0 || !profile.Enabled {
		return ErrDesktopStarterUnavailable
	}
	if err := profile.Normalize(); err != nil {
		return fmt.Errorf("%w: %v", ErrDesktopStarterInvalid, err)
	}
	if profile.Mode != IssuanceModeCombined || profile.KeyCount != 1 || profile.CodexModels == "" || profile.ClaudeModels == "" {
		return ErrDesktopStarterInvalid
	}
	return nil
}

func normalizeDesktopDeviceInput(input DesktopEnrollmentInput) (DesktopEnrollmentInput, error) {
	input.InstallId = strings.TrimSpace(input.InstallId)
	input.DeviceName = strings.TrimSpace(input.DeviceName)
	input.Platform = strings.ToLower(strings.TrimSpace(input.Platform))
	input.AppVersion = strings.TrimSpace(input.AppVersion)
	if input.InstallId == "" || len(input.InstallId) > 64 || input.DeviceName == "" || len(input.DeviceName) > 128 {
		return input, ErrDesktopInvalidDevice
	}
	if input.Platform != "windows" && input.Platform != "macos" {
		return input, ErrDesktopInvalidDevice
	}
	if input.AppVersion == "" || len(input.AppVersion) > 32 {
		return input, ErrDesktopInvalidDevice
	}
	return input, nil
}

func validateDesktopEnrollmentInput(input DesktopEnrollmentInput) (DesktopEnrollmentInput, error) {
	input.Username = strings.TrimSpace(input.Username)
	input.Email = NormalizeEmail(input.Email)
	var err error
	input, err = normalizeDesktopDeviceInput(input)
	if err != nil {
		return input, err
	}
	if input.Username == "" || len(input.Username) > UserNameMaxLength || len(input.Password) < 8 || len(input.Password) > 20 {
		return input, ErrDesktopInvalidEnrollment
	}
	if input.Email == "" || !strings.Contains(input.Email, "@") || len(input.Email) > 50 {
		return input, ErrDesktopInvalidEnrollment
	}
	return input, nil
}

func createOrRelinkDesktopDeviceWithTx(tx *gorm.DB, userId int, input DesktopEnrollmentInput, refreshToken string) (*DesktopDevice, error) {
	device := &DesktopDevice{}
	err := lockForUpdate(tx).Where("install_id = ?", input.InstallId).First(device).Error
	now := common.GetTimestamp()
	if err == nil {
		if device.UserId != userId {
			return nil, ErrDesktopInstallClaimed
		}
		updates := map[string]any{
			"device_name": input.DeviceName, "platform": input.Platform, "app_version": input.AppVersion,
			"refresh_token_hash": HashDesktopToken(refreshToken), "previous_refresh_token_hash": "",
			"refresh_token_grace_expires_time": int64(0), "status": DesktopDeviceStatusActive,
			"updated_time": now, "last_seen_time": now, "revoked_time": int64(0),
		}
		if err := tx.Model(device).Updates(updates).Error; err != nil {
			return nil, err
		}
		if err := tx.First(device, device.Id).Error; err != nil {
			return nil, err
		}
		return device, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	device = &DesktopDevice{
		UserId: userId, InstallId: input.InstallId, DeviceName: input.DeviceName,
		Platform: input.Platform, AppVersion: input.AppVersion, RefreshTokenHash: HashDesktopToken(refreshToken),
		Status: DesktopDeviceStatusActive, CreatedTime: now, UpdatedTime: now, LastSeenTime: now,
	}
	if err := tx.Create(device).Error; err != nil {
		return nil, err
	}
	return device, nil
}

func credentialFromToken(token *Token) IssuedCredential {
	return IssuedCredential{
		TokenId: token.Id, Name: token.Name, ApiKey: "sk-" + token.GetFullKey(), Group: token.Group,
		Models: token.GetModelLimits(), ExpiresAt: token.ExpiredTime, Unlimited: token.UnlimitedQuota, Quota: token.RemainQuota,
	}
}

func createDesktopGrantWithTx(tx *gorm.DB, profile *IssuanceProfile, user *User) (*DesktopGrant, IssuedCredential, error) {
	issued, err := IssueAccessToExistingUserWithTx(tx, profile, user, "IterLoop desktop starter", 0, IssueAccessOptions{})
	if err != nil {
		return nil, IssuedCredential{}, err
	}
	if len(issued.Credentials) != 1 {
		return nil, IssuedCredential{}, ErrDesktopStarterInvalid
	}
	grant := &DesktopGrant{
		UserId: user.Id, ProfileId: profile.Id, IssuanceId: issued.Issuance.Id,
		TokenId: issued.Credentials[0].TokenId, CreatedTime: common.GetTimestamp(),
	}
	if err := tx.Create(grant).Error; err != nil {
		return nil, IssuedCredential{}, err
	}
	return grant, issued.Credentials[0], nil
}

func CreateDesktopOAuthCode(userId int, provider string, codeChallenge string) (string, error) {
	provider = strings.ToLower(strings.TrimSpace(provider))
	codeChallenge = strings.TrimSpace(codeChallenge)
	if userId <= 0 || provider == "" || len(provider) > 32 || len(codeChallenge) < 32 || len(codeChallenge) > 128 {
		return "", ErrDesktopOAuthCodeInvalid
	}
	rawCode, err := common.GenerateRandomKey(48)
	if err != nil {
		return "", err
	}
	now := common.GetTimestamp()
	code := &DesktopOAuthCode{
		UserId: userId, Provider: provider, CodeHash: HashDesktopToken(rawCode),
		CodeChallenge: codeChallenge, ExpiresTime: now + 300, CreatedTime: now,
	}
	if err := DB.Create(code).Error; err != nil {
		return "", err
	}
	return rawCode, nil
}

// CreatePendingDesktopOAuthCode records only the verified provider identity.
// A new local user is deliberately not created until the desktop client
// exchanges this code with its PKCE verifier and device payload.
func CreatePendingDesktopOAuthCode(identity DesktopOAuthIdentityInput, codeChallenge string) (string, error) {
	identity.Provider = strings.ToLower(strings.TrimSpace(identity.Provider))
	identity.ProviderUserId = strings.TrimSpace(identity.ProviderUserId)
	identity.Username = strings.TrimSpace(identity.Username)
	identity.DisplayName = strings.TrimSpace(identity.DisplayName)
	identity.Email = NormalizeEmail(identity.Email)
	identity.UsernamePrefix = strings.TrimSpace(identity.UsernamePrefix)
	codeChallenge = strings.TrimSpace(codeChallenge)
	if identity.Provider == "" || len(identity.Provider) > 32 || identity.ProviderId <= 0 ||
		identity.ProviderUserId == "" || len(identity.ProviderUserId) > 256 || len(identity.Username) > 128 ||
		len(identity.DisplayName) > 128 || len(identity.Email) > 256 || len(identity.UsernamePrefix) > 64 ||
		len(codeChallenge) < 32 || len(codeChallenge) > 128 {
		return "", ErrDesktopOAuthIdentityInvalid
	}
	rawCode, err := common.GenerateRandomKey(48)
	if err != nil {
		return "", err
	}
	now := common.GetTimestamp()
	code := &DesktopOAuthCode{
		Provider: identity.Provider, OAuthProviderId: identity.ProviderId,
		OAuthProviderUserId: identity.ProviderUserId, OAuthUsername: identity.Username,
		OAuthDisplayName: identity.DisplayName, OAuthEmail: identity.Email,
		OAuthUsernamePrefix: identity.UsernamePrefix, OAuthRegistrationOpen: identity.RegistrationOpen,
		CodeHash: HashDesktopToken(rawCode), CodeChallenge: codeChallenge,
		ExpiresTime: now + 300, CreatedTime: now,
	}
	if err := DB.Create(code).Error; err != nil {
		return "", err
	}
	return rawCode, nil
}

func CreateDesktopOAuthRequest(input DesktopOAuthRequestInput) (string, error) {
	input.Provider = strings.ToLower(strings.TrimSpace(input.Provider))
	input.CallbackUrl = strings.TrimSpace(input.CallbackUrl)
	input.ClientState = strings.TrimSpace(input.ClientState)
	input.CodeChallenge = strings.TrimSpace(input.CodeChallenge)
	if input.Provider == "" || len(input.Provider) > 32 || input.CallbackUrl == "" || len(input.CallbackUrl) > 512 ||
		input.ClientState == "" || len(input.ClientState) > 128 || len(input.CodeChallenge) < 32 || len(input.CodeChallenge) > 128 {
		return "", ErrDesktopOAuthCodeInvalid
	}
	rawRequest, err := common.GenerateRandomKey(48)
	if err != nil {
		return "", err
	}
	now := common.GetTimestamp()
	request := &DesktopOAuthRequest{
		RequestHash: HashDesktopToken(rawRequest), Provider: input.Provider,
		CallbackUrl: input.CallbackUrl, ClientState: input.ClientState, CodeChallenge: input.CodeChallenge,
		ExpiresTime: now + 300, CreatedTime: now,
	}
	if err := DB.Create(request).Error; err != nil {
		return "", err
	}
	return rawRequest, nil
}

func ConsumeDesktopOAuthRequest(rawRequest string) (*DesktopOAuthRequest, error) {
	rawRequest = strings.TrimSpace(rawRequest)
	if rawRequest == "" {
		return nil, ErrDesktopOAuthCodeInvalid
	}
	request := &DesktopOAuthRequest{}
	err := DB.Transaction(func(tx *gorm.DB) error {
		if err := lockForUpdate(tx).Where("request_hash = ?", HashDesktopToken(rawRequest)).First(request).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrDesktopOAuthCodeInvalid
			}
			return err
		}
		now := common.GetTimestamp()
		if request.ConsumedTime != 0 {
			return ErrDesktopOAuthCodeInvalid
		}
		if request.ExpiresTime <= now {
			return ErrDesktopOAuthCodeExpired
		}
		return tx.Model(request).Update("consumed_time", now).Error
	})
	if err != nil {
		return nil, err
	}
	return request, nil
}

// BindDesktopOAuthRequestState associates the provider-facing OAuth state with
// the already validated desktop request. The state is stored only as a hash so
// a browser callback can be recognized without relying on a SameSite cookie.
func BindDesktopOAuthRequestState(requestId int, rawState string) error {
	rawState = strings.TrimSpace(rawState)
	if requestId <= 0 || rawState == "" || len(rawState) > 128 {
		return ErrDesktopOAuthCodeInvalid
	}
	stateHash := HashDesktopToken(rawState)
	return DB.Transaction(func(tx *gorm.DB) error {
		request := &DesktopOAuthRequest{}
		if err := lockForUpdate(tx).First(request, requestId).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrDesktopOAuthCodeInvalid
			}
			return err
		}
		if request.ConsumedTime == 0 || request.ExpiresTime <= common.GetTimestamp() || request.OAuthStateHash != nil {
			return ErrDesktopOAuthCodeInvalid
		}
		return tx.Model(request).Update("oauth_state_hash", stateHash).Error
	})
}

// ClaimDesktopOAuthRequestByState atomically consumes the browser callback.
// A populated request is returned even for an expired or repeated callback so
// the controller can still send a stable error to the validated loopback URL.
func ClaimDesktopOAuthRequestByState(provider string, rawState string) (*DesktopOAuthRequest, error) {
	provider = strings.ToLower(strings.TrimSpace(provider))
	rawState = strings.TrimSpace(rawState)
	if provider == "" || rawState == "" || len(provider) > 32 || len(rawState) > 128 {
		return nil, ErrDesktopOAuthCodeInvalid
	}
	request := &DesktopOAuthRequest{}
	err := DB.Transaction(func(tx *gorm.DB) error {
		lookup := lockForUpdate(tx).
			Where("provider = ? AND oauth_state_hash = ?", provider, HashDesktopToken(rawState)).
			Limit(1).
			Find(request)
		if lookup.Error != nil {
			return lookup.Error
		}
		if lookup.RowsAffected == 0 {
			return ErrDesktopOAuthCodeInvalid
		}
		if request.CallbackConsumedTime != 0 {
			return ErrDesktopOAuthCallbackConsumed
		}
		if request.ExpiresTime <= common.GetTimestamp() {
			return ErrDesktopOAuthCodeExpired
		}
		now := common.GetTimestamp()
		if err := tx.Model(request).Update("callback_consumed_time", now).Error; err != nil {
			return err
		}
		request.CallbackConsumedTime = now
		return nil
	})
	if request.Id == 0 {
		return nil, err
	}
	return request, err
}

func desktopPKCEChallenge(verifier string) string {
	digest := common.Sha256Raw([]byte(strings.TrimSpace(verifier)))
	return base64.RawURLEncoding.EncodeToString(digest)
}

func linkDesktopUserWithTx(tx *gorm.DB, profile *IssuanceProfile, user *User, input DesktopEnrollmentInput, refreshToken string, result *DesktopEnrollmentResult) error {
	grant, err := GetDesktopGrantForUser(tx, user.Id)
	var credential IssuedCredential
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if err := ValidateDesktopStarterProfile(profile); err != nil {
			return err
		}
		_, credential, err = createDesktopGrantWithTx(tx, profile, user)
		if err != nil {
			return err
		}
	} else if err != nil {
		return err
	} else {
		grantedProfile := &IssuanceProfile{}
		if err := tx.First(grantedProfile, grant.ProfileId).Error; err != nil {
			return err
		}
		result.Profile = grantedProfile
		token := &Token{}
		if err := tx.First(token, "id = ? AND user_id = ?", grant.TokenId, user.Id).Error; err != nil {
			return err
		}
		if token.Status != common.TokenStatusEnabled || (token.ExpiredTime != -1 && token.ExpiredTime <= common.GetTimestamp()) {
			return ErrDesktopCredentialUnavailable
		}
		credential = credentialFromToken(token)
	}
	device, err := createOrRelinkDesktopDeviceWithTx(tx, user.Id, input, refreshToken)
	if err != nil {
		return err
	}
	result.User = user
	result.Device = device
	result.Credential = credential
	return nil
}

func CreateDesktopEnrollment(profile *IssuanceProfile, rawInput DesktopEnrollmentInput) (*DesktopEnrollmentResult, error) {
	if err := ValidateDesktopStarterProfile(profile); err != nil {
		return nil, err
	}
	input, err := validateDesktopEnrollmentInput(rawInput)
	if err != nil {
		return nil, err
	}
	usernameTaken, err := CheckUserExistOrDeleted(input.Username, "")
	if err != nil {
		return nil, err
	}
	if usernameTaken {
		return nil, ErrDesktopUsernameUnavailable
	}
	refreshToken, err := common.GenerateRandomKey(48)
	if err != nil {
		return nil, err
	}
	result := &DesktopEnrollmentResult{Profile: profile, RefreshToken: refreshToken}
	user := &User{
		Username: input.Username, Password: input.Password, DisplayName: input.Username, Email: input.Email,
		Role: common.RoleCommonUser, Status: common.UserStatusEnabled, Group: "default",
	}
	err = DB.Transaction(func(tx *gorm.DB) error {
		if err := user.InsertWithTx(tx, 0); err != nil {
			return err
		}
		_, credential, err := createDesktopGrantWithTx(tx, profile, user)
		if err != nil {
			return err
		}
		device, err := createOrRelinkDesktopDeviceWithTx(tx, user.Id, input, refreshToken)
		if err != nil {
			return err
		}
		result.User = user
		result.Device = device
		result.Credential = credential
		return nil
	})
	if err != nil {
		usernameTaken, lookupErr := CheckUserExistOrDeleted(input.Username, "")
		if lookupErr == nil && usernameTaken {
			return nil, ErrDesktopUsernameUnavailable
		}
		return nil, err
	}
	user.FinishInsert(0)
	_ = InvalidateUserCache(user.Id)
	RecordLog(user.Id, LogTypeSystem, "IterLoop desktop enrollment completed")
	user.Password = ""
	user.AccessToken = nil
	return result, nil
}

func LinkDesktopDevice(profile *IssuanceProfile, email string, rawInput DesktopEnrollmentInput) (*DesktopEnrollmentResult, error) {
	input, err := normalizeDesktopDeviceInput(DesktopEnrollmentInput{
		Email: email, InstallId: rawInput.InstallId,
		DeviceName: rawInput.DeviceName, Platform: rawInput.Platform, AppVersion: rawInput.AppVersion,
	})
	if err != nil {
		return nil, err
	}
	input.Email = NormalizeEmail(email)
	if input.Email == "" || !strings.Contains(input.Email, "@") || len(input.Email) > 50 {
		return nil, ErrDesktopInvalidEnrollment
	}
	user, err := GetUniqueUserByEmail(input.Email)
	if err != nil {
		return nil, err
	}
	refreshToken, err := common.GenerateRandomKey(48)
	if err != nil {
		return nil, err
	}
	result := &DesktopEnrollmentResult{Profile: profile, RefreshToken: refreshToken}
	err = DB.Transaction(func(tx *gorm.DB) error {
		if err := lockForUpdate(tx).First(user, user.Id).Error; err != nil {
			return err
		}
		return linkDesktopUserWithTx(tx, profile, user, input, refreshToken, result)
	})
	if err != nil {
		return nil, err
	}
	_ = InvalidateUserCache(user.Id)
	RecordLog(user.Id, LogTypeSystem, "IterLoop desktop device linked")
	user.Password = ""
	user.AccessToken = nil
	return result, nil
}

func desktopOAuthUsernameAvailableWithTx(tx *gorm.DB, username string) (bool, error) {
	var count int64
	if err := tx.Unscoped().Model(&User{}).Where("username = ?", username).Count(&count).Error; err != nil {
		return false, err
	}
	return count == 0, nil
}

func desktopOAuthUsernameWithTx(tx *gorm.DB, code *DesktopOAuthCode) (string, error) {
	preferred := strings.TrimSpace(code.OAuthUsername)
	if preferred != "" && len(preferred) <= UserNameMaxLength {
		available, err := desktopOAuthUsernameAvailableWithTx(tx, preferred)
		if err != nil {
			return "", err
		}
		if available {
			return preferred, nil
		}
	}
	prefix := strings.TrimSpace(code.OAuthUsernamePrefix)
	if prefix == "" {
		prefix = strings.TrimSpace(code.Provider) + "_"
	}
	for attempt := 0; attempt < 32; attempt++ {
		suffix := HashDesktopToken(fmt.Sprintf("%s:%d", code.OAuthProviderUserId, attempt))[:10]
		prefixLimit := UserNameMaxLength - len(suffix)
		candidatePrefix := prefix
		if len(candidatePrefix) > prefixLimit {
			candidatePrefix = candidatePrefix[:prefixLimit]
		}
		candidate := candidatePrefix + suffix
		available, err := desktopOAuthUsernameAvailableWithTx(tx, candidate)
		if err != nil {
			return "", err
		}
		if available {
			return candidate, nil
		}
	}
	return "", ErrDesktopUsernameUnavailable
}

func truncateDesktopOAuthDisplayName(value string) string {
	value = strings.TrimSpace(value)
	runes := []rune(value)
	if len(runes) > UserNameMaxLength {
		return string(runes[:UserNameMaxLength])
	}
	return value
}

func resolveDesktopOAuthUserWithTx(tx *gorm.DB, code *DesktopOAuthCode) (*User, bool, error) {
	if code.UserId > 0 {
		user := &User{}
		if err := lockForUpdate(tx).First(user, code.UserId).Error; err != nil {
			return nil, false, err
		}
		return user, false, nil
	}
	if code.OAuthProviderId <= 0 || strings.TrimSpace(code.OAuthProviderUserId) == "" {
		return nil, false, ErrDesktopOAuthIdentityInvalid
	}
	binding := &UserOAuthBinding{}
	err := lockForUpdate(tx).
		Where("provider_id = ? AND provider_user_id = ?", code.OAuthProviderId, code.OAuthProviderUserId).
		First(binding).Error
	if err == nil {
		user := &User{}
		if err := lockForUpdate(tx).First(user, binding.UserId).Error; err != nil {
			return nil, false, err
		}
		return user, false, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}
	if !code.OAuthRegistrationOpen {
		return nil, false, ErrDesktopOAuthRegisterDisabled
	}
	email := NormalizeEmail(code.OAuthEmail)
	if len(email) > 50 {
		return nil, false, ErrDesktopOAuthIdentityInvalid
	}
	// If an account already owns this Google-verified email, link the OAuth
	// identity to it and sign in, instead of failing with "email already
	// registered". Google verifies email ownership, so linking is safe.
	if email != "" {
		existing := &User{}
		lookup := lockForUpdate(tx).Where("email = ?", email).Limit(1).Find(existing)
		if lookup.Error != nil {
			return nil, false, lookup.Error
		}
		if lookup.RowsAffected > 0 && existing.Id > 0 {
			binding = &UserOAuthBinding{
				UserId: existing.Id, ProviderId: code.OAuthProviderId, ProviderUserId: code.OAuthProviderUserId,
			}
			if err := CreateUserOAuthBindingWithTx(tx, binding); err != nil {
				return nil, false, err
			}
			return existing, false, nil
		}
	}
	username, err := desktopOAuthUsernameWithTx(tx, code)
	if err != nil {
		return nil, false, err
	}
	displayName := truncateDesktopOAuthDisplayName(code.OAuthDisplayName)
	if displayName == "" {
		displayName = truncateDesktopOAuthDisplayName(code.OAuthUsername)
	}
	if displayName == "" {
		displayName = truncateDesktopOAuthDisplayName(code.Provider + " User")
	}
	user := &User{
		Username: username, DisplayName: displayName, Email: email,
		Role: common.RoleCommonUser, Status: common.UserStatusEnabled, Group: "default",
	}
	if err := user.InsertWithTx(tx, 0); err != nil {
		return nil, false, err
	}
	binding = &UserOAuthBinding{
		UserId: user.Id, ProviderId: code.OAuthProviderId, ProviderUserId: code.OAuthProviderUserId,
	}
	if err := CreateUserOAuthBindingWithTx(tx, binding); err != nil {
		return nil, false, err
	}
	return user, true, nil
}

func ExchangeDesktopOAuthCode(profile *IssuanceProfile, rawCode string, verifier string, rawInput DesktopEnrollmentInput) (*DesktopEnrollmentResult, error) {
	input, err := normalizeDesktopDeviceInput(rawInput)
	if err != nil {
		return nil, err
	}
	rawCode = strings.TrimSpace(rawCode)
	verifier = strings.TrimSpace(verifier)
	if rawCode == "" || len(verifier) < 43 || len(verifier) > 128 {
		return nil, ErrDesktopOAuthCodeInvalid
	}
	refreshToken, err := common.GenerateRandomKey(48)
	if err != nil {
		return nil, err
	}
	result := &DesktopEnrollmentResult{Profile: profile, RefreshToken: refreshToken}
	createdUser := false
	err = DB.Transaction(func(tx *gorm.DB) error {
		code := &DesktopOAuthCode{}
		if err := lockForUpdate(tx).Where("code_hash = ?", HashDesktopToken(rawCode)).First(code).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrDesktopOAuthCodeInvalid
			}
			return err
		}
		now := common.GetTimestamp()
		if code.ConsumedTime != 0 {
			return ErrDesktopOAuthCodeInvalid
		}
		if code.ExpiresTime <= now {
			return ErrDesktopOAuthCodeExpired
		}
		challenge := desktopPKCEChallenge(verifier)
		if len(challenge) != len(code.CodeChallenge) || subtle.ConstantTimeCompare([]byte(challenge), []byte(code.CodeChallenge)) != 1 {
			return ErrDesktopOAuthCodeInvalid
		}
		user, created, err := resolveDesktopOAuthUserWithTx(tx, code)
		if err != nil {
			return err
		}
		if user.Status != common.UserStatusEnabled {
			return ErrDesktopOAuthCodeInvalid
		}
		if err := linkDesktopUserWithTx(tx, profile, user, input, refreshToken, result); err != nil {
			return err
		}
		if err := tx.Model(code).Updates(map[string]any{
			"user_id":                 user.Id,
			"consumed_time":           now,
			"oauth_provider_id":       0,
			"oauth_provider_user_id":  "",
			"oauth_username":          "",
			"oauth_display_name":      "",
			"oauth_email":             "",
			"oauth_username_prefix":   "",
			"oauth_registration_open": false,
			"code_challenge":          "",
		}).Error; err != nil {
			return err
		}
		createdUser = created
		return nil
	})
	if err != nil {
		return nil, err
	}
	if createdUser {
		result.User.FinalizeOAuthUserCreation(0)
	}
	_ = InvalidateUserCache(result.User.Id)
	RecordLog(result.User.Id, LogTypeSystem, "IterLoop desktop OAuth device linked")
	result.User.Password = ""
	result.User.AccessToken = nil
	return result, nil
}

func RefreshDesktopSession(currentToken string, appVersion string) (string, *DesktopSessionSummary, error) {
	currentToken = strings.TrimSpace(currentToken)
	appVersion = strings.TrimSpace(appVersion)
	if currentToken == "" {
		return "", nil, ErrDesktopDeviceNotFound
	}
	if appVersion == "" || len(appVersion) > 32 {
		return "", nil, ErrDesktopInvalidDevice
	}
	newToken, err := common.GenerateRandomKey(48)
	if err != nil {
		return "", nil, err
	}
	summary := &DesktopSessionSummary{}
	err = DB.Transaction(func(tx *gorm.DB) error {
		device := &DesktopDevice{}
		tokenHash := HashDesktopToken(currentToken)
		usingGraceToken := false
		lookup := lockForUpdate(tx).Where("refresh_token_hash = ?", tokenHash).Limit(1).Find(device)
		if lookup.Error != nil {
			return lookup.Error
		}
		if lookup.RowsAffected == 0 {
			lookup = lockForUpdate(tx).Where("previous_refresh_token_hash = ?", tokenHash).Limit(1).Find(device)
			if lookup.Error != nil {
				return lookup.Error
			}
			if lookup.RowsAffected == 0 {
				return ErrDesktopDeviceNotFound
			}
			usingGraceToken = true
		}
		if device.Status != DesktopDeviceStatusActive || device.RevokedTime != 0 {
			return ErrDesktopDeviceRevoked
		}
		now := common.GetTimestamp()
		if usingGraceToken && device.RefreshTokenGraceExpiresTime <= now {
			return ErrDesktopDeviceNotFound
		}
		updates := map[string]any{
			"refresh_token_hash": HashDesktopToken(newToken), "app_version": appVersion,
			"updated_time": now, "last_seen_time": now,
		}
		if !usingGraceToken {
			updates["previous_refresh_token_hash"] = device.RefreshTokenHash
			updates["refresh_token_grace_expires_time"] = now + DesktopRefreshTokenGraceSeconds
		}
		if err := tx.Model(device).Updates(updates).Error; err != nil {
			return err
		}
		if err := tx.First(device, device.Id).Error; err != nil {
			return err
		}
		user := &User{}
		if err := tx.First(user, device.UserId).Error; err != nil {
			return err
		}
		grant, err := GetDesktopGrantForUser(tx, user.Id)
		if err != nil {
			return err
		}
		profile := &IssuanceProfile{}
		if err := tx.First(profile, grant.ProfileId).Error; err != nil {
			return err
		}
		token := &Token{}
		if err := tx.First(token, "id = ? AND user_id = ?", grant.TokenId, user.Id).Error; err != nil {
			return err
		}
		summary.User = user
		summary.Device = device
		summary.Profile = profile
		summary.Credential = credentialFromToken(token)
		summary.Credential.ApiKey = ""
		summary.ServiceStatus = DesktopServiceStatusReady
		if token.Status != common.TokenStatusEnabled || (token.ExpiredTime != -1 && token.ExpiredTime <= common.GetTimestamp()) {
			summary.ServiceStatus = DesktopServiceStatusKeyBad
		}
		return nil
	})
	if err != nil {
		return "", nil, err
	}
	summary.User.Password = ""
	summary.User.AccessToken = nil
	return newToken, summary, nil
}

func RotateDesktopCredential(deviceToken string) (string, error) {
	newKey, err := common.GenerateKey()
	if err != nil {
		return "", err
	}
	oldKey := ""
	err = DB.Transaction(func(tx *gorm.DB) error {
		device := &DesktopDevice{}
		if err := lockForUpdate(tx).Where("refresh_token_hash = ?", HashDesktopToken(deviceToken)).First(device).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrDesktopDeviceNotFound
			}
			return err
		}
		if device.Status != DesktopDeviceStatusActive || device.RevokedTime != 0 {
			return ErrDesktopDeviceRevoked
		}
		grant, err := GetDesktopGrantForUser(tx, device.UserId)
		if err != nil {
			return err
		}
		token := &Token{}
		if err := lockForUpdate(tx).First(token, "id = ? AND user_id = ?", grant.TokenId, device.UserId).Error; err != nil {
			return err
		}
		if token.Status != common.TokenStatusEnabled || (token.ExpiredTime != -1 && token.ExpiredTime <= common.GetTimestamp()) {
			return ErrDesktopCredentialUnavailable
		}
		oldKey = token.Key
		return tx.Model(token).Update("key", newKey).Error
	})
	if err != nil {
		return "", err
	}
	_ = InvalidateTokenKeyCache(oldKey)
	return "sk-" + newKey, nil
}

func RevokeDesktopDevice(deviceId int, userId int, revokeCredential bool) error {
	if deviceId <= 0 {
		return ErrDesktopDeviceNotFound
	}
	var revokedTokenKey string
	err := DB.Transaction(func(tx *gorm.DB) error {
		device := &DesktopDevice{}
		query := lockForUpdate(tx).Where("id = ?", deviceId)
		if userId > 0 {
			query = query.Where("user_id = ?", userId)
		}
		if err := query.First(device).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrDesktopDeviceNotFound
			}
			return err
		}
		now := common.GetTimestamp()
		if err := tx.Model(device).Updates(map[string]any{
			"status": DesktopDeviceStatusRevoked, "revoked_time": now, "updated_time": now,
		}).Error; err != nil {
			return err
		}
		if !revokeCredential {
			return nil
		}
		grant, err := GetDesktopGrantForUser(tx, device.UserId)
		if err != nil {
			return err
		}
		token := &Token{}
		if err := tx.First(token, "id = ? AND user_id = ?", grant.TokenId, device.UserId).Error; err != nil {
			return err
		}
		revokedTokenKey = token.Key
		return tx.Model(token).Update("status", common.TokenStatusDisabled).Error
	})
	if err != nil {
		return err
	}
	if revokedTokenKey != "" {
		_ = InvalidateTokenKeyCache(revokedTokenKey)
	}
	return nil
}
