package xai

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/relay/channel"
	"github.com/QuantumNous/new-api/relay/channel/openai"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/types"

	"github.com/QuantumNous/new-api/relay/constant"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
)

type Adaptor struct {
}

func restrictHostedSearch(info *relaycommon.RelayInfo) bool {
	if info == nil {
		return false
	}
	switch strings.ToLower(strings.TrimSpace(info.UsingGroup)) {
	case "grok-standard", "combined-standard":
		return true
	default:
		return false
	}
}

func isNonEmptyJSON(raw json.RawMessage) bool {
	value := strings.TrimSpace(string(raw))
	return value != "" && value != "null" && value != "{}" && value != "[]"
}

func isBlockedHostedTool(toolType string) bool {
	switch strings.ToLower(strings.TrimSpace(toolType)) {
	case "web_search", "web_search_preview", "x_search":
		return true
	default:
		return false
	}
}

func validateChatHostedSearch(info *relaycommon.RelayInfo, request *dto.GeneralOpenAIRequest) error {
	if !restrictHostedSearch(info) || request == nil {
		return nil
	}
	upstreamModel := ""
	if info.ChannelMeta != nil {
		upstreamModel = info.UpstreamModelName
	}
	if strings.HasSuffix(strings.ToLower(request.Model), "-search") || strings.HasSuffix(strings.ToLower(upstreamModel), "-search") {
		return errors.New("xAI hosted web_search and x_search tools are not enabled for this group")
	}
	if isNonEmptyJSON(request.SearchParameters) || request.WebSearchOptions != nil {
		return errors.New("xAI hosted web_search and x_search tools are not enabled for this group")
	}
	for _, tool := range request.Tools {
		if isBlockedHostedTool(tool.Type) {
			return errors.New("xAI hosted web_search and x_search tools are not enabled for this group")
		}
	}
	if choice, ok := request.ToolChoice.(map[string]any); ok {
		if toolType, ok := choice["type"].(string); ok && isBlockedHostedTool(toolType) {
			return errors.New("xAI hosted web_search and x_search tools are not enabled for this group")
		}
	}
	return nil
}

func validateResponsesHostedSearch(info *relaycommon.RelayInfo, request dto.OpenAIResponsesRequest) error {
	if !restrictHostedSearch(info) {
		return nil
	}
	upstreamModel := ""
	if info.ChannelMeta != nil {
		upstreamModel = info.UpstreamModelName
	}
	if strings.HasSuffix(strings.ToLower(request.Model), "-search") || strings.HasSuffix(strings.ToLower(upstreamModel), "-search") {
		return errors.New("xAI hosted web_search and x_search tools are not enabled for this group")
	}
	tools := request.Tools
	if isNonEmptyJSON(tools) {
		var values []map[string]any
		if json.Unmarshal(tools, &values) == nil {
			for _, tool := range values {
				if toolType, ok := tool["type"].(string); ok && isBlockedHostedTool(toolType) {
					return errors.New("xAI hosted web_search and x_search tools are not enabled for this group")
				}
			}
		}
	}
	if isNonEmptyJSON(request.ToolChoice) {
		var choice map[string]any
		if json.Unmarshal(request.ToolChoice, &choice) == nil {
			if toolType, ok := choice["type"].(string); ok && isBlockedHostedTool(toolType) {
				return errors.New("xAI hosted web_search and x_search tools are not enabled for this group")
			}
		}
	}
	return nil
}

func (a *Adaptor) ConvertGeminiRequest(*gin.Context, *relaycommon.RelayInfo, *dto.GeminiChatRequest) (any, error) {
	//TODO implement me
	return nil, errors.New("not implemented")
}

func (a *Adaptor) ConvertClaudeRequest(*gin.Context, *relaycommon.RelayInfo, *dto.ClaudeRequest) (any, error) {
	//TODO implement me
	//panic("implement me")
	return nil, errors.New("not available")
}

func (a *Adaptor) ConvertAudioRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.AudioRequest) (io.Reader, error) {
	//not available
	return nil, errors.New("not available")
}

func (a *Adaptor) ConvertImageRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.ImageRequest) (any, error) {
	if restrictHostedSearch(info) {
		return nil, errors.New("xAI image and video generation are not enabled for this group")
	}
	xaiRequest := ImageRequest{
		Model:          request.Model,
		Prompt:         request.Prompt,
		N:              int(lo.FromPtrOr(request.N, uint(1))),
		ResponseFormat: request.ResponseFormat,
	}
	return xaiRequest, nil
}

