package controller

import (
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

const maxSelfAnalyticsRangeSeconds int64 = 31 * 24 * 60 * 60

func GetSelfAnalytics(c *gin.Context) {
	startTimestamp, err := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	if err != nil || startTimestamp <= 0 {
		common.ApiErrorMsg(c, "invalid start_timestamp")
		return
	}
	endTimestamp, err := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	if err != nil || endTimestamp <= 0 {
		common.ApiErrorMsg(c, "invalid end_timestamp")
		return
	}
	if endTimestamp < startTimestamp {
		common.ApiErrorMsg(c, "invalid time range")
		return
	}
	if endTimestamp-startTimestamp > maxSelfAnalyticsRangeSeconds {
		common.ApiErrorMsg(c, "time range cannot exceed 31 days")
		return
	}

	var tokenID *int
	if rawTokenID := c.Query("token_id"); rawTokenID != "" {
		parsedTokenID, parseErr := strconv.Atoi(rawTokenID)
		if parseErr != nil || parsedTokenID <= 0 {
			common.ApiErrorMsg(c, "invalid token_id")
			return
		}
		tokenID = &parsedTokenID
	}

	analytics, err := model.GetSelfAnalytics(c.GetInt("id"), startTimestamp, endTimestamp, tokenID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, analytics)
}
