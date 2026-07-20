package model

import (
	"encoding/hex"
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	DesktopDeviceStatusActive             = "active"
	DesktopDeviceStatusRevoked            = "revoked"
	DesktopServiceStatusReady             = "ready"
	DesktopServiceStatusKeyBad            = "credential_unavailable"
	DesktopRefreshTokenGraceSeconds int64 = 5 * 60
	DesktopOAuthRetentionSeconds    int64 = 24 * 60 * 60
)

var (
	ErrDesktopDeviceNotFound = errors.New("desktop device not found")
	ErrDesktopDeviceRevoked  = errors.New("desktop device revoked")
	ErrDesktopInstallClaimed = errors.New("desktop install is already linked to another user")
	ErrDesktopGrantExists    = errors.New("desktop starter grant already exists")
)

type DesktopDevice struct {
	Id                           int    `json:"id"`
	UserId                       int    `json:"user_id" gorm:"index;not null"`
	InstallId                    string `json:"install_id" gorm:"type:varchar(64);uniqueIndex;not null"`
	DeviceName                   string `json:"device_name" gorm:"type:varchar(128);not null"`
	Platform                     string `json:"platform" gorm:"type:varchar(32);index;not null"`
	AppVersion                   string `json:"app_version" gorm:"type:varchar(32);not null"`
	RefreshTokenHash             string `json:"-" gorm:"type:char(64);uniqueIndex;not null"`
	PreviousRefreshTokenHash     string `json:"-" gorm:"type:char(64);index;not null;default:''"`
	RefreshTokenGraceExpiresTime int64  `json:"-" gorm:"bigint;index;not null;default:0"`
	Status                       string `json:"status" gorm:"type:varchar(16);index;not null"`
	CreatedTime                  int64  `json:"created_time" gorm:"bigint;not null"`
	UpdatedTime                  int64  `json:"updated_time" gorm:"bigint;not null"`
	LastSeenTime                 int64  `json:"last_seen_time" gorm:"bigint;index;not null"`
	RevokedTime                  int64  `json:"revoked_time" gorm:"bigint;not null"`
}

type DesktopGrant struct {
	Id          int   `json:"id"`
	UserId      int   `json:"user_id" gorm:"uniqueIndex:idx_desktop_grant_user_profile;not null"`
	ProfileId   int   `json:"profile_id" gorm:"uniqueIndex:idx_desktop_grant_user_profile;index;not null"`
	IssuanceId  int   `json:"issuance_id" gorm:"uniqueIndex;not null"`
	TokenId     int   `json:"token_id" gorm:"uniqueIndex;not null"`
	CreatedTime int64 `json:"created_time" gorm:"bigint;not null"`
}

type DesktopOAuthCode struct {
	Id                    int    `json:"id"`
	UserId                int    `json:"user_id" gorm:"index;not null"`
	Provider              string `json:"provider" gorm:"type:varchar(32);index;not null"`
	OAuthProviderId       int    `json:"-" gorm:"column:oauth_provider_id;index;not null;default:0"`
	OAuthProviderUserId   string `json:"-" gorm:"column:oauth_provider_user_id;type:varchar(256);not null;default:''"`
	OAuthUsername         string `json:"-" gorm:"column:oauth_username;type:varchar(128);not null;default:''"`
	OAuthDisplayName      string `json:"-" gorm:"column:oauth_display_name;type:varchar(128);not null;default:''"`
	OAuthEmail            string `json:"-" gorm:"column:oauth_email;type:varchar(256);not null;default:''"`
	OAuthUsernamePrefix   string `json:"-" gorm:"column:oauth_username_prefix;type:varchar(64);not null;default:''"`
	OAuthRegistrationOpen bool   `json:"-" gorm:"column:oauth_registration_open;not null;default:false"`
	// GrantStarter records whether a valid beta invite was supplied at prepare
	// time, so the exchange can decide starter (trial credits) vs pay-as-you-go
	// (no credits). Defaults false so a missing/lost flag never grants credits.
	GrantStarter  bool   `json:"-" gorm:"column:grant_starter;not null;default:false"`
	CodeHash      string `json:"-" gorm:"type:char(64);uniqueIndex;not null"`
	CodeChallenge string `json:"-" gorm:"type:varchar(128);not null"`
	ExpiresTime   int64  `json:"expires_time" gorm:"bigint;index;not null"`
	ConsumedTime  int64  `json:"consumed_time" gorm:"bigint;not null"`
	CreatedTime   int64  `json:"created_time" gorm:"bigint;not null"`
}

