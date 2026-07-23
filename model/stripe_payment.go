package model

import (
	"errors"
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	StripeWebhookEventProcessing = "processing"
	StripeWebhookEventSucceeded  = "succeeded"
	StripeWebhookEventIgnored    = "ignored"
	StripeWebhookEventFailed     = "failed"
)

var (
	ErrStripeAmountMismatch   = errors.New("stripe amount mismatch")
	ErrStripeCurrencyMismatch = errors.New("stripe currency mismatch")
	ErrStripeSessionMismatch  = errors.New("stripe checkout session mismatch")
)

// StripeWebhookEvent is a durable idempotency and audit record. It deliberately
// stores no raw webhook body or signature.
type StripeWebhookEvent struct {
	Id           int    `json:"id"`
	EventId      string `json:"event_id" gorm:"uniqueIndex;type:varchar(255);not null"`
	EventType    string `json:"event_type" gorm:"type:varchar(128);not null"`
	TradeNo      string `json:"trade_no" gorm:"type:varchar(255);index"`
	Livemode     bool   `json:"livemode"`
	Status       string `json:"status" gorm:"type:varchar(32);index;not null"`
	AttemptCount int    `json:"attempt_count" gorm:"not null;default:1"`
	LastError    string `json:"-" gorm:"type:varchar(512);default:''"`
	CreatedAt    int64  `json:"created_at"`
	ProcessedAt  int64  `json:"processed_at"`
}

// BeginStripeWebhookEvent returns false when a terminal record already exists.
// Failed or interrupted events can be attempted again when Stripe retries.
func BeginStripeWebhookEvent(eventId string, eventType string, livemode bool) (bool, error) {
	eventId = strings.TrimSpace(eventId)
	if eventId == "" {
		return false, errors.New("stripe event id is empty")
	}

	now := common.GetTimestamp()
	record := &StripeWebhookEvent{
		EventId:      eventId,
		EventType:    eventType,
		Livemode:     livemode,
		Status:       StripeWebhookEventProcessing,
		AttemptCount: 1,
		CreatedAt:    now,
	}
	result := DB.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "event_id"}}, DoNothing: true}).Create(record)
	if result.Error != nil {
		return false, result.Error
	}
	if result.RowsAffected == 1 {
		return true, nil
	}

	returnValue := false
	err := DB.Transaction(func(tx *gorm.DB) error {
		existing := &StripeWebhookEvent{}
		if err := lockForUpdate(tx).Where("event_id = ?", eventId).First(existing).Error; err != nil {
			return err
		}
		if existing.Status == StripeWebhookEventSucceeded || existing.Status == StripeWebhookEventIgnored {
			return nil
		}
		existing.Status = StripeWebhookEventProcessing
		existing.AttemptCount++
		existing.LastError = ""
		existing.ProcessedAt = 0
		returnValue = true
		return tx.Save(existing).Error
	})
	return returnValue, err
}

func FinishStripeWebhookEvent(eventId string, status string, tradeNo string, processingErr error) error {
	updates := map[string]interface{}{
		"status":       status,
		"trade_no":     tradeNo,
		"processed_at": common.GetTimestamp(),
		"last_error":   "",
	}
	if processingErr != nil {
		updates["last_error"] = truncateStripeAuditError(processingErr.Error())
	}
	result := DB.Model(&StripeWebhookEvent{}).Where("event_id = ?", eventId).Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("stripe webhook event record not found")
	}
	return nil
}

func truncateStripeAuditError(value string) string {
	value = strings.TrimSpace(value)
	if len(value) > 500 {
		return value[:500]
	}
	return value
}

type StripePaymentConfirmation struct {
	TradeNo         string
	CheckoutSession string
	PaymentIntent   string
	CustomerId      string
	AmountTotal     int64
	Currency        string
	CallerIp        string
}

func AttachStripeCheckout(tradeNo string, checkoutSessionId string) error {
	result := DB.Model(&TopUp{}).
		Where("trade_no = ? AND payment_provider = ? AND status = ?", tradeNo, PaymentProviderStripe, common.TopUpStatusPending).
		Update("provider_session_id", checkoutSessionId)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrTopUpStatusInvalid
	}
	return nil
}

func FailStripeCheckoutCreation(tradeNo string, reason error) error {
	return DB.Model(&TopUp{}).
		Where("trade_no = ? AND payment_provider = ? AND status = ?", tradeNo, PaymentProviderStripe, common.TopUpStatusPending).
		Updates(map[string]interface{}{
			"status":         common.TopUpStatusFailed,
			"failure_reason": truncateStripeAuditError(reason.Error()),
		}).Error
}

