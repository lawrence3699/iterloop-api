package controller

import (
	"crypto/subtle"
	"errors"
	"fmt"
	"html/template"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var desktopTurnstilePage = template.Must(template.New("desktop-turnstile").Parse(`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>IterLoop 安全验证</title><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<style>body{margin:0;background:#f5f5f7;color:#1d1d1f;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{width:min(420px,calc(100% - 40px));margin:12vh auto;background:#fff;border:1px solid #e8e8ed;border-radius:14px;padding:30px;box-shadow:0 12px 36px rgba(0,0,0,.08)}h1{font-size:24px;margin:0 0 8px}p{color:#6e6e73;line-height:1.5}.cf-turnstile{margin-top:24px}</style></head>
<body data-callback="{{.Callback}}"><main class="card"><h1>完成安全验证</h1><p>验证成功后会自动返回 IterLoop 客户端。</p>
<div class="cf-turnstile" data-sitekey="{{.SiteKey}}" data-callback="turnstileDone"></div></main>
<script>function turnstileDone(token){const target=new URL(document.body.dataset.callback);target.searchParams.set('token',token);window.location.replace(target.toString())}</script>
</body></html>`))

var desktopVersionPattern = regexp.MustCompile(`^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$`)

type desktopDeviceRequest struct {
	InstallId  string `json:"install_id"`
	DeviceName string `json:"device_name"`
	Platform   string `json:"platform"`
	AppVersion string `json:"app_version"`
}

type desktopEnrollRequest struct {
	desktopDeviceRequest
	Username         string `json:"username"`
	Password         string `json:"password"`
	Email            string `json:"email"`
	VerificationCode string `json:"verification_code"`
	LegalVersion     string `json:"legal_version"`
	BetaInviteCode   string `json:"beta_invite_code"`
}

type desktopLinkRequest struct {
	desktopDeviceRequest
	Email            string `json:"email"`
	VerificationCode string `json:"verification_code"`
}

type desktopRefreshRequest struct {
	AppVersion string `json:"app_version"`
}

type desktopRotateRequest struct {
	Email            string `json:"email"`
	VerificationCode string `json:"verification_code"`
}

type desktopRevokeRequest struct {
	RevokeCredential bool `json:"revoke_credential"`
}

func desktopError(c *gin.Context, status int, code string, message string) {
	c.JSON(status, gin.H{"success": false, "code": code, "message": message})
}

func parseDesktopVersion(version string) []int {
	version = strings.TrimPrefix(strings.TrimSpace(version), "v")
	version = strings.SplitN(version, "-", 2)[0]
	parts := strings.Split(version, ".")
	parsed := make([]int, 3)
	for index := 0; index < len(parts) && index < len(parsed); index++ {
		parsed[index], _ = strconv.Atoi(parts[index])
	}
	return parsed
}

func desktopVersionLessThan(version string, minimum string) bool {
	current := parseDesktopVersion(version)
	required := parseDesktopVersion(minimum)
	for index := range current {
		if current[index] != required[index] {
			return current[index] < required[index]
		}
	}
	return false
}

func requireDesktopClientVersion(c *gin.Context, version string) bool {
	minimum := operation_setting.GetDesktopSetting().MinimumClientVersion
	if !desktopVersionPattern.MatchString(strings.TrimSpace(minimum)) {
		desktopError(c, http.StatusServiceUnavailable, "client_policy_invalid", "桌面端最低版本配置无效")
		return false
	}
	if !desktopVersionPattern.MatchString(strings.TrimSpace(version)) || desktopVersionLessThan(version, minimum) {
		desktopError(c, http.StatusUpgradeRequired, "client_upgrade_required", "请更新 IterLoop 客户端后重试")
		return false
	}
	return true
}

func desktopStarterProfile() (*model.IssuanceProfile, error) {
	profileId := operation_setting.GetDesktopSetting().StarterProfileId
	if profileId <= 0 {
		return nil, model.ErrDesktopStarterUnavailable
	}
	profile, err := model.GetIssuanceProfileById(profileId)
	if err != nil {
		return nil, err
	}
	if err := model.ValidateDesktopStarterProfile(profile); err != nil {
		return nil, err
	}
	return profile, nil
}

func requireDesktopEnabled(c *gin.Context) bool {
	if !operation_setting.GetDesktopSetting().Enabled {
		desktopError(c, http.StatusServiceUnavailable, "desktop_disabled", "IterLoop 桌面端注册暂未开放")
		return false
	}
	return true
}

func requireDesktopInvite(c *gin.Context, inviteCode string) bool {
	settings := operation_setting.GetDesktopSetting()
	if !settings.BetaInviteRequired {
		return true
	}
	expected := strings.TrimSpace(settings.BetaInviteSecret)
	provided := strings.TrimSpace(inviteCode)
	if expected == "" || len(expected) != len(provided) || subtle.ConstantTimeCompare([]byte(expected), []byte(provided)) != 1 {
		desktopError(c, http.StatusForbidden, "invalid_beta_invite", "Beta 邀请码无效")
		return false
	}
	return true
}

func desktopBearerToken(c *gin.Context) string {
	parts := strings.Fields(c.GetHeader("Authorization"))
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return parts[1]
}

func desktopEnrollmentResponse(result *model.DesktopEnrollmentResult) gin.H {
	return gin.H{
		"user": gin.H{
			"id": result.User.Id, "username": result.User.Username, "email": result.User.Email,
		},
		"device": result.Device,
		"profile": gin.H{
			"id": result.Profile.Id, "name": result.Profile.Name, "expire_days": result.Profile.ExpireDays,
		},
		"credential":           result.Credential,
		"device_refresh_token": result.RefreshToken,
		"service_status":       model.DesktopServiceStatusReady,
	}
}

func GetDesktopBootstrap(c *gin.Context) {
	settings := operation_setting.GetDesktopSetting()
	data := gin.H{
		"enabled": settings.Enabled, "minimum_client_version": settings.MinimumClientVersion,
		"recommended_codex_model":  settings.RecommendedCodexModel,
		"recommended_claude_model": settings.RecommendedClaudeModel,
		"legal_version":            settings.LegalVersion, "beta_invite_required": settings.BetaInviteRequired,
		"turnstile_enabled": common.TurnstileCheckEnabled, "turnstile_site_key": common.TurnstileSiteKey,
		"legal_urls": gin.H{"user_agreement": "/user-agreement", "privacy_policy": "/privacy-policy"},
		"tools": gin.H{
			"codex":  gin.H{"install_url": "https://chatgpt.com/codex/install.ps1"},
			"claude": gin.H{"install_url": "https://claude.ai/install.ps1"},
		},
	}
	if profile, err := desktopStarterProfile(); err == nil {
		data["starter_profile"] = gin.H{
			"id": profile.Id, "name": profile.Name, "description": profile.Description,
			"quota": profile.KeyQuota, "unlimited": profile.UnlimitedQuota, "expire_days": profile.ExpireDays,
			"models": append(commaListForDesktop(profile.CodexModels), commaListForDesktop(profile.ClaudeModels)...),
		}
	}
	common.ApiSuccess(c, data)
}

func GetDesktopTurnstilePage(c *gin.Context) {
	callback, err := url.Parse(c.Query("callback"))
	if err != nil || callback.Scheme != "http" || callback.Path != "/iterloop-turnstile" {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	host := strings.ToLower(callback.Hostname())
	if host != "127.0.0.1" && host != "localhost" && host != "::1" {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	if callback.Query().Get("state") == "" || len(callback.Query().Get("state")) > 128 {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; style-src 'unsafe-inline'")
	if err := desktopTurnstilePage.Execute(c.Writer, gin.H{
		"Callback": callback.String(), "SiteKey": common.TurnstileSiteKey,
	}); err != nil {
		c.AbortWithStatus(http.StatusInternalServerError)
	}
}

func commaListForDesktop(raw string) []string {
	values := make([]string, 0)
	for _, value := range strings.Split(raw, ",") {
		value = strings.TrimSpace(value)
		if value != "" {
			values = append(values, value)
		}
	}
	return values
}

func SendDesktopVerification(c *gin.Context) {
	email := model.NormalizeEmail(c.Query("email"))
	intent := strings.TrimSpace(c.Query("intent"))
	if err := common.Validate.Var(email, "required,email"); err != nil {
		desktopError(c, http.StatusBadRequest, "invalid_email", "邮箱地址无效")
		return
	}
	purpose := ""
	switch intent {
	case "enroll":
		if !requireDesktopEnabled(c) {
			return
		}
		if model.IsEmailAlreadyTaken(email) {
			desktopError(c, http.StatusConflict, "email_already_registered", "该邮箱已经注册")
			return
		}
		purpose = common.DesktopEnrollmentPurpose
	case "link":
		if _, err := model.GetUniqueUserByEmail(email); err != nil {
			desktopError(c, http.StatusNotFound, "account_not_found", "没有找到该邮箱对应的账户")
			return
		}
		purpose = common.DesktopLinkPurpose
	case "credential":
		if _, err := model.GetUniqueUserByEmail(email); err != nil {
			desktopError(c, http.StatusNotFound, "account_not_found", "没有找到该邮箱对应的账户")
			return
		}
		purpose = common.DesktopCredentialPurpose
	default:
		desktopError(c, http.StatusBadRequest, "invalid_verification_intent", "验证码用途无效")
		return
	}
	code := common.GenerateVerificationCode(6)
	common.RegisterVerificationCodeWithKey(email, code, purpose)
	subject := fmt.Sprintf("%s桌面端验证码", common.SystemName)
	content := fmt.Sprintf("<p>您好，你正在连接 %s 桌面客户端。</p><p>验证码为: <strong>%s</strong></p><p>验证码 %d 分钟内有效。</p>", common.SystemName, code, common.VerificationValidMinutes)
	if err := common.SendEmail(subject, email, content); err != nil {
		common.DeleteKey(email, purpose)
		desktopError(c, http.StatusServiceUnavailable, "verification_delivery_failed", "验证码发送失败")
		return
	}
	common.ApiSuccess(c, nil)
}

func EnrollDesktop(c *gin.Context) {
	if !requireDesktopEnabled(c) {
		return
	}
	request := &desktopEnrollRequest{}
	if err := common.DecodeJson(c.Request.Body, request); err != nil {
		desktopError(c, http.StatusBadRequest, "invalid_request", "注册信息无效")
		return
	}
	if !requireDesktopClientVersion(c, request.AppVersion) || !requireDesktopInvite(c, request.BetaInviteCode) {
		return
	}
	settings := operation_setting.GetDesktopSetting()
	if strings.TrimSpace(request.LegalVersion) != settings.LegalVersion {
		desktopError(c, http.StatusConflict, "legal_version_changed", "协议已更新，请重新确认")
		return
	}
	request.Email = model.NormalizeEmail(request.Email)
	if !common.VerifyCodeWithKey(request.Email, request.VerificationCode, common.DesktopEnrollmentPurpose) {
		desktopError(c, http.StatusBadRequest, "invalid_verification_code", "邮箱验证码无效或已过期")
		return
	}
	profile, err := desktopStarterProfile()
	if err != nil {
		desktopError(c, http.StatusServiceUnavailable, "starter_unavailable", "Starter 发放方案暂不可用")
		return
	}
	result, err := model.CreateDesktopEnrollment(profile, model.DesktopEnrollmentInput{
		Username: request.Username, Password: request.Password, Email: request.Email,
		InstallId: request.InstallId, DeviceName: request.DeviceName, Platform: request.Platform, AppVersion: request.AppVersion,
	})
	if err != nil {
		handleDesktopModelError(c, err)
		return
	}
	common.DeleteKey(request.Email, common.DesktopEnrollmentPurpose)
	common.ApiSuccess(c, desktopEnrollmentResponse(result))
}

func LinkDesktop(c *gin.Context) {
	request := &desktopLinkRequest{}
	if err := common.DecodeJson(c.Request.Body, request); err != nil {
		desktopError(c, http.StatusBadRequest, "invalid_request", "设备连接信息无效")
		return
	}
	if !requireDesktopClientVersion(c, request.AppVersion) {
		return
	}
	request.Email = model.NormalizeEmail(request.Email)
	if !common.VerifyCodeWithKey(request.Email, request.VerificationCode, common.DesktopLinkPurpose) {
		desktopError(c, http.StatusBadRequest, "invalid_verification_code", "邮箱验证码无效或已过期")
		return
	}
	profile, _ := desktopStarterProfile()
	result, err := model.LinkDesktopDevice(profile, request.Email, model.DesktopEnrollmentInput{
		Email: request.Email, InstallId: request.InstallId, DeviceName: request.DeviceName,
		Platform: request.Platform, AppVersion: request.AppVersion,
	})
	if err != nil {
		handleDesktopModelError(c, err)
		return
	}
	common.DeleteKey(request.Email, common.DesktopLinkPurpose)
	common.ApiSuccess(c, desktopEnrollmentResponse(result))
}

func RefreshDesktopSession(c *gin.Context) {
	request := &desktopRefreshRequest{}
	if err := common.DecodeJson(c.Request.Body, request); err != nil {
		desktopError(c, http.StatusBadRequest, "invalid_request", "会话刷新信息无效")
		return
	}
	if !requireDesktopClientVersion(c, request.AppVersion) {
		return
	}
	newToken, summary, err := model.RefreshDesktopSession(desktopBearerToken(c), request.AppVersion)
	if err != nil {
		handleDesktopModelError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"device_refresh_token": newToken,
		"user":                 gin.H{"id": summary.User.Id, "username": summary.User.Username, "email": summary.User.Email},
		"device":               summary.Device,
		"profile":              gin.H{"id": summary.Profile.Id, "name": summary.Profile.Name},
		"credential":           summary.Credential,
		"service_status":       summary.ServiceStatus,
	})
}

func RotateDesktopCredential(c *gin.Context) {
	request := &desktopRotateRequest{}
	if err := common.DecodeJson(c.Request.Body, request); err != nil {
		desktopError(c, http.StatusBadRequest, "invalid_request", "凭据轮换信息无效")
		return
	}
	deviceToken := desktopBearerToken(c)
	device, err := model.FindActiveDesktopDeviceByToken(deviceToken)
	if err != nil {
		handleDesktopModelError(c, err)
		return
	}
	user := &model.User{}
	if err := model.DB.First(user, device.UserId).Error; err != nil {
		handleDesktopModelError(c, err)
		return
	}
	request.Email = model.NormalizeEmail(request.Email)
	if request.Email != model.NormalizeEmail(user.Email) || !common.VerifyCodeWithKey(request.Email, request.VerificationCode, common.DesktopCredentialPurpose) {
		desktopError(c, http.StatusBadRequest, "invalid_verification_code", "邮箱验证码无效或已过期")
		return
	}
	apiKey, err := model.RotateDesktopCredential(deviceToken)
	if err != nil {
		handleDesktopModelError(c, err)
		return
	}
	common.DeleteKey(request.Email, common.DesktopCredentialPurpose)
	common.ApiSuccess(c, gin.H{"api_key": apiKey})
}

func ListMyDesktopDevices(c *gin.Context) {
	device, err := model.FindActiveDesktopDeviceByToken(desktopBearerToken(c))
	if err != nil {
		handleDesktopModelError(c, err)
		return
	}
	devices, err := model.ListDesktopDevices(device.UserId)
	if err != nil {
		handleDesktopModelError(c, err)
		return
	}
	common.ApiSuccess(c, devices)
}

func RevokeMyDesktopDevice(c *gin.Context) {
	current, err := model.FindActiveDesktopDeviceByToken(desktopBearerToken(c))
	if err != nil {
		handleDesktopModelError(c, err)
		return
	}
	deviceId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		desktopError(c, http.StatusBadRequest, "invalid_device", "设备编号无效")
		return
	}
	request := &desktopRevokeRequest{}
	if c.Request.ContentLength > 0 {
		if err := common.DecodeJson(c.Request.Body, request); err != nil {
			desktopError(c, http.StatusBadRequest, "invalid_request", "撤销选项无效")
			return
		}
	}
	if err := model.RevokeDesktopDevice(deviceId, current.UserId, request.RevokeCredential); err != nil {
		handleDesktopModelError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func AdminListDesktopDevices(c *gin.Context) {
	userId, _ := strconv.Atoi(c.Query("user_id"))
	devices, err := model.ListDesktopDevices(userId)
	if err != nil {
		handleDesktopModelError(c, err)
		return
	}
	common.ApiSuccess(c, devices)
}

func AdminRevokeDesktopDevice(c *gin.Context) {
	deviceId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		desktopError(c, http.StatusBadRequest, "invalid_device", "设备编号无效")
		return
	}
	request := &desktopRevokeRequest{}
	if c.Request.ContentLength > 0 {
		if err := common.DecodeJson(c.Request.Body, request); err != nil {
			desktopError(c, http.StatusBadRequest, "invalid_request", "撤销选项无效")
			return
		}
	}
	if err := model.RevokeDesktopDevice(deviceId, 0, request.RevokeCredential); err != nil {
		handleDesktopModelError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func handleDesktopModelError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, model.ErrDesktopDeviceNotFound):
		desktopError(c, http.StatusUnauthorized, "device_not_found", "设备凭据无效")
	case errors.Is(err, model.ErrDesktopDeviceRevoked):
		desktopError(c, http.StatusUnauthorized, "device_revoked", "设备已经被撤销")
	case errors.Is(err, model.ErrDesktopInstallClaimed):
		desktopError(c, http.StatusConflict, "install_already_claimed", "该客户端已经连接其他账户")
	case errors.Is(err, model.ErrDesktopStarterUnavailable), errors.Is(err, model.ErrDesktopStarterInvalid):
		desktopError(c, http.StatusServiceUnavailable, "starter_unavailable", "Starter 发放方案暂不可用")
	case errors.Is(err, model.ErrDesktopCredentialUnavailable):
		desktopError(c, http.StatusConflict, "credential_unavailable", "桌面端 Key 已失效，请联系管理员")
	case errors.Is(err, model.ErrDesktopInvalidDevice):
		desktopError(c, http.StatusBadRequest, "invalid_device", "设备信息无效")
	case errors.Is(err, model.ErrDesktopInvalidEnrollment):
		desktopError(c, http.StatusBadRequest, "invalid_enrollment", "注册信息无效")
	case errors.Is(err, model.ErrDesktopUsernameUnavailable):
		desktopError(c, http.StatusConflict, "username_already_registered", "该用户名已经注册")
	case errors.Is(err, model.ErrEmailAlreadyTaken):
		desktopError(c, http.StatusConflict, "email_already_registered", "该邮箱已经注册")
	case errors.Is(err, gorm.ErrDuplicatedKey), strings.Contains(strings.ToLower(err.Error()), "unique"):
		desktopError(c, http.StatusConflict, "trial_already_claimed", "Starter 试用已经领取")
	default:
		common.SysError("desktop API error: " + err.Error())
		desktopError(c, http.StatusInternalServerError, "desktop_internal_error", "桌面端服务暂时不可用")
	}
}
