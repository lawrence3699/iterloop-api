package controller

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDecodeIssuanceProfileCreateRequestDefaultsTrueAndPreservesFalse(t *testing.T) {
	profile, err := decodeIssuanceProfileCreateRequest([]byte(`{"name":"default"}`))
	require.NoError(t, err)
	assert.True(t, profile.Enabled)

	profile, err = decodeIssuanceProfileCreateRequest([]byte(`{"name":"disabled","enabled":false}`))
	require.NoError(t, err)
	assert.False(t, profile.Enabled)

	profile, err = decodeIssuanceProfileCreateRequest([]byte(`{"name":"enabled","enabled":true}`))
	require.NoError(t, err)
	assert.True(t, profile.Enabled)
}

func TestIterLoopOpenAPIAdvertisesCompatibleEndpoints(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)

	IterLoopOpenAPI(ctx)

	require.Equal(t, 200, recorder.Code)
	var payload struct {
		OpenAPI string                     `json:"openapi"`
		Paths   map[string]json.RawMessage `json:"paths"`
	}
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &payload))
	assert.Equal(t, "3.1.0", payload.OpenAPI)
	for _, path := range []string{"/v1/models", "/v1/responses", "/v1/chat/completions", "/v1/messages"} {
		assert.Contains(t, payload.Paths, path)
	}
}
