package model

import (
	"errors"
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	IssuanceModeCodex    = "codex"
	IssuanceModeClaude   = "claude"
	IssuanceModeCombined = "combined"
	IssuanceModeSplit    = "split"

	IssuanceStatusActive  = "active"
	IssuanceStatusRevoked = "revoked"
)

type IssuanceProfile struct {
	Id             int    `json:"id"`
	Name           string `json:"name" gorm:"type:varchar(64);uniqueIndex"`
	Description    string `json:"description" gorm:"type:varchar(255)"`
	Mode           string `json:"mode" gorm:"type:varchar(16);not null"`
	BalanceQuota   int    `json:"balance_quota" gorm:"not null;default:0"`
	KeyQuota       int    `json:"key_quota" gorm:"not null;default:0"`
	UnlimitedQuota bool   `json:"unlimited_quota" gorm:"not null;default:false"`
	KeyCount       int    `json:"key_count" gorm:"not null;default:1"`
	ExpireDays     int    `json:"expire_days" gorm:"not null;default:0"`
	CodexModels    string `json:"codex_models" gorm:"type:text"`
	ClaudeModels   string `json:"claude_models" gorm:"type:text"`
	CodexGroup     string `json:"codex_group" gorm:"type:varchar(64);default:'codex-standard'"`
	ClaudeGroup    string `json:"claude_group" gorm:"type:varchar(64);default:'claude-standard'"`
	CombinedGroup  string `json:"combined_group" gorm:"type:varchar(64);default:'combined-standard'"`
	AllowIps       string `json:"allow_ips" gorm:"type:text"`
	Enabled        bool   `json:"enabled" gorm:"not null;default:true"`
	CreatedTime    int64  `json:"created_time" gorm:"bigint;not null"`
	UpdatedTime    int64  `json:"updated_time" gorm:"bigint;not null"`
	CreatedBy      int    `json:"created_by" gorm:"index"`
}

type Issuance struct {
	Id             int    `json:"id"`
	ProfileId      int    `json:"profile_id" gorm:"index;not null"`
	UserId         int    `json:"user_id" gorm:"index;not null"`
	Email          string `json:"email" gorm:"type:varchar(50);index;not null"`
	Status         string `json:"status" gorm:"type:varchar(16);index;not null"`
	BalanceGranted int    `json:"balance_granted" gorm:"not null;default:0"`
	TokenIds       string `json:"token_ids" gorm:"type:text;not null"`
	Note           string `json:"note" gorm:"type:varchar(255)"`
	CreatedBy      int    `json:"created_by" gorm:"index;not null"`
	CreatedTime    int64  `json:"created_time" gorm:"bigint;index;not null"`
	RevokedTime    int64  `json:"revoked_time" gorm:"bigint;default:0"`
}

type IssueAccessOptions struct {
	BalanceQuota *int
	KeyQuota     *int
	ExpireDays   *int
}

type IssuedCredential struct {
	TokenId   int      `json:"token_id"`
	Name      string   `json:"name"`
	ApiKey    string   `json:"api_key"`
	Group     string   `json:"group"`
	Models    []string `json:"models"`
	ExpiresAt int64    `json:"expires_at"`
	Unlimited bool     `json:"unlimited"`
	Quota     int      `json:"quota"`
}

type IssueAccessResult struct {
	Issuance          *Issuance          `json:"issuance"`
	User              *User              `json:"user"`
	Credentials       []IssuedCredential `json:"credentials"`
	AccountCreated    bool               `json:"account_created"`
	TemporaryPassword string             `json:"temporary_password,omitempty"`
}

func cleanCommaList(raw string) string {
	seen := map[string]struct{}{}
	values := make([]string, 0)
	for _, item := range strings.Split(raw, ",") {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		if _, ok := seen[item]; ok {
			continue
		}
		seen[item] = struct{}{}
		values = append(values, item)
	}
	return strings.Join(values, ",")
}

func commaList(raw string) []string {
	cleaned := cleanCommaList(raw)
	if cleaned == "" {
		return []string{}
	}
	return strings.Split(cleaned, ",")
}