type DesktopOAuthRequest struct {
	Id             int     `json:"id"`
	RequestHash    string  `json:"-" gorm:"type:char(64);uniqueIndex;not null"`
	Provider       string  `json:"provider" gorm:"type:varchar(32);index;not null"`
	CallbackUrl    string  `json:"-" gorm:"type:varchar(512);not null"`
	ClientState    string  `json:"-" gorm:"type:varchar(128);not null"`
	CodeChallenge  string  `json:"-" gorm:"type:varchar(128);not null"`
	OAuthStateHash *string `json:"-" gorm:"column:oauth_state_hash;type:char(64);unique"`
	// GrantStarter carries beta-invite entitlement from prepare through the
	// browser callback so the exchanged code can grant trial credits.
	GrantStarter         bool  `json:"-" gorm:"column:grant_starter;not null;default:false"`
	ExpiresTime          int64 `json:"expires_time" gorm:"bigint;index;not null"`
	ConsumedTime         int64 `json:"consumed_time" gorm:"bigint;not null"`
	CallbackConsumedTime int64 `json:"callback_consumed_time" gorm:"bigint;not null;default:0"`
	CreatedTime          int64 `json:"created_time" gorm:"bigint;not null"`
}

type DesktopOAuthCleanupResult struct {
	CodesRedacted   int64
	CodesDeleted    int64
	RequestsDeleted int64
}

// CleanupDesktopOAuthTemporaryData removes temporary OAuth data after a
// bounded retention window. Expired codes are de-identified immediately even
// while their non-sensitive audit record remains available during retention.
// The expires_time guard is intentional: a currently valid request or code is
// never deleted, even if another timestamp is malformed or unexpectedly old.
func CleanupDesktopOAuthTemporaryData(now int64, retentionSeconds int64) (DesktopOAuthCleanupResult, error) {
	result := DesktopOAuthCleanupResult{}
	if now <= 0 || retentionSeconds < 0 {
		return result, errors.New("invalid desktop oauth cleanup window")
	}
	deleteBefore := now - retentionSeconds
	err := DB.Transaction(func(tx *gorm.DB) error {
		codeDelete := tx.
			Where("expires_time <= ? AND (expires_time <= ? OR (consumed_time > 0 AND consumed_time <= ?))", now, deleteBefore, deleteBefore).
			Delete(&DesktopOAuthCode{})
		if codeDelete.Error != nil {
			return codeDelete.Error
		}
		result.CodesDeleted = codeDelete.RowsAffected

		requestDelete := tx.
			Where(`expires_time <= ? AND (
				expires_time <= ? OR
				(consumed_time > 0 AND consumed_time <= ?) OR
				(callback_consumed_time > 0 AND callback_consumed_time <= ?)
			)`, now, deleteBefore, deleteBefore, deleteBefore).
			Delete(&DesktopOAuthRequest{})
		if requestDelete.Error != nil {
			return requestDelete.Error
		}
		result.RequestsDeleted = requestDelete.RowsAffected

		codeRedact := tx.Model(&DesktopOAuthCode{}).
			Where("expires_time <= ?", now).
			Where(`(oauth_provider_id <> 0 OR
				oauth_provider_user_id <> '' OR
				oauth_username <> '' OR
				oauth_display_name <> '' OR
				oauth_email <> '' OR
				oauth_username_prefix <> '' OR
				oauth_registration_open = ? OR
				code_challenge <> '')`, true).
			Updates(map[string]any{
				"oauth_provider_id":       0,
				"oauth_provider_user_id":  "",
				"oauth_username":          "",
				"oauth_display_name":      "",
				"oauth_email":             "",
				"oauth_username_prefix":   "",
				"oauth_registration_open": false,
				"code_challenge":          "",
			})
		if codeRedact.Error != nil {
			return codeRedact.Error
		}
		result.CodesRedacted = codeRedact.RowsAffected
		return nil
	})
	return result, err
}

func HashDesktopToken(token string) string {
	return hex.EncodeToString(common.Sha256Raw([]byte(strings.TrimSpace(token))))
}

func FindActiveDesktopDeviceByToken(token string) (*DesktopDevice, error) {
	if strings.TrimSpace(token) == "" {
		return nil, ErrDesktopDeviceNotFound
	}
	device := &DesktopDevice{}
	err := DB.Where("refresh_token_hash = ?", HashDesktopToken(token)).First(device).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrDesktopDeviceNotFound
	}
	if err != nil {
		return nil, err
	}
	if device.Status != DesktopDeviceStatusActive || device.RevokedTime != 0 {
		return nil, ErrDesktopDeviceRevoked
	}
	return device, nil
}

func GetDesktopGrantForUser(tx *gorm.DB, userId int) (*DesktopGrant, error) {
	if tx == nil {
		tx = DB
	}
	grant := &DesktopGrant{}
	err := tx.Where("user_id = ?", userId).Order("id desc").First(grant).Error
	if err != nil {
		return nil, err
	}
	return grant, nil
}

func ListDesktopDevices(userId int) ([]DesktopDevice, error) {
	devices := make([]DesktopDevice, 0)
	query := DB.Order("id desc")
	if userId > 0 {
		query = query.Where("user_id = ?", userId)
	}
	if err := query.Find(&devices).Error; err != nil {
		return nil, err
	}
	return devices, nil
}