// CompleteStripeTopUp validates the immutable order snapshot and credits the
// user in the same transaction that marks the order successful.
func CompleteStripeTopUp(confirmation StripePaymentConfirmation) (bool, error) {
	if strings.TrimSpace(confirmation.TradeNo) == "" {
		return false, errors.New("未提供支付单号")
	}

	var topUp TopUp
	credited := false
	err := DB.Transaction(func(tx *gorm.DB) error {
		if err := lockForUpdate(tx).Where("trade_no = ?", confirmation.TradeNo).First(&topUp).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTopUpNotFound
			}
			return err
		}
		if topUp.PaymentProvider != PaymentProviderStripe {
			return ErrPaymentMethodMismatch
		}
		if topUp.Status == common.TopUpStatusSuccess || topUp.Status == common.TopUpStatusPartiallyRefunded ||
			topUp.Status == common.TopUpStatusRefunded || topUp.Status == common.TopUpStatusDisputed ||
			topUp.Status == common.TopUpStatusChargeback {
			return nil
		}
		if topUp.Status != common.TopUpStatusPending {
			return ErrTopUpStatusInvalid
		}
		if topUp.ExpectedAmount <= 0 || confirmation.AmountTotal != topUp.ExpectedAmount {
			return fmt.Errorf("%w: expected=%d received=%d", ErrStripeAmountMismatch, topUp.ExpectedAmount, confirmation.AmountTotal)
		}
		if !strings.EqualFold(strings.TrimSpace(topUp.Currency), strings.TrimSpace(confirmation.Currency)) {
			return fmt.Errorf("%w: expected=%s received=%s", ErrStripeCurrencyMismatch, topUp.Currency, confirmation.Currency)
		}
		if topUp.ProviderSessionId != "" && confirmation.CheckoutSession != "" && topUp.ProviderSessionId != confirmation.CheckoutSession {
			return ErrStripeSessionMismatch
		}
		if topUp.CreditedQuota <= 0 {
			return errors.New("invalid credited quota snapshot")
		}

		topUp.Status = common.TopUpStatusSuccess
		topUp.CompleteTime = common.GetTimestamp()
		topUp.ProviderSessionId = confirmation.CheckoutSession
		topUp.ProviderPaymentId = confirmation.PaymentIntent
		topUp.FailureReason = ""
		if err := tx.Save(&topUp).Error; err != nil {
			return err
		}

		updates := map[string]interface{}{
			"quota": gorm.Expr("quota + ?", topUp.CreditedQuota),
		}
		if confirmation.CustomerId != "" {
			updates["stripe_customer"] = confirmation.CustomerId
		}
		if err := tx.Model(&User{}).Where("id = ?", topUp.UserId).Updates(updates).Error; err != nil {
			return err
		}
		credited = true
		return nil
	})
	if err != nil {
		return false, err
	}
	if credited {
		RecordTopupLog(topUp.UserId, fmt.Sprintf("Stripe充值成功，到账额度: %v，实付: %.2f %s", logger.FormatQuota(int(topUp.CreditedQuota)), float64(topUp.ExpectedAmount)/100, strings.ToUpper(topUp.Currency)), confirmation.CallerIp, topUp.PaymentMethod, PaymentMethodStripe)
	}
	return credited, nil
}

func MarkStripeTopUpStatus(tradeNo string, targetStatus string, reason string) error {
	if tradeNo == "" {
		return errors.New("未提供支付单号")
	}
	return DB.Transaction(func(tx *gorm.DB) error {
		topUp := &TopUp{}
		if err := lockForUpdate(tx).Where("trade_no = ?", tradeNo).First(topUp).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTopUpNotFound
			}
			return err
		}
		if topUp.PaymentProvider != PaymentProviderStripe {
			return ErrPaymentMethodMismatch
		}
		if topUp.Status != common.TopUpStatusPending {
			return nil
		}
		topUp.Status = targetStatus
		topUp.FailureReason = truncateStripeAuditError(reason)
		return tx.Save(topUp).Error
	})
}

