package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDesktopVersionComparison(t *testing.T) {
	assert.True(t, desktopVersionLessThan("0.1.0", "0.2.0"))
	assert.True(t, desktopVersionLessThan("v1.2.2-beta", "1.2.3"))
	assert.False(t, desktopVersionLessThan("1.2.3", "1.2.3"))
	assert.False(t, desktopVersionLessThan("2.0", "1.9.9"))
	assert.True(t, desktopVersionPattern.MatchString("0.1.0"))
	assert.False(t, desktopVersionPattern.MatchString("latest"))
}

func TestEnrollDesktopReturnsStableCodeForWrongVerificationCode(t *testing.T) {
	gin.SetMode(gin.TestMode)
	settings := operation_setting.GetDesktopSetting()
	original := *settings
	t.Cleanup(func() { *settings = original })
	settings.Enabled = true
	settings.BetaInviteRequired = false
	settings.MinimumClientVersion = "0.1.0"
	settings.LegalVersion = "2026-07-19"

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodPost, "/api/desktop/enroll", strings.NewReader(`{
		"username":"desktop-user","password":"password123","email":"desktop@example.com",
		"verification_code":"000000","legal_version":"2026-07-19",
		"install_id":"install-one","device_name":"Windows PC","platform":"windows","app_version":"0.1.0"
	}`))
	context.Request.Header.Set("Content-Type", "application/json")

	EnrollDesktop(context)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	response := map[string]any{}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	assert.Equal(t, false, response["success"])
	assert.Equal(t, "invalid_verification_code", response["code"])
}

func TestDesktopTurnstileCallbackMustBeLoopback(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(
		http.MethodGet,
		"/api/desktop/turnstile?callback=https%3A%2F%2Fevil.example%2Fiterloop-turnstile%3Fstate%3Dtest",
		nil,
	)

	GetDesktopTurnstilePage(context)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
}
