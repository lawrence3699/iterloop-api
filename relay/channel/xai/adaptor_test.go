package xai

import (
	"encoding/json"
	"testing"

	"github.com/QuantumNous/new-api/dto"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/stretchr/testify/require"
)

func iterLoopXAIInfo(group string) *relaycommon.RelayInfo {
	return &relaycommon.RelayInfo{
		UsingGroup: group,
		ChannelMeta: &relaycommon.ChannelMeta{
			UpstreamModelName: "grok-4.3",
		},
	}
}

func TestIterLoopGrokAllowsFunctionTools(t *testing.T) {
	request := &dto.GeneralOpenAIRequest{
		Model: "grok-4.3",
		Tools: []dto.ToolCallRequest{{Type: "function", Function: dto.FunctionRequest{Name: "lookup"}}},
	}
	_, err := (&Adaptor{}).ConvertOpenAIRequest(nil, iterLoopXAIInfo("grok-standard"), request)
	require.NoError(t, err)
}

func TestIterLoopGrokRejectsHostedSearchTools(t *testing.T) {
	request := &dto.GeneralOpenAIRequest{
		Model: "grok-4.3",
		Tools: []dto.ToolCallRequest{{Type: "web_search"}},
	}
	_, err := (&Adaptor{}).ConvertOpenAIRequest(nil, iterLoopXAIInfo("grok-standard"), request)
	require.ErrorContains(t, err, "not enabled")

	responses := dto.OpenAIResponsesRequest{
		Model: "grok-4.5",
		Tools: json.RawMessage(`[{"type":"x_search"}]`),
	}
	_, err = (&Adaptor{}).ConvertOpenAIResponsesRequest(nil, iterLoopXAIInfo("combined-standard"), responses)
	require.ErrorContains(t, err, "not enabled")

	searchAlias := &dto.GeneralOpenAIRequest{Model: "grok-4.3-search"}
	_, err = (&Adaptor{}).ConvertOpenAIRequest(nil, iterLoopXAIInfo("grok-standard"), searchAlias)
	require.ErrorContains(t, err, "not enabled")
}

func TestNonIterLoopXAIGroupKeepsExistingSearchBehavior(t *testing.T) {
	request := &dto.GeneralOpenAIRequest{
		Model: "grok-4.3",
		Tools: []dto.ToolCallRequest{{Type: "web_search"}},
	}
	_, err := (&Adaptor{}).ConvertOpenAIRequest(nil, iterLoopXAIInfo("default"), request)
	require.NoError(t, err)
}

func TestIterLoopGrokOnlyAllowsTextEndpoints(t *testing.T) {
	info := iterLoopXAIInfo("grok-standard")
	info.RequestURLPath = "/v1/realtime"
	_, err := (&Adaptor{}).GetRequestURL(info)
	require.ErrorContains(t, err, "only supports")

	info.RequestURLPath = "/v1/responses"
	info.ChannelBaseUrl = "https://api.x.ai/v1"
	requestURL, err := (&Adaptor{}).GetRequestURL(info)
	require.NoError(t, err)
	require.Equal(t, "https://api.x.ai/v1/responses", requestURL)

	info.ChannelBaseUrl = "https://api.x.ai"
	requestURL, err = (&Adaptor{}).GetRequestURL(info)
	require.NoError(t, err)
	require.Equal(t, "https://api.x.ai/v1/responses", requestURL)
}