func (profile *IssuanceProfile) Normalize() error {
	profile.Name = strings.TrimSpace(profile.Name)
	profile.Description = strings.TrimSpace(profile.Description)
	profile.Mode = strings.ToLower(strings.TrimSpace(profile.Mode))
	profile.CodexModels = cleanCommaList(profile.CodexModels)
	profile.ClaudeModels = cleanCommaList(profile.ClaudeModels)
	profile.CodexGroup = strings.TrimSpace(profile.CodexGroup)
	profile.ClaudeGroup = strings.TrimSpace(profile.ClaudeGroup)
	profile.CombinedGroup = strings.TrimSpace(profile.CombinedGroup)
	profile.AllowIps = strings.TrimSpace(profile.AllowIps)

	if profile.Name == "" || len(profile.Name) > 64 {
		return errors.New("profile name must be between 1 and 64 characters")
	}
	if len(profile.Description) > 255 {
		return errors.New("profile description must not exceed 255 characters")
	}
	switch profile.Mode {
	case IssuanceModeCodex, IssuanceModeClaude, IssuanceModeCombined, IssuanceModeSplit:
	default:
		return errors.New("mode must be codex, claude, combined, or split")
	}
	if profile.BalanceQuota < 0 || profile.KeyQuota < 0 {
		return errors.New("quota values must not be negative")
	}
	if profile.KeyCount == 0 {
		profile.KeyCount = 1
	}
	if profile.KeyCount < 1 || profile.KeyCount > 20 {
		return errors.New("key count must be between 1 and 20")
	}
	if profile.ExpireDays < 0 || profile.ExpireDays > 3650 {
		return errors.New("expire days must be between 0 and 3650")
	}
	if profile.CodexGroup == "" {
		profile.CodexGroup = "codex-standard"
	}
	if profile.ClaudeGroup == "" {
		profile.ClaudeGroup = "claude-standard"
	}
	if profile.CombinedGroup == "" {
		profile.CombinedGroup = "combined-standard"
	}
	if (profile.Mode == IssuanceModeCodex || profile.Mode == IssuanceModeCombined || profile.Mode == IssuanceModeSplit) && profile.CodexModels == "" {
		return errors.New("at least one Codex model is required")
	}
	if (profile.Mode == IssuanceModeClaude || profile.Mode == IssuanceModeCombined || profile.Mode == IssuanceModeSplit) && profile.ClaudeModels == "" {
		return errors.New("at least one Claude model is required")
	}
	return nil
}

func GetIssuanceProfileById(id int) (*IssuanceProfile, error) {
	if id <= 0 {
		return nil, errors.New("invalid profile id")
	}
	profile := &IssuanceProfile{}
	if err := DB.First(profile, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return profile, nil
}

func SearchIssuanceProfiles(keyword string, startIdx int, limit int) ([]IssuanceProfile, int64, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	query := DB.Model(&IssuanceProfile{})
	keyword = strings.TrimSpace(keyword)
	if keyword != "" {
		like := "%" + keyword + "%"
		query = query.Where("name LIKE ? OR description LIKE ?", like, like)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	profiles := make([]IssuanceProfile, 0)
	if err := query.Order("id desc").Offset(startIdx).Limit(limit).Find(&profiles).Error; err != nil {
		return nil, 0, err
	}
	return profiles, total, nil
}

func (profile *IssuanceProfile) Insert() error {
	if err := profile.Normalize(); err != nil {
		return err
	}
	now := common.GetTimestamp()
	profile.CreatedTime = now
	profile.UpdatedTime = now
	enabled := profile.Enabled
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(profile).Error; err != nil {
			return err
		}
		if !enabled {
			if err := tx.Model(profile).UpdateColumn("enabled", false).Error; err != nil {
				return err
			}
			profile.Enabled = false
		}
		return nil
	})
}

func (profile *IssuanceProfile) Update() error {
	if profile.Id <= 0 {
		return errors.New("invalid profile id")
	}
	if err := profile.Normalize(); err != nil {
		return err
	}
	profile.UpdatedTime = common.GetTimestamp()
	return DB.Model(&IssuanceProfile{}).Where("id = ?", profile.Id).Updates(map[string]any{
		"name": profile.Name, "description": profile.Description, "mode": profile.Mode,
		"balance_quota": profile.BalanceQuota, "key_quota": profile.KeyQuota,
		"unlimited_quota": profile.UnlimitedQuota, "key_count": profile.KeyCount,
		"expire_days": profile.ExpireDays, "codex_models": profile.CodexModels,
		"claude_models": profile.ClaudeModels, "codex_group": profile.CodexGroup,
		"claude_group": profile.ClaudeGroup, "combined_group": profile.CombinedGroup,
		"allow_ips": profile.AllowIps, "enabled": profile.Enabled, "updated_time": profile.UpdatedTime,
	}).Error
}

func DeleteIssuanceProfile(id int) error {
	if id <= 0 {
		return errors.New("invalid profile id")
	}
	var count int64
	if err := DB.Model(&Issuance{}).Where("profile_id = ?", id).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("profile has issuance history and cannot be deleted; disable it instead")
	}
	return DB.Delete(&IssuanceProfile{}, "id = ?", id).Error
}

