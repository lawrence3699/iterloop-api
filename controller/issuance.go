package controller

import (
	"encoding/json"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

type issueAccessRequest struct {
	ProfileId    int    `json:"profile_id"`
	Email        string `json:"email"`
	Note         string `json:"note"`
	BalanceQuota *int   `json:"balance_quota"`
	KeyQuota     *int   `json:"key_quota"`
	ExpireDays   *int   `json:"expire_days"`
}

func decodeIssuanceProfileCreateRequest(data []byte) (*model.IssuanceProfile, error) {
	profile := &model.IssuanceProfile{}
	if err := json.Unmarshal(data, profile); err != nil {
		return nil, err
	}
	fields := map[string]json.RawMessage{}
	if err := json.Unmarshal(data, &fields); err != nil {
		return nil, err
	}
	profile.Enabled = true
	if raw, ok := fields["enabled"]; ok {
		if err := json.Unmarshal(raw, &profile.Enabled); err != nil {
			return nil, err
		}
	}
	return profile, nil
}

func ListIssuanceProfiles(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	profiles, total, err := model.SearchIssuanceProfiles(c.Query("keyword"), pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetItems(profiles)
	pageInfo.SetTotal(int(total))
	common.ApiSuccess(c, pageInfo)
}

func GetIssuanceProfile(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid profile id")
		return
	}
	profile, err := model.GetIssuanceProfileById(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, profile)
}

func CreateIssuanceProfile(c *gin.Context) {
	data, err := c.GetRawData()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	profile, err := decodeIssuanceProfileCreateRequest(data)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	profile.Id = 0
	profile.CreatedBy = c.GetInt("id")
	if err := profile.Insert(); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, profile)
}

func UpdateIssuanceProfile(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid profile id")
		return
	}
	profile := &model.IssuanceProfile{}
	if err := c.ShouldBindJSON(profile); err != nil {
		common.ApiError(c, err)
		return
	}
	profile.Id = id
	if err := profile.Update(); err != nil {
		common.ApiError(c, err)
		return
	}
	updated, err := model.GetIssuanceProfileById(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, updated)
}

func DeleteIssuanceProfile(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid profile id")
		return
	}
	if err := model.DeleteIssuanceProfile(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func ListIssuances(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	rows, total, err := model.SearchIssuances(c.Query("keyword"), pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetItems(rows)
	pageInfo.SetTotal(int(total))
	common.ApiSuccess(c, pageInfo)
}

func CreateIssuance(c *gin.Context) {
	request := &issueAccessRequest{}
	if err := c.ShouldBindJSON(request); err != nil {
		common.ApiError(c, err)
		return
	}
	request.Email = strings.TrimSpace(request.Email)
	profile, err := model.GetIssuanceProfileById(request.ProfileId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	result, err := model.IssueAccess(profile, request.Email, request.Note, c.GetInt("id"), model.IssueAccessOptions{
		BalanceQuota: request.BalanceQuota,
		KeyQuota:     request.KeyQuota,
		ExpireDays:   request.ExpireDays,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}

func RevokeIssuance(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorMsg(c, "invalid issuance id")
		return
	}
	issuance, err := model.RevokeIssuance(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, issuance)
}
