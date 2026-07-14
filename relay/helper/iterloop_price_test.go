package helper

import (
	"net/http/httptest"
	"testing"

	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestHandleGroupRatioUsesModelFamilyForCombinedIterLoopGroup(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())

	codex := &relaycommon.RelayInfo{UsingGroup: "combined-standard", OriginModelName: "gpt-5.5"}
	assert.Equal(t, 0.4, HandleGroupRatio(ctx, codex).GroupRatio)

	claude := &relaycommon.RelayInfo{UsingGroup: "combined-standard", OriginModelName: "claude-sonnet-4-6"}
	assert.Equal(t, 0.7, HandleGroupRatio(ctx, claude).GroupRatio)

	grok := &relaycommon.RelayInfo{UsingGroup: "combined-standard", OriginModelName: "grok-4.5"}
	assert.Equal(t, 1.0, HandleGroupRatio(ctx, grok).GroupRatio)
}