func (a *Adaptor) Init(info *relaycommon.RelayInfo) {
}

func (a *Adaptor) GetRequestURL(info *relaycommon.RelayInfo) (string, error) {
	if restrictHostedSearch(info) {
		path := strings.TrimSuffix(strings.TrimSpace(info.RequestURLPath), "/")
		switch path {
		case "/v1/responses", "/v1/chat/completions":
		default:
			return "", errors.New("this xAI group only supports /v1/responses and /v1/chat/completions")
		}
	}
	baseURL := strings.TrimRight(strings.TrimSpace(info.ChannelBaseUrl), "/")
	requestURL := strings.TrimSpace(info.RequestURLPath)
	if strings.HasSuffix(baseURL, "/v1") && strings.HasPrefix(requestURL, "/v1/") {
		requestURL = strings.TrimPrefix(requestURL, "/v1")
	}
	return relaycommon.GetFullRequestURL(baseURL, requestURL, info.ChannelType), nil
}

func (a *Adaptor) SetupRequestHeader(c *gin.Context, req *http.Header, info *relaycommon.RelayInfo) error {
	channel.SetupApiRequestHeader(info, c, req)
	req.Set("Authorization", "Bearer "+info.ApiKey)
	return nil
}

func (a *Adaptor) ConvertOpenAIRequest(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeneralOpenAIRequest) (any, error) {
	if request == nil {
		return nil, errors.New("request is nil")
	}
	if err := validateChatHostedSearch(info, request); err != nil {
		return nil, err
	}
	if strings.HasSuffix(info.UpstreamModelName, "-search") {
		info.UpstreamModelName = strings.TrimSuffix(info.UpstreamModelName, "-search")
		request.Model = info.UpstreamModelName
		toMap := request.ToMap()
		toMap["search_parameters"] = map[string]any{
			"mode": "on",
		}
		return toMap, nil
	}
	if strings.HasPrefix(request.Model, "grok-3-mini") {
		if lo.FromPtrOr(request.MaxCompletionTokens, uint(0)) == 0 && lo.FromPtrOr(request.MaxTokens, uint(0)) != 0 {
			request.MaxCompletionTokens = request.MaxTokens
			request.MaxTokens = nil
		}
		if strings.HasSuffix(request.Model, "-high") {
			request.ReasoningEffort = "high"
			request.Model = strings.TrimSuffix(request.Model, "-high")
		} else if strings.HasSuffix(request.Model, "-low") {
			request.ReasoningEffort = "low"
			request.Model = strings.TrimSuffix(request.Model, "-low")
		}
		info.ReasoningEffort = request.ReasoningEffort
		info.UpstreamModelName = request.Model
	}
	return request, nil
}

func (a *Adaptor) ConvertRerankRequest(c *gin.Context, relayMode int, request dto.RerankRequest) (any, error) {
	return nil, nil
}

func (a *Adaptor) ConvertEmbeddingRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.EmbeddingRequest) (any, error) {
	//not available
	return nil, errors.New("not available")
}

func (a *Adaptor) ConvertOpenAIResponsesRequest(c *gin.Context, info *relaycommon.RelayInfo, request dto.OpenAIResponsesRequest) (any, error) {
	if err := validateResponsesHostedSearch(info, request); err != nil {
		return nil, err
	}
	if request.Model == "" && info != nil {
		request.Model = info.UpstreamModelName
	}
	return request, nil
}

func (a *Adaptor) DoRequest(c *gin.Context, info *relaycommon.RelayInfo, requestBody io.Reader) (any, error) {
	return channel.DoApiRequest(a, c, info, requestBody)
}

func (a *Adaptor) DoResponse(c *gin.Context, resp *http.Response, info *relaycommon.RelayInfo) (usage any, err *types.NewAPIError) {
	switch info.RelayMode {
	case constant.RelayModeImagesGenerations, constant.RelayModeImagesEdits:
		usage, err = openai.OpenaiImageHandler(c, info, resp)
	case constant.RelayModeResponses:
		if info.IsStream {
			usage, err = openai.OaiResponsesStreamHandler(c, info, resp)
		} else {
			usage, err = openai.OaiResponsesHandler(c, info, resp)
		}
	default:
		if info.IsStream {
			usage, err = xAIStreamHandler(c, info, resp)
		} else {
			usage, err = xAIHandler(c, info, resp)
		}
	}
	return
}

func (a *Adaptor) GetModelList() []string {
	return ModelList
}

func (a *Adaptor) GetChannelName() string {
	return ChannelName
}
