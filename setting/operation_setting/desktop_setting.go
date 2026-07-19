package operation_setting

import "github.com/QuantumNous/new-api/setting/config"

type DesktopSetting struct {
	Enabled                bool   `json:"enabled"`
	StarterProfileId       int    `json:"starter_profile_id"`
	MinimumClientVersion   string `json:"minimum_client_version"`
	RecommendedCodexModel  string `json:"recommended_codex_model"`
	RecommendedClaudeModel string `json:"recommended_claude_model"`
	LegalVersion           string `json:"legal_version"`
	BetaInviteRequired     bool   `json:"beta_invite_required"`
	BetaInviteSecret       string `json:"beta_invite_secret"`
}

var desktopSetting = DesktopSetting{
	Enabled:                false,
	StarterProfileId:       0,
	MinimumClientVersion:   "0.1.0",
	RecommendedCodexModel:  "gpt-5.6-sol",
	RecommendedClaudeModel: "claude-sonnet-5",
	LegalVersion:           "2026-07-19",
	BetaInviteRequired:     true,
	BetaInviteSecret:       "",
}

func init() {
	config.GlobalConfig.Register("desktop_setting", &desktopSetting)
}

func GetDesktopSetting() *DesktopSetting {
	return &desktopSetting
}
