package controller

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/oauth"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
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

func TestDesktopAuthenticationIntentSelectsEnrollForUnknownEmail(t *testing.T) {
	db := openTokenControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.User{}))

	intent, purpose, err := desktopAuthenticationIntent("new@example.com")

	require.NoError(t, err)
	assert.Equal(t, "enroll", intent)
	assert.Equal(t, common.DesktopEnrollmentPurpose, purpose)
}

func TestDesktopAuthenticationIntentSelectsLinkForExistingEmail(t *testing.T) {
	db := openTokenControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.User{}))
	require.NoError(t, db.Create(&model.User{
		Username: "desktop-existing",
		Email:    "existing@example.com",
		Password: "password123",
		Status:   common.UserStatusEnabled,
	}).Error)

	intent, purpose, err := desktopAuthenticationIntent("EXISTING@example.com")

	require.NoError(t, err)
	assert.Equal(t, "link", intent)
	assert.Equal(t, common.DesktopLinkPurpose, purpose)
}

func prepareDesktopOAuthBrowserRequest(t *testing.T, providerState string) {
	t.Helper()
	db := openTokenControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.DesktopOAuthRequest{}, &model.DesktopOAuthCode{}, &model.User{}))
	rawRequest, err := model.CreateDesktopOAuthRequest(model.DesktopOAuthRequestInput{
		Provider: "google", CallbackUrl: "http://127.0.0.1:34567/iterloop-oauth?state=client-state",
		ClientState: "client-state", CodeChallenge: strings.Repeat("c", 43),
	})
	require.NoError(t, err)
	request, err := model.ConsumeDesktopOAuthRequest(rawRequest)
	require.NoError(t, err)
	require.NoError(t, model.BindDesktopOAuthRequestState(request.Id, providerState))
}

func performDesktopOAuthBrowserCallback(t *testing.T, target string) *httptest.ResponseRecorder {
	t.Helper()
	router := gin.New()
	router.Use(sessions.Sessions("session", cookie.NewStore([]byte("desktop-oauth-test"))))
	router.GET("/oauth/:provider", func(c *gin.Context) {
		if !HandleDesktopOAuthBrowserCallback(c) {
			c.Status(http.StatusTeapot)
		}
	})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, target, nil))
	return recorder
}

func TestDesktopOAuthCancellationRedirectsErrorAndStateToLoopback(t *testing.T) {
	gin.SetMode(gin.TestMode)
	prepareDesktopOAuthBrowserRequest(t, "provider-state")

	recorder := performDesktopOAuthBrowserCallback(
		t,
		"/oauth/google?state=provider-state&error=access_denied",
	)

	assert.Equal(t, http.StatusFound, recorder.Code)
	location, err := url.Parse(recorder.Header().Get("Location"))
	require.NoError(t, err)
	assert.Equal(t, "http", location.Scheme)
	assert.Equal(t, "127.0.0.1:34567", location.Host)
	assert.Equal(t, "/iterloop-oauth", location.Path)
	assert.Equal(t, "client-state", location.Query().Get("state"))
	assert.Equal(t, "oauth_cancelled", location.Query().Get("error"))
	assert.Empty(t, location.Query().Get("code"))
}

func TestDesktopOAuthProviderFailureRedirectsErrorAndStateToLoopback(t *testing.T) {
	gin.SetMode(gin.TestMode)
	prepareDesktopOAuthBrowserRequest(t, "provider-state")
	previousProvider := oauth.GetProvider("google")
	oauth.Unregister("google")
	t.Cleanup(func() {
		if previousProvider != nil {
			oauth.Register("google", previousProvider)
		}
	})

	recorder := performDesktopOAuthBrowserCallback(
		t,
		"/oauth/google?state=provider-state&code=provider-code",
	)

	assert.Equal(t, http.StatusFound, recorder.Code)
	location, err := url.Parse(recorder.Header().Get("Location"))
	require.NoError(t, err)
	assert.Equal(t, "client-state", location.Query().Get("state"))
	assert.Equal(t, "oauth_provider_unavailable", location.Query().Get("error"))
	assert.Empty(t, location.Query().Get("code"))
}

func TestDesktopOAuthMiddlewareLeavesOrdinaryWebsiteStateUntouched(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := openTokenControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.DesktopOAuthRequest{}))

	recorder := performDesktopOAuthBrowserCallback(t, "/oauth/google?state=website-state&code=website-code")

	assert.Equal(t, http.StatusTeapot, recorder.Code)
}

func TestDesktopOAuthBrowserSuccessCreatesPendingCodeWithoutUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	prepareDesktopOAuthBrowserRequest(t, "provider-state")
	providerServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
		switch request.URL.Path {
		case "/token":
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"access_token":"google-token","token_type":"Bearer"}`))
		case "/user":
			assert.Equal(t, "Bearer google-token", request.Header.Get("Authorization"))
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"sub":"google-subject","name":"Google User","email":"google@example.com"}`))
		default:
			http.NotFound(w, request)
		}
	}))
	t.Cleanup(providerServer.Close)
	previousProvider := oauth.GetProvider("google")
	oauth.Register("google", oauth.NewGenericOAuthProvider(&model.CustomOAuthProvider{
		Id: 101, Name: "Google", Slug: "google", Enabled: true,
		ClientId: "client", ClientSecret: "secret", TokenEndpoint: providerServer.URL + "/token",
		UserInfoEndpoint: providerServer.URL + "/user", UserIdField: "sub",
		DisplayNameField: "name", EmailField: "email", AuthStyle: oauth.AuthStyleInParams,
	}))
	t.Cleanup(func() {
		if previousProvider == nil {
			oauth.Unregister("google")
		} else {
			oauth.Register("google", previousProvider)
		}
	})
	previousRegisterEnabled := common.RegisterEnabled
	common.RegisterEnabled = true
	t.Cleanup(func() { common.RegisterEnabled = previousRegisterEnabled })

	recorder := performDesktopOAuthBrowserCallback(t, "/oauth/google?state=provider-state&code=provider-code")

	assert.Equal(t, http.StatusFound, recorder.Code)
	location, err := url.Parse(recorder.Header().Get("Location"))
	require.NoError(t, err)
	assert.Equal(t, "client-state", location.Query().Get("state"))
	rawCode := location.Query().Get("code")
	require.NotEmpty(t, rawCode)
	assert.Empty(t, location.Query().Get("error"))
	var userCount int64
	require.NoError(t, model.DB.Model(&model.User{}).Count(&userCount).Error)
	assert.Zero(t, userCount)
	pending := &model.DesktopOAuthCode{}
	require.NoError(t, model.DB.Where("code_hash = ?", model.HashDesktopToken(rawCode)).First(pending).Error)
	assert.Zero(t, pending.UserId)
	assert.Equal(t, 101, pending.OAuthProviderId)
	assert.Equal(t, "google-subject", pending.OAuthProviderUserId)
}
