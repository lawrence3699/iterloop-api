package model

import (
	"encoding/hex"
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	DesktopDeviceStatusActive  = "active"
	DesktopDeviceStatusRevoked = "revoked"
	DesktopServiceStatusReady  = "ready"
	DesktopServiceStatusKeyBad = "credential_unavailable"
)

var (
	ErrDesktopDeviceNotFound = errors.New("desktop device not found")
	ErrDesktopDeviceRevoked  = errors.New("desktop device revoked")
	ErrDesktopInstallClaimed = errors.New("desktop install is already linked to another user")
	ErrDesktopGrantExists    = errors.New("desktop starter grant already exists")
)

type DesktopDevice struct {
	Id               int    `json:"id"`
	UserId           int    `json:"user_id" gorm:"index;not null"`
	InstallId        string `json:"install_id" gorm:"type:varchar(64);uniqueIndex;not null"`
	DeviceName       string `json:"device_name" gorm:"type:varchar(128);not null"`
	Platform         string `json:"platform" gorm:"type:varchar(32);index;not null"`
	AppVersion       string `json:"app_version" gorm:"type:varchar(32);not null"`
	RefreshTokenHash string `json:"-" gorm:"type:char(64);uniqueIndex;not null"`
	Status           string `json:"status" gorm:"type:varchar(16);index;not null"`
	CreatedTime      int64  `json:"created_time" gorm:"bigint;not null"`
	UpdatedTime      int64  `json:"updated_time" gorm:"bigint;not null"`
	LastSeenTime     int64  `json:"last_seen_time" gorm:"bigint;index;not null"`
	RevokedTime      int64  `json:"revoked_time" gorm:"bigint;not null"`
}

type DesktopGrant struct {
	Id          int   `json:"id"`
	UserId      int   `json:"user_id" gorm:"uniqueIndex:idx_desktop_grant_user_profile;not null"`
	ProfileId   int   `json:"profile_id" gorm:"uniqueIndex:idx_desktop_grant_user_profile;index;not null"`
	IssuanceId  int   `json:"issuance_id" gorm:"uniqueIndex;not null"`
	TokenId     int   `json:"token_id" gorm:"uniqueIndex;not null"`
	CreatedTime int64 `json:"created_time" gorm:"bigint;not null"`
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