func ApplyStripeRefund(paymentIntentId string, amountRefunded int64, currency string) error {
	if paymentIntentId == "" || amountRefunded < 0 {
		return errors.New("invalid Stripe refund data")
	}
	return DB.Transaction(func(tx *gorm.DB) error {
		topUp := &TopUp{}
		if err := lockForUpdate(tx).Where("payment_provider = ? AND provider_payment_id = ?", PaymentProviderStripe, paymentIntentId).First(topUp).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTopUpNotFound
			}
			return err
		}
		if !strings.EqualFold(topUp.Currency, currency) {
			return ErrStripeCurrencyMismatch
		}
		if topUp.ExpectedAmount <= 0 || amountRefunded > topUp.ExpectedAmount {
			return ErrStripeAmountMismatch
		}
		if amountRefunded < topUp.RefundedAmount {
			return nil
		}
		previousEffectiveQuota := maxStripeReversedQuota(topUp.RefundedQuota, topUp.DisputedQuota)
		targetQuota := proportionalStripeQuota(topUp.CreditedQuota, amountRefunded, topUp.ExpectedAmount)
		nextEffectiveQuota := maxStripeReversedQuota(targetQuota, topUp.DisputedQuota)
		delta := nextEffectiveQuota - previousEffectiveQuota
		if delta != 0 {
			if err := tx.Model(&User{}).Where("id = ?", topUp.UserId).Update("quota", gorm.Expr("quota - ?", delta)).Error; err != nil {
				return err
			}
		}
		topUp.RefundedAmount = amountRefunded
		topUp.RefundedQuota = targetQuota
		if amountRefunded >= topUp.ExpectedAmount {
			topUp.Status = common.TopUpStatusRefunded
		} else if amountRefunded > 0 {
			topUp.Status = common.TopUpStatusPartiallyRefunded
		}
		return tx.Save(topUp).Error
	})
}

func ApplyStripeDispute(paymentIntentId string, amount int64, currency string, disputeStatus string, eventCreatedAt int64) error {
	if paymentIntentId == "" || amount < 0 {
		return errors.New("invalid Stripe dispute data")
	}
	return DB.Transaction(func(tx *gorm.DB) error {
		topUp := &TopUp{}
		if err := lockForUpdate(tx).Where("payment_provider = ? AND provider_payment_id = ?", PaymentProviderStripe, paymentIntentId).First(topUp).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTopUpNotFound
			}
			return err
		}
		if !strings.EqualFold(topUp.Currency, currency) {
			return ErrStripeCurrencyMismatch
		}
		if topUp.ExpectedAmount <= 0 || amount > topUp.ExpectedAmount {
			return ErrStripeAmountMismatch
		}
		if eventCreatedAt > 0 && topUp.DisputeEventAt > eventCreatedAt {
			return nil
		}

		previousEffectiveQuota := maxStripeReversedQuota(topUp.RefundedQuota, topUp.DisputedQuota)
		targetQuota := proportionalStripeQuota(topUp.CreditedQuota, amount, topUp.ExpectedAmount)
		if disputeStatus == "won" || disputeStatus == "warning_closed" {
			targetQuota = 0
		}
		nextEffectiveQuota := maxStripeReversedQuota(topUp.RefundedQuota, targetQuota)
		delta := nextEffectiveQuota - previousEffectiveQuota
		if delta != 0 {
			if err := tx.Model(&User{}).Where("id = ?", topUp.UserId).Update("quota", gorm.Expr("quota - ?", delta)).Error; err != nil {
				return err
			}
		}

		topUp.DisputedAmount = amount
		topUp.DisputedQuota = targetQuota
		topUp.DisputeStatus = disputeStatus
		topUp.DisputeEventAt = eventCreatedAt
		switch disputeStatus {
		case "won", "warning_closed":
			if topUp.RefundedAmount >= topUp.ExpectedAmount {
				topUp.Status = common.TopUpStatusRefunded
			} else if topUp.RefundedAmount > 0 {
				topUp.Status = common.TopUpStatusPartiallyRefunded
			} else {
				topUp.Status = common.TopUpStatusSuccess
			}
		case "lost":
			topUp.Status = common.TopUpStatusChargeback
		default:
			topUp.Status = common.TopUpStatusDisputed
		}
		return tx.Save(topUp).Error
	})
}

func proportionalStripeQuota(totalQuota int64, providerAmount int64, expectedAmount int64) int64 {
	if totalQuota <= 0 || providerAmount <= 0 || expectedAmount <= 0 {
		return 0
	}
	if providerAmount >= expectedAmount {
		return totalQuota
	}
	return totalQuota * providerAmount / expectedAmount
}

func maxStripeReversedQuota(left int64, right int64) int64 {
	if left > right {
		return left
	}
	return right
}
