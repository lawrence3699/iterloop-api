package controller

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"github.com/stripe/stripe-go/v86"
	"github.com/stripe/stripe-go/v86/webhook"
	"gorm.io/gorm"
)

func setupStripeWebhookTest(t *testing.T) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&model.User{},
		&model.TopUp{},
		&model.StripeWebhookEvent{},
		&model.SubscriptionPlan{},
		&model.SubscriptionOrder{},
		&model.UserSubscription{},
		&model.Log{},
	))

	originalDB := model.DB
	originalLogDB := model.LOG_DB
	originalMainDatabaseType := common.MainDatabaseType()
	originalLogDatabaseType := common.LogDatabaseType()
	originalRedisEnabled := common.RedisEnabled
	originalWebhookSecret := setting.StripeWebhookSecret
	paymentSetting := operation_setting.GetPaymentSetting()
	originalConfirmed := paymentSetting.ComplianceConfirmed
	originalTermsVersion := paymentSetting.ComplianceTermsVersion
	t.Cleanup(func() {
		model.DB = originalDB
		model.LOG_DB = originalLogDB
		common.SetDatabaseTypes(originalMainDatabaseType, originalLogDatabaseType)
		common.RedisEnabled = originalRedisEnabled
		setting.StripeWebhookSecret = originalWebhookSecret
		paymentSetting.ComplianceConfirmed = originalConfirmed
		paymentSetting.ComplianceTermsVersion = originalTermsVersion
	})

	model.DB = db
	model.LOG_DB = db
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	common.RedisEnabled = false
	setting.StripeWebhookSecret = "whsec_controller_test"
	paymentSetting.ComplianceConfirmed = true
	paymentSetting.ComplianceTermsVersion = operation_setting.CurrentComplianceTermsVersion
	gin.SetMode(gin.TestMode)
}

func stripeCheckoutWebhookPayload(eventId string, tradeNo string, sessionId string, paymentIntent string, amount int64) []byte {
	return []byte(fmt.Sprintf(`{
  "id": %q,
  "object": "event",
  "api_version": %q,
  "created": 1750000000,
  "livemode": false,
  "type": "checkout.session.completed",
  "data": {"object": {
    "id": %q,
    "object": "checkout.session",
    "client_reference_id": %q,
    "customer": "cus_test",
    "payment_intent": %q,
    "amount_total": %d,
    "currency": "aud",
    "status": "complete",
    "payment_status": "paid"
  }}
}`, eventId, stripe.APIVersion, sessionId, tradeNo, paymentIntent, amount))
}

func sendStripeWebhookForTest(payload []byte) *httptest.ResponseRecorder {
	signed := webhook.GenerateTestSignedPayload(&webhook.UnsignedPayload{
		Payload: payload,
		Secret:  setting.StripeWebhookSecret,
	})
	request := httptest.NewRequest(http.MethodPost, "/api/stripe/webhook", strings.NewReader(string(signed.Payload)))
	request.Header.Set("Stripe-Signature", signed.Header)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = request
	StripeWebhook(context)
	return recorder
}

func TestStripeWebhookCreditsOnceAndPersistsEvent(t *testing.T) {
	setupStripeWebhookTest(t)
	require.NoError(t, model.DB.Create(&model.User{Id: 801, Username: "stripe-webhook-user", Status: common.UserStatusEnabled}).Error)
	require.NoError(t, model.DB.Create(&model.TopUp{
		UserId:            801,
		Amount:            25,
		Money:             25,
		TradeNo:           "stripe-webhook-success",
		PaymentMethod:     model.PaymentMethodStripe,
		PaymentProvider:   model.PaymentProviderStripe,
		Status:            common.TopUpStatusPending,
		ExpectedAmount:    2500,
		Currency:          "AUD",
		CreditedQuota:     12_500,
		ProviderSessionId: "cs_webhook_success",
	}).Error)

	payload := stripeCheckoutWebhookPayload("evt_webhook_success", "stripe-webhook-success", "cs_webhook_success", "pi_webhook_success", 2500)
	require.Equal(t, http.StatusOK, sendStripeWebhookForTest(payload).Code)
	require.Equal(t, http.StatusOK, sendStripeWebhookForTest(payload).Code)

	var user model.User
	require.NoError(t, model.DB.First(&user, 801).Error)
	require.Equal(t, 12_500, user.Quota)
	var topUp model.TopUp
	require.NoError(t, model.DB.Where("trade_no = ?", "stripe-webhook-success").First(&topUp).Error)
	require.Equal(t, common.TopUpStatusSuccess, topUp.Status)
	require.Equal(t, "pi_webhook_success", topUp.ProviderPaymentId)
	var event model.StripeWebhookEvent
	require.NoError(t, model.DB.Where("event_id = ?", "evt_webhook_success").First(&event).Error)
	require.Equal(t, model.StripeWebhookEventSucceeded, event.Status)
	require.Equal(t, 1, event.AttemptCount)
}

func TestStripeWebhookAmountMismatchReturnsRetryableError(t *testing.T) {
	setupStripeWebhookTest(t)
	require.NoError(t, model.DB.Create(&model.User{Id: 802, Username: "stripe-webhook-mismatch", Status: common.UserStatusEnabled}).Error)
	require.NoError(t, model.DB.Create(&model.TopUp{
		UserId:            802,
		Amount:            25,
		Money:             25,
		TradeNo:           "stripe-webhook-mismatch",
		PaymentMethod:     model.PaymentMethodStripe,
		PaymentProvider:   model.PaymentProviderStripe,
		Status:            common.TopUpStatusPending,
		ExpectedAmount:    2500,
		Currency:          "AUD",
		CreditedQuota:     12_500,
		ProviderSessionId: "cs_webhook_mismatch",
	}).Error)

	payload := stripeCheckoutWebhookPayload("evt_webhook_mismatch", "stripe-webhook-mismatch", "cs_webhook_mismatch", "pi_webhook_mismatch", 2499)
	require.Equal(t, http.StatusInternalServerError, sendStripeWebhookForTest(payload).Code)

	var user model.User
	require.NoError(t, model.DB.First(&user, 802).Error)
	require.Zero(t, user.Quota)
	var event model.StripeWebhookEvent
	require.NoError(t, model.DB.Where("event_id = ?", "evt_webhook_mismatch").First(&event).Error)
	require.Equal(t, model.StripeWebhookEventFailed, event.Status)
	require.NotEmpty(t, event.LastError)
}

func TestStripeWebhookRejectsOversizedPayload(t *testing.T) {
	setupStripeWebhookTest(t)
	payload := []byte(strings.Repeat("x", int(stripeWebhookMaxBodyBytes)+1))
	require.Equal(t, http.StatusRequestEntityTooLarge, sendStripeWebhookForTest(payload).Code)

	var eventCount int64
	require.NoError(t, model.DB.Model(&model.StripeWebhookEvent{}).Count(&eventCount).Error)
	require.Zero(t, eventCount)
}