func SearchIssuances(keyword string, startIdx int, limit int) ([]Issuance, int64, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	query := DB.Model(&Issuance{})
	keyword = strings.TrimSpace(keyword)
	if keyword != "" {
		like := "%" + keyword + "%"
		query = query.Where("email LIKE ? OR note LIKE ?", like, like)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	rows := make([]Issuance, 0)
	if err := query.Order("id desc").Offset(startIdx).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func generateIssuanceUsername(tx *gorm.DB, email string) (string, error) {
	local := strings.Split(email, "@")[0]
	var builder strings.Builder
	for _, ch := range strings.ToLower(local) {
		if (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') {
			builder.WriteRune(ch)
		}
	}
	base := builder.String()
	if base == "" {
		base = "user"
	}
	if len(base) > 12 {
		base = base[:12]
	}
	for attempt := 0; attempt < 10; attempt++ {
		suffix, err := common.GenerateRandomCharsKey(6)
		if err != nil {
			return "", err
		}
		candidate := base + suffix
		var count int64
		if err := tx.Unscoped().Model(&User{}).Where("username = ?", candidate).Count(&count).Error; err != nil {
			return "", err
		}
		if count == 0 {
			return candidate, nil
		}
	}
	return "", errors.New("failed to generate a unique username")
}

func createIssuedToken(tx *gorm.DB, userId int, name string, models []string, group string, quota int, unlimited bool, expireDays int, allowIps string) (*Token, IssuedCredential, error) {
	key, err := common.GenerateKey()
	if err != nil {
		return nil, IssuedCredential{}, err
	}
	expiresAt := int64(-1)
	if expireDays > 0 {
		expiresAt = common.GetTimestamp() + int64(expireDays)*86400
	}
	allowIpsCopy := strings.TrimSpace(allowIps)
	token := &Token{
		UserId: userId, Name: name, Key: key, Status: common.TokenStatusEnabled,
		CreatedTime: common.GetTimestamp(), AccessedTime: common.GetTimestamp(),
		ExpiredTime: expiresAt, RemainQuota: quota, UnlimitedQuota: unlimited,
		ModelLimitsEnabled: len(models) > 0, ModelLimits: strings.Join(models, ","),
		AllowIps: &allowIpsCopy, Group: group,
	}
	if err := tx.Create(token).Error; err != nil {
		return nil, IssuedCredential{}, err
	}
	credential := IssuedCredential{
		TokenId: token.Id, Name: token.Name, ApiKey: "sk-" + token.Key, Group: token.Group,
		Models: models, ExpiresAt: expiresAt, Unlimited: unlimited, Quota: quota,
	}
	return token, credential, nil
}

func IssueAccess(profile *IssuanceProfile, email string, note string, createdBy int, options IssueAccessOptions) (*IssueAccessResult, error) {
	if profile == nil || profile.Id <= 0 {
		return nil, errors.New("invalid issuance profile")
	}
	if err := profile.Normalize(); err != nil {
		return nil, err
	}
	if !profile.Enabled {
		return nil, errors.New("issuance profile is disabled")
	}
	email = NormalizeEmail(email)
	if email == "" || !strings.Contains(email, "@") {
		return nil, errors.New("a valid email address is required")
	}
	note = strings.TrimSpace(note)
	if len(note) > 255 {
		return nil, errors.New("note must not exceed 255 characters")
	}
	balanceQuota := profile.BalanceQuota
	keyQuota := profile.KeyQuota
	expireDays := profile.ExpireDays
	if options.BalanceQuota != nil {
		balanceQuota = *options.BalanceQuota
	}
	if options.KeyQuota != nil {
		keyQuota = *options.KeyQuota
	}
	if options.ExpireDays != nil {
		expireDays = *options.ExpireDays
	}
	if balanceQuota < 0 || keyQuota < 0 || expireDays < 0 || expireDays > 3650 {
		return nil, errors.New("invalid quota or expiry override")
	}

	result := &IssueAccessResult{}
	var createdUser *User
	err := DB.Transaction(func(tx *gorm.DB) error {
		users := make([]User, 0, 2)
		if err := tx.Where("LOWER(email) = ?", email).Limit(2).Find(&users).Error; err != nil {
			return err
		}
		var user *User
		switch len(users) {
		case 0:
			username, err := generateIssuanceUsername(tx, email)
			if err != nil {
				return err
			}
			password, err := common.GenerateRandomCharsKey(16)
			if err != nil {
				return err
			}
			displayName := strings.Split(email, "@")[0]
			if len(displayName) > UserNameMaxLength {
				displayName = displayName[:UserNameMaxLength]
			}
			user = &User{Username: username, Password: password, DisplayName: displayName, Email: email,
				Role: common.RoleCommonUser, Status: common.UserStatusEnabled, Group: "default"}
			if err := user.InsertWithTx(tx, 0); err != nil {
				return err
			}
			result.AccountCreated = true
			result.TemporaryPassword = password
			createdUser = user
		case 1:
			user = &users[0]
		default:
			return ErrEmailAmbiguous
		}
		if balanceQuota > 0 {
			if err := tx.Model(&User{}).Where("id = ?", user.Id).Update("quota", gorm.Expr("quota + ?", balanceQuota)).Error; err != nil {
				return err
			}
			user.Quota += balanceQuota
		}

		credentials := make([]IssuedCredential, 0, profile.KeyCount*2)
		tokenIds := make([]int, 0, profile.KeyCount*2)
		add := func(label string, models []string, group string, index int) error {
			name := fmt.Sprintf("%s %s", profile.Name, label)
			if profile.KeyCount > 1 {
				name = fmt.Sprintf("%s %s %d", profile.Name, label, index+1)
			}
			if len(name) > 50 {
				name = name[:50]
			}
			token, credential, err := createIssuedToken(tx, user.Id, name, models, group, keyQuota, profile.UnlimitedQuota, expireDays, profile.AllowIps)
			if err != nil {
				return err
			}
			tokenIds = append(tokenIds, token.Id)
			credentials = append(credentials, credential)
			return nil
		}
		codexModels := commaList(profile.CodexModels)
		claudeModels := commaList(profile.ClaudeModels)
		for index := 0; index < profile.KeyCount; index++ {
			switch profile.Mode {
			case IssuanceModeCodex:
				if err := add("Codex", codexModels, profile.CodexGroup, index); err != nil {
					return err
				}
			case IssuanceModeClaude:
				if err := add("Claude", claudeModels, profile.ClaudeGroup, index); err != nil {
					return err
				}
			case IssuanceModeCombined:
				models := append(append([]string{}, codexModels...), claudeModels...)
				if err := add("Combined", models, profile.CombinedGroup, index); err != nil {
					return err
				}
			case IssuanceModeSplit:
				if err := add("Codex", codexModels, profile.CodexGroup, index); err != nil {
					return err
				}
				if err := add("Claude", claudeModels, profile.ClaudeGroup, index); err != nil {
					return err
				}
			}
		}
		tokenIdsJSON, err := common.Marshal(tokenIds)
		if err != nil {
			return err
		}
		issuance := &Issuance{
			ProfileId: profile.Id, UserId: user.Id, Email: email, Status: IssuanceStatusActive,
			BalanceGranted: balanceQuota, TokenIds: string(tokenIdsJSON), Note: note,
			CreatedBy: createdBy, CreatedTime: common.GetTimestamp(),
		}
		if err := tx.Create(issuance).Error; err != nil {
			return err
		}
		result.Issuance = issuance
		result.User = user
		result.Credentials = credentials
		return nil
	})
	if err != nil {
		return nil, err
	}
	if createdUser != nil {
		createdUser.FinishInsert(0)
	}
	_ = InvalidateUserCache(result.User.Id)
	RecordLog(result.User.Id, LogTypeSystem, fmt.Sprintf("API access issued using profile %s", profile.Name))
	result.User.Password = ""
	result.User.AccessToken = nil
	return result, nil
}

func RevokeIssuance(id int) (*Issuance, error) {
	if id <= 0 {
		return nil, errors.New("invalid issuance id")
	}
	issuance := &Issuance{}
	err := DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(issuance, "id = ?", id).Error; err != nil {
			return err
		}
		if issuance.Status == IssuanceStatusRevoked {
			return nil
		}
		tokenIds := make([]int, 0)
		if err := common.Unmarshal([]byte(issuance.TokenIds), &tokenIds); err != nil {
			return err
		}
		if len(tokenIds) > 0 {
			if err := tx.Model(&Token{}).Where("id IN ? AND user_id = ?", tokenIds, issuance.UserId).Update("status", common.TokenStatusDisabled).Error; err != nil {
				return err
			}
		}
		issuance.Status = IssuanceStatusRevoked
		issuance.RevokedTime = common.GetTimestamp()
		return tx.Model(&Issuance{}).Where("id = ?", issuance.Id).Updates(map[string]any{
			"status": issuance.Status, "revoked_time": issuance.RevokedTime,
		}).Error
	})
	if err != nil {
		return nil, err
	}
	RecordLog(issuance.UserId, LogTypeSystem, fmt.Sprintf("API issuance %d revoked", issuance.Id))
	return issuance, nil
}
