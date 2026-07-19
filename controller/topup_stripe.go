package controller

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"github.com/stripe/stripe-go/v86"
	"github.com/stripe/stripe-go/v86/checkout/session"
	"github.com/stripe/stripe-go/v86/webhook"
	"github.com/thanhpk/randstr"
)

var stripeAdaptor = &StripeAdaptor{}

const stripeWebhookMaxBodyBytes int64 = 65_536

// StripePayRequest represents a one-time prepaid credit purchase.
type StripePayRequest struct {
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"payment_method"`
	SuccessURL    string `json:"success_url,omitempty"`
	CancelURL     string `json:"cancel_url,omitempty"`
}

type StripeAdaptor struct{}

func (*StripeAdaptor) RequestAmount(c *gin.Context, req *StripePayRequest) {
	if !isStripeTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Stripe 支付未启用或配置不完整"})
		return
	}
	if err := validateStripeTopUpAmount(req.Amount); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": err.Error()})
		return
	}
	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户分组失败"})
		return
	}
	expectedAmount, err := stripeCheckoutMinorAmount(req.Amount, group)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data":    decimal.NewFromInt(expectedAmount).Div(decimal.NewFromInt(100)).StringFixed(2),
	})
}

func (*StripeAdaptor) RequestPay(c *gin.Context, req *StripePayRequest) {
	if !requirePaymentCompliance(c) {
		return
	}
	if !isStripeTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Stripe 支付未启用或配置不完整"})
		return
	}
	if req.PaymentMethod != model.PaymentMethodStripe {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "不支持的支付渠道"})
		return
	}
	if err := validateStripeTopUpAmount(req.Amount); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": err.Error()})
		return
	}
	if req.SuccessURL != "" && common.ValidateRedirectURL(req.SuccessURL) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "支付成功重定向URL不在可信任域名列表中", "data": ""})
		return
	}
	if req.CancelURL != "" && common.ValidateRedirectURL(req.CancelURL) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "支付取消重定向URL不在可信任域名列表中", "data": ""})
		return
	}

	id := c.GetInt("id")
	user, err := model.GetUserById(id, false)
	if err != nil || user == nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户信息失败"})
		return
	}
	expectedAmount, err := stripeCheckoutMinorAmount(req.Amount, user.Group)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": err.Error()})
		return
	}
	creditedQuota := stripeCreditedQuota(req.Amount, *user)
	if creditedQuota <= 0 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值额度配置无效"})
		return
	}

	reference := fmt.Sprintf("iterloop-stripe-%d-%d-%s", user.Id, time.Now().UnixMilli(), randstr.String(6))
	referenceId := "ref_" + common.Sha1([]byte(reference))
	currency := strings.ToUpper(strings.TrimSpace(setting.StripeCurrency))
	topUp := &model.TopUp{
		UserId:          id,
		Amount:          req.Amount,
		Money:           GetChargedAmount(float64(req.Amount), *user),
		TradeNo:         referenceId,
		PaymentMethod:   model.PaymentMethodStripe,
		PaymentProvider: model.PaymentProviderStripe,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
		ExpectedAmount:  expectedAmount,
		Currency:        currency,
		CreditedQuota:   creditedQuota,
	}
	if err := topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Stripe 创建本地订单失败 user_id=%d trade_no=%s error=%q", id, referenceId, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	checkoutSession, err := genStripeLink(referenceId, user.StripeCustomer, user.Email, expectedAmount, currency, req.SuccessURL, req.CancelURL)
	if err != nil {
		_ = model.FailStripeCheckoutCreation(referenceId, err)
		logger.LogError(c.Request.Context(), fmt.Sprintf("Stripe 创建 Checkout Session 失败 user_id=%d trade_no=%s error=%q", id, referenceId, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}
	if err := model.AttachStripeCheckout(referenceId, checkoutSession.ID); err != nil {
		_, _ = session.Expire(checkoutSession.ID, nil)
		_ = model.FailStripeCheckoutCreation(referenceId, err)
		logger.LogError(c.Request.Context(), fmt.Sprintf("Stripe 绑定 Checkout Session 失败 user_id=%d trade_no=%s session_id=%s error=%q", id, referenceId, checkoutSession.ID, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "保存支付订单失败"})
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("Stripe 充值订单创建成功 user_id=%d trade_no=%s amount_minor=%d currency=%s", id, referenceId, expectedAmount, currency))
	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"pay_link": checkoutSession.URL,
		},
	})
}

func RequestStripeAmount(c *gin.Context) {
	var req StripePayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	stripeAdaptor.RequestAmount(c, &req)
}

func RequestStripePay(c *gin.Context) {
	var req StripePayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	stripeAdaptor.RequestPay(c, &req)
}

// StripeWebhook never logs raw payloads or signatures. A processing error must
// return 5xx so Stripe keeps retrying instead of silently losing a paid order.
func StripeWebhook(c *gin.Context) {
	ctx := c.Request.Context()
	if !isStripeWebhookEnabled() {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe webhook 被拒绝 reason=webhook_disabled path=%q client_ip=%s", c.Request.RequestURI, c.ClientIP()))
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, stripeWebhookMaxBodyBytes)
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("Stripe webhook 读取请求体失败 path=%q client_ip=%s error=%q", c.Request.RequestURI, c.ClientIP(), err.Error()))
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			c.AbortWithStatus(http.StatusRequestEntityTooLarge)
			return
		}
		c.AbortWithStatus(http.StatusServiceUnavailable)
		return
	}
	event, err := webhook.ConstructEvent(payload, c.GetHeader("Stripe-Signature"), setting.StripeWebhookSecret)
	if err != nil {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe webhook 验签失败 path=%q client_ip=%s error=%q", c.Request.RequestURI, c.ClientIP(), err.Error()))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	shouldProcess, err := model.BeginStripeWebhookEvent(event.ID, string(event.Type), event.Livemode)
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("Stripe webhook 幂等记录失败 event_id=%s event_type=%s error=%q", event.ID, event.Type, err.Error()))
		c.AbortWithStatus(http.StatusServiceUnavailable)
		return
	}
	if !shouldProcess {
		logger.LogInfo(ctx, fmt.Sprintf("Stripe webhook 重复事件已忽略 event_id=%s event_type=%s", event.ID, event.Type))
		c.Status(http.StatusOK)
		return
	}

	tradeNo, handled, processingErr := dispatchStripeEvent(ctx, &event, c.ClientIP())
	if processingErr != nil {
		_ = model.FinishStripeWebhookEvent(event.ID, model.StripeWebhookEventFailed, tradeNo, processingErr)
		logger.LogError(ctx, fmt.Sprintf("Stripe webhook 处理失败 event_id=%s event_type=%s trade_no=%s error=%q", event.ID, event.Type, tradeNo, processingErr.Error()))
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	status := model.StripeWebhookEventIgnored
	if handled {
		status = model.StripeWebhookEventSucceeded
	}
	if err := model.FinishStripeWebhookEvent(event.ID, status, tradeNo, nil); err != nil {
		logger.LogError(ctx, fmt.Sprintf("Stripe webhook 完成幂等记录失败 event_id=%s event_type=%s error=%q", event.ID, event.Type, err.Error()))
		c.AbortWithStatus(http.StatusServiceUnavailable)
		return
	}
	logger.LogInfo(ctx, fmt.Sprintf("Stripe webhook 处理成功 event_id=%s event_type=%s trade_no=%s handled=%t", event.ID, event.Type, tradeNo, handled))
	c.Status(http.StatusOK)
}

func dispatchStripeEvent(ctx context.Context, event *stripe.Event, callerIp string) (string, bool, error) {
	switch event.Type {
	case stripe.EventTypeCheckoutSessionCompleted:
		tradeNo, err := handleStripeSessionCompleted(ctx, event, callerIp)
		return tradeNo, true, err
	case stripe.EventTypeCheckoutSessionAsyncPaymentSucceeded:
		tradeNo, err := fulfillStripeOrder(ctx, event, callerIp)
		return tradeNo, true, err
	case stripe.EventTypeCheckoutSessionAsyncPaymentFailed:
		tradeNo := event.GetObjectValue("client_reference_id")
		err := model.MarkStripeTopUpStatus(tradeNo, common.TopUpStatusFailed, "Stripe asynchronous payment failed")
		return tradeNo, true, err
	case stripe.EventTypeCheckoutSessionExpired:
		tradeNo, err := expireStripeOrder(event)
		return tradeNo, true, err
	case stripe.EventTypeChargeRefunded:
		handled, err := handleStripeRefund(ctx, event)
		return "", handled, err
	case stripe.EventTypeChargeDisputeCreated, stripe.EventTypeChargeDisputeUpdated, stripe.EventTypeChargeDisputeClosed:
		handled, err := handleStripeDispute(ctx, event)
		return "", handled, err
	default:
		return "", false, nil
	}
}

func handleStripeSessionCompleted(ctx context.Context, event *stripe.Event, callerIp string) (string, error) {
	tradeNo := event.GetObjectValue("client_reference_id")
	if event.GetObjectValue("status") != "complete" {
		return tradeNo, errors.New("Stripe Checkout Session status is not complete")
	}
	if event.GetObjectValue("payment_status") != "paid" {
		logger.LogInfo(ctx, fmt.Sprintf("Stripe Checkout 等待异步支付 trade_no=%s payment_status=%s", tradeNo, event.GetObjectValue("payment_status")))
		return tradeNo, nil
	}
	return fulfillStripeOrder(ctx, event, callerIp)
}

func fulfillStripeOrder(ctx context.Context, event *stripe.Event, callerIp string) (string, error) {
	tradeNo := event.GetObjectValue("client_reference_id")
	if tradeNo == "" {
		return "", errors.New("Stripe Checkout Session 缺少本地订单号")
	}
	amountTotal, err := stripeEventInt64(event, "amount_total")
	if err != nil {
		return tradeNo, err
	}
	currency := strings.ToUpper(event.GetObjectValue("currency"))
	payload := map[string]any{
		"customer":       event.GetObjectValue("customer"),
		"amount_total":   amountTotal,
		"currency":       currency,
		"event_type":     string(event.Type),
		"payment_intent": event.GetObjectValue("payment_intent"),
	}
	if err := model.CompleteSubscriptionOrder(tradeNo, common.GetJsonString(payload), model.PaymentProviderStripe, ""); err == nil {
		return tradeNo, nil
	} else if !errors.Is(err, model.ErrSubscriptionOrderNotFound) {
		return tradeNo, err
	}

	_, err = model.CompleteStripeTopUp(model.StripePaymentConfirmation{
		TradeNo:         tradeNo,
		CheckoutSession: event.GetObjectValue("id"),
		PaymentIntent:   event.GetObjectValue("payment_intent"),
		CustomerId:      event.GetObjectValue("customer"),
		AmountTotal:     amountTotal,
		Currency:        currency,
		CallerIp:        callerIp,
	})
	if err != nil {
		return tradeNo, err
	}
	logger.LogInfo(ctx, fmt.Sprintf("Stripe 充值确认完成 trade_no=%s amount_minor=%d currency=%s", tradeNo, amountTotal, currency))
	return tradeNo, nil
}

func expireStripeOrder(event *stripe.Event) (string, error) {
	tradeNo := event.GetObjectValue("client_reference_id")
	if tradeNo == "" {
		return "", errors.New("Stripe Checkout Session 缺少本地订单号")
	}
	if event.GetObjectValue("status") != "expired" {
		return tradeNo, errors.New("Stripe Checkout Session status is not expired")
	}
	if err := model.ExpireSubscriptionOrder(tradeNo, model.PaymentProviderStripe); err == nil {
		return tradeNo, nil
	} else if !errors.Is(err, model.ErrSubscriptionOrderNotFound) {
		return tradeNo, err
	}
	return tradeNo, model.MarkStripeTopUpStatus(tradeNo, common.TopUpStatusExpired, "Stripe Checkout Session expired")
}

func handleStripeRefund(ctx context.Context, event *stripe.Event) (bool, error) {
	paymentIntent := event.GetObjectValue("payment_intent")
	amountRefunded, err := stripeEventInt64(event, "amount_refunded")
	if err != nil {
		return true, err
	}
	err = model.ApplyStripeRefund(paymentIntent, amountRefunded, strings.ToUpper(event.GetObjectValue("currency")))
	if errors.Is(err, model.ErrTopUpNotFound) {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe 退款事件暂未匹配充值订单，将请求重试 event_id=%s payment_intent=%s", event.ID, paymentIntent))
		return true, err
	}
	return true, err
}

func handleStripeDispute(ctx context.Context, event *stripe.Event) (bool, error) {
	paymentIntent := event.GetObjectValue("payment_intent")
	amount, err := stripeEventInt64(event, "amount")
	if err != nil {
		return true, err
	}
	status := event.GetObjectValue("status")
	err = model.ApplyStripeDispute(paymentIntent, amount, strings.ToUpper(event.GetObjectValue("currency")), status, event.Created)
	if errors.Is(err, model.ErrTopUpNotFound) {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe 争议事件暂未匹配充值订单，将请求重试 event_id=%s payment_intent=%s", event.ID, paymentIntent))
		return true, err
	}
	return true, err
}

func stripeEventInt64(event *stripe.Event, key string) (int64, error) {
	value := event.GetObjectValue(key)
	if value == "" {
		return 0, fmt.Errorf("Stripe event missing %s", key)
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid Stripe %s: %w", key, err)
	}
	return parsed, nil
}

func genStripeLink(referenceId string, customerId string, email string, expectedAmount int64, currency string, successURL string, cancelURL string) (*stripe.CheckoutSession, error) {
	if !strings.HasPrefix(setting.StripeApiSecret, "sk_") && !strings.HasPrefix(setting.StripeApiSecret, "rk_") {
		return nil, errors.New("无效的 Stripe API 密钥")
	}
	if expectedAmount <= 0 || !strings.EqualFold(currency, "AUD") {
		return nil, errors.New("Stripe Checkout 金额或币种配置无效")
	}
	stripe.Key = setting.StripeApiSecret
	if successURL == "" {
		successURL = paymentReturnPath("/console/topup?show_history=true&payment=success")
	}
	if cancelURL == "" {
		cancelURL = paymentReturnPath("/console/topup?payment=cancelled")
	}

	params := &stripe.CheckoutSessionParams{
		ClientReferenceID: stripe.String(referenceId),
		SuccessURL:        stripe.String(successURL),
		CancelURL:         stripe.String(cancelURL),
		LineItems: []*stripe.CheckoutSessionLineItemParams{{
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				Currency: stripe.String(strings.ToLower(currency)),
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name:        stripe.String("IterLoop API prepaid service credits"),
					Description: stripe.String("Non-transferable prepaid credits for IterLoop API usage"),
				},
				UnitAmount: stripe.Int64(expectedAmount),
			},
			Quantity: stripe.Int64(1),
		}},
		Mode:                stripe.String(string(stripe.CheckoutSessionModePayment)),
		AllowPromotionCodes: stripe.Bool(false),
		PaymentIntentData: &stripe.CheckoutSessionPaymentIntentDataParams{
			Description: stripe.String("IterLoop API prepaid service credits"),
		},
	}
	if email != "" {
		params.PaymentIntentData.ReceiptEmail = stripe.String(email)
	}
	params.AddMetadata("iterloop_trade_no", referenceId)
	params.PaymentIntentData.AddMetadata("iterloop_trade_no", referenceId)
	params.SetIdempotencyKey("iterloop-checkout-" + referenceId)
	if customerId == "" {
		if email != "" {
			params.CustomerEmail = stripe.String(email)
		}
		params.CustomerCreation = stripe.String(string(stripe.CheckoutSessionCustomerCreationAlways))
	} else {
		params.Customer = stripe.String(customerId)
	}
	return session.New(params)
}

func validateStripeTopUpAmount(amount int64) error {
	if amount < getStripeMinTopup() {
		return fmt.Errorf("充值数量不能小于 %d", getStripeMinTopup())
	}
	if amount > 10000 {
		return errors.New("充值数量不能大于 10000")
	}
	for _, allowed := range operation_setting.GetPaymentSetting().AmountOptions {
		if int64(allowed) == amount {
			return nil
		}
	}
	return errors.New("请选择管理员配置的固定充值档位")
}

func stripeCheckoutMinorAmount(amount int64, group string) (int64, error) {
	payMoney := getStripePayMoney(float64(amount), group)
	minor := decimal.NewFromFloat(payMoney).Mul(decimal.NewFromInt(100)).Round(0).IntPart()
	if minor < 50 {
		return 0, errors.New("Stripe 支付金额不能低于 A$0.50")
	}
	return minor, nil
}

func stripeCreditedQuota(amount int64, user model.User) int64 {
	return decimal.NewFromFloat(GetChargedAmount(float64(amount), user)).
		Mul(decimal.NewFromFloat(common.QuotaPerUnit)).
		IntPart()
}

func GetChargedAmount(count float64, user model.User) float64 {
	topUpGroupRatio := common.GetTopupGroupRatio(user.Group)
	if topUpGroupRatio == 0 {
		topUpGroupRatio = 1
	}
	return count * topUpGroupRatio
}

func getStripePayMoney(amount float64, group string) float64 {
	originalAmount := amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = amount / common.QuotaPerUnit
	}
	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}
	discount := 1.0
	if configured, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(originalAmount)]; ok && configured > 0 {
		discount = configured
	}
	return amount * setting.StripeUnitPrice * topupGroupRatio * discount
}

func getStripeMinTopup() int64 {
	minTopup := setting.StripeMinTopUp
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		minTopup *= int(common.QuotaPerUnit)
	}
	return int64(minTopup)
}
