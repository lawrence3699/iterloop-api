package middleware

import (
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

type iterLoopHosts struct {
	public  map[string]struct{}
	console string
	api     string
	admin   string
}

func configuredIterLoopHosts() iterLoopHosts {
	return iterLoopHosts{
		public:  normalizeHostList(os.Getenv("ITERLOOP_PUBLIC_HOSTS")),
		console: normalizeHost(os.Getenv("ITERLOOP_CONSOLE_HOST")),
		api:     normalizeHost(os.Getenv("ITERLOOP_API_HOST")),
		admin:   normalizeHost(os.Getenv("ITERLOOP_ADMIN_HOST")),
	}
}

func normalizeHostList(raw string) map[string]struct{} {
	hosts := make(map[string]struct{})
	for _, value := range strings.Split(raw, ",") {
		host := normalizeHost(value)
		if host != "" {
			hosts[host] = struct{}{}
		}
	}
	return hosts
}

func normalizeHost(raw string) string {
	raw = strings.ToLower(strings.TrimSpace(raw))
	if raw == "" {
		return ""
	}
	if host, _, err := net.SplitHostPort(raw); err == nil {
		return strings.Trim(host, "[]")
	}
	return strings.Trim(strings.TrimSuffix(raw, "."), "[]")
}

func requestHost(c *gin.Context) string {
	return normalizeHost(c.Request.Host)
}

func (hosts iterLoopHosts) configured() bool {
	return len(hosts.public) > 0 || hosts.console != "" || hosts.api != "" || hosts.admin != ""
}

func (hosts iterLoopHosts) isPublic(host string) bool {
	_, ok := hosts.public[host]
	return ok
}

func isLocalHost(host string) bool {
	return host == "" || host == "localhost" || host == "127.0.0.1" || host == "::1"
}

func hasPathPrefix(path string, prefixes ...string) bool {
	for _, prefix := range prefixes {
		if path == prefix || strings.HasPrefix(path, prefix+"/") {
			return true
		}
	}
	return false
}

func apiHostPathAllowed(path string) bool {
	if hasPathPrefix(path, "/v1") {
		return true
	}
	switch path {
	case "/healthz", "/pricing.json", "/openapi.json", "/.well-known/api-catalog":
		return true
	default:
		return false
	}
}

func publicHostPathAllowed(method string, path string) bool {
	if method == http.MethodOptions {
		return true
	}
	if method != http.MethodGet && method != http.MethodHead {
		return false
	}
	if hasPathPrefix(path, "/pricing", "/docs", "/about") {
		return true
	}
	if hasPathPrefix(path, "/static", "/assets", "/media") {
		return true
	}
	switch path {
	case "/", "/favicon.ico", "/logo.png", "/iterloop-mark.svg", "/iterloop-desktop-preview.svg", "/robots.txt", "/sitemap.xml",
		"/privacy-policy", "/user-agreement", "/api/privacy-policy", "/api/user-agreement",
		"/api/status", "/api/setup", "/api/home_page_content", "/api/pricing":
		return true
	default:
		return false
	}
}

func publicConsoleRedirectPath(path string) bool {
	return hasPathPrefix(
		path,
		"/sign-in",
		"/sign-up",
		"/login",
		"/register",
		"/forgot-password",
		"/reset",
		"/user",
		"/otp",
		"/oauth",
		"/dashboard",
		"/keys",
		"/wallet",
		"/usage-logs",
		"/profile",
		"/console",
		"/playground",
		"/chat",
		"/chat2link",
	)
}

func adminWebPath(path string) bool {
	if path == "/dashboard/users" || strings.HasPrefix(path, "/dashboard/users/") {
		return true
	}
	return hasPathPrefix(
		path,
		"/channels",
		"/models",
		"/users",
		"/redemption-codes",
		"/subscriptions",
		"/system-info",
		"/system-settings",
		"/issuances",
	)
}

func rejectHostRequest(c *gin.Context, status int, message string) {
	if strings.HasPrefix(c.Request.URL.Path, "/api") || strings.HasPrefix(c.Request.URL.Path, "/v1") {
		c.AbortWithStatusJSON(status, gin.H{"success": false, "message": message})
		return
	}
	c.AbortWithStatus(status)
}

// EnforceIterLoopHostPolicy separates the public console, model API, and
// administrator surfaces while preserving unrestricted localhost access for
// health checks and maintenance.
func EnforceIterLoopHostPolicy() gin.HandlerFunc {
	return func(c *gin.Context) {
		hosts := configuredIterLoopHosts()
		if !hosts.configured() {
			c.Next()
			return
		}
		host := requestHost(c)
		if isLocalHost(host) {
			c.Next()
			return
		}
		if hosts.isPublic(host) {
			if publicHostPathAllowed(c.Request.Method, c.Request.URL.Path) {
				c.Next()
				return
			}
			if hosts.console != "" && publicConsoleRedirectPath(c.Request.URL.Path) {
				c.Redirect(http.StatusTemporaryRedirect, "https://"+hosts.console+c.Request.URL.RequestURI())
				c.Abort()
				return
			}
			rejectHostRequest(c, http.StatusNotFound, "route is not available on the public host")
			return
		}
		switch host {
		case hosts.api:
			if c.Request.Method == http.MethodOptions || apiHostPathAllowed(c.Request.URL.Path) {
				c.Next()
				return
			}
			rejectHostRequest(c, http.StatusNotFound, "route is not available on the API host")
		case hosts.console:
			if hasPathPrefix(c.Request.URL.Path, "/v1", "/mj", "/suno") {
				rejectHostRequest(c, http.StatusNotFound, "model routes are only available on the API host")
				return
			}
			if adminWebPath(c.Request.URL.Path) {
				rejectHostRequest(c, http.StatusNotFound, "administrator page is only available on the admin host")
				return
			}
			c.Next()
		case hosts.admin:
			if hasPathPrefix(c.Request.URL.Path, "/v1", "/mj", "/suno") {
				rejectHostRequest(c, http.StatusNotFound, "model routes are only available on the API host")
				return
			}
			c.Next()
		default:
			rejectHostRequest(c, http.StatusMisdirectedRequest, "unknown host")
		}
	}
}

// RequireIterLoopAdminHost adds a second boundary around every admin/root API
// route. It is intentionally a no-op until ITERLOOP_ADMIN_HOST is configured.
func RequireIterLoopAdminHost(c *gin.Context) bool {
	hosts := configuredIterLoopHosts()
	if hosts.admin == "" || isLocalHost(requestHost(c)) {
		return true
	}
	if requestHost(c) == hosts.admin {
		return true
	}
	rejectHostRequest(c, http.StatusNotFound, "administrator route is not available on this host")
	return false
}
