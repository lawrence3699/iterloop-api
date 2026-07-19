package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func hostPolicyRouter(t *testing.T) *gin.Engine {
	t.Helper()
	t.Setenv("ITERLOOP_PUBLIC_HOSTS", "iter-loop.com,www.iter-loop.com")
	t.Setenv("ITERLOOP_CONSOLE_HOST", "console.iter-loop.com")
	t.Setenv("ITERLOOP_API_HOST", "api.iter-loop.com")
	t.Setenv("ITERLOOP_ADMIN_HOST", "admin.iter-loop.com")
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(EnforceIterLoopHostPolicy())
	router.GET("/healthz", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/v1/models", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/api/status", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/api/setup", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/api/pricing", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/api/user-agreement", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/api/privacy-policy", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.POST("/api/pricing", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.POST("/api/setup", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/static/app.js", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/iterloop-desktop-preview.svg", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/media/home/story/overview.avif", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/docs", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/sign-in", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/keys", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/issuances", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/dashboard/overview", func(c *gin.Context) { c.Status(http.StatusOK) })
	return router
}

func TestPublicHostAllowsOnlyPublicPagesAndReadOnlyData(t *testing.T) {
	router := hostPolicyRouter(t)
	require.Equal(t, http.StatusOK, performHostRequest(router, "iter-loop.com", "/docs").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "iter-loop.com", "/static/app.js").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "iter-loop.com", "/media/home/story/overview.avif").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "iter-loop.com", "/api/status").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "iter-loop.com", "/api/setup").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "www.iter-loop.com", "/api/pricing").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "iter-loop.com", "/iterloop-desktop-preview.svg").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "iter-loop.com", "/api/user-agreement").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "iter-loop.com", "/api/privacy-policy").Code)
	require.Equal(t, http.StatusNotFound, performHostRequest(router, "iter-loop.com", "/v1/models").Code)
	require.Equal(t, http.StatusNotFound, performHostRequest(router, "iter-loop.com", "/issuances").Code)
	require.Equal(t, http.StatusNotFound, performHostRequestWithMethod(router, http.MethodPost, "iter-loop.com", "/api/pricing").Code)
	require.Equal(t, http.StatusNotFound, performHostRequestWithMethod(router, http.MethodPost, "iter-loop.com", "/api/setup").Code)
}

func TestPublicHostRedirectsAuthenticationAndConsolePages(t *testing.T) {
	router := hostPolicyRouter(t)
	for _, path := range []string{
		"/sign-in",
		"/keys",
		"/dashboard?section=overview",
		"/user/reset?token=test",
		"/chat2link",
	} {
		response := performHostRequest(router, "iter-loop.com", path)
		require.Equal(t, http.StatusTemporaryRedirect, response.Code)
		require.Equal(t, "https://console.iter-loop.com"+path, response.Header().Get("Location"))
	}
}

func performHostRequest(router *gin.Engine, host string, path string) *httptest.ResponseRecorder {
	return performHostRequestWithMethod(router, http.MethodGet, host, path)
}

func performHostRequestWithMethod(router *gin.Engine, method string, host string, path string) *httptest.ResponseRecorder {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(method, path, nil)
	request.Host = host
	router.ServeHTTP(recorder, request)
	return recorder
}

func TestAPIHostOnlyAllowsModelAndMetadataRoutes(t *testing.T) {
	router := hostPolicyRouter(t)
	require.Equal(t, http.StatusOK, performHostRequest(router, "api.iter-loop.com", "/v1/models").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "api.iter-loop.com", "/healthz").Code)
	require.Equal(t, http.StatusNotFound, performHostRequest(router, "api.iter-loop.com", "/api/status").Code)
}

func TestConsoleAndAdminHostsRejectModelRoutes(t *testing.T) {
	router := hostPolicyRouter(t)
	require.Equal(t, http.StatusNotFound, performHostRequest(router, "console.iter-loop.com", "/v1/models").Code)
	require.Equal(t, http.StatusNotFound, performHostRequest(router, "admin.iter-loop.com", "/v1/models").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "console.iter-loop.com", "/api/status").Code)
}

func TestConsoleHostRejectsAdminPages(t *testing.T) {
	router := hostPolicyRouter(t)
	require.Equal(t, http.StatusNotFound, performHostRequest(router, "console.iter-loop.com", "/issuances").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "admin.iter-loop.com", "/issuances").Code)
	require.Equal(t, http.StatusOK, performHostRequest(router, "console.iter-loop.com", "/dashboard/overview").Code)
}

func TestUnknownHostIsRejected(t *testing.T) {
	router := hostPolicyRouter(t)
	require.Equal(t, http.StatusMisdirectedRequest, performHostRequest(router, "unexpected.example", "/healthz").Code)
}

func TestAdminHostGuardRejectsConsoleHost(t *testing.T) {
	t.Setenv("ITERLOOP_ADMIN_HOST", "admin.iter-loop.com")
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/issuances", nil)
	c.Request.Host = "console.iter-loop.com"
	require.False(t, RequireIterLoopAdminHost(c))
	require.Equal(t, http.StatusNotFound, recorder.Code)
}
