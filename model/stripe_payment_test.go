package model

import (
	"errors"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"

	"github.com/stretchr/testify/require"
)

func insertStripeTopUpForTest(t *testing.T, userId int, tradeNo string, expectedAmount int64, creditedQuota int64) {
	t.Helper()
	require.NoError(t, (&TopUp{
		UserId:            userId,
		Amount:            25,
		Money:             25,
		TradeNo:           tradeNo,
		PaymentMethod:     PaymentMethodStripe,
		PaymentProvider:   PaymentProviderStripe,
		CreateTime:        time.Now().Unix(),
		Status:            common.TopUpStatusPending,
		ExpectedAmount:    expectedAmount,
		Currency:          "AUD",
		CreditedQuota:     creditedQuota,
		ProviderSessionId: "cs_test_expected",
	}).Insert())
}

func stripeConfirmationForTest(tradeNo string, amount int64) StripePaymentConfirmation {
	return StripePaymentConfirmation{
		TradeNo:         tradeNo,
		CheckoutSession: "cs_test_expected",
		PaymentIntent:   "pi_" + tradeNo,
		CustomerId:      "cus_test",
		AmountTotal:     amount,
		Currency:        "aud",
		CallerIp:        "127.0.0.1",
	}
}

func TestStripeWebhookEventLifecycle(t *testing.T) {
	truncateTables(t)

	shouldProcess, err := BeginStripeWebhookEvent("evt_success", "checkout.session.completed", false)
	require.NoError(t, err)
	require.True(t, shouldProcess)
	require.NoError(t, FinishStripeWebhookEvent("evt_success", StripeWebhookEventSucceeded, "ref_1", nil))

	shouldProcess, err = BeginStripeWebhookEvent("evt_success", "checkout.session.completed", false)
	require.NoError(t, err)
	require.False(t, shouldProcess)

	shouldProcess, err = BeginStripeWebhookEvent("evt_retry", "checkout.session.completed", false)
	require.NoError(t, err)
	require.True(t, shouldProcess)
	require.NoError(t, FinishStripeWebhookEvent("evt_retry", StripeWebhookEventFailed, "ref_2", errors.New("temporary database failure")))

	shouldProcess, err = BeginStripeWebhookEvent("evt_retry", "checkout.session.completed", false)
	require.NoError(t, err)
	require.True(t, shouldProcess)

	var retryEvent StripeWebhookEvent
	require.NoError(t, DB.Where("event_id = ?", "evt_retry").First(&retryEvent).Error)
	require.Equal(t, 2, retryEvent.AttemptCount)
	require.Equal(t, StripeWebhookEventProcessing, retryEvent.Status)
	require.Empty(t, retryEvent.LastError)
}

func TestCompleteStripeTopUpValidatesSnapshotAndIsIdempotent(t *testing.T) {
	truncateTables(t)
	insertUserForPaymentGuardTest(t, 501, 100)
	insertStripeTopUpForTest(t, 501, "stripe-complete", 2500, 12_500_000)

	credited, err := CompleteStripeTopUp(stripeConfirmationForTest("stripe-complete", 2500))
	require.NoError(t, err)
	require.True(t, credited)
	require.Equal(t, 12_500_100, getUserQuotaForPaymentGuardTest(t, 501))

	credited, err = CompleteStripeTopUp(stripeConfirmationForTest("stripe-complete", 2500))
	require.NoError(t, err)
	require.False(t, credited)
	require.Equal(t, 12_500_100, getUserQuotaForPaymentGuardTest(t, 501))

	topUp := GetTopUpByTradeNo("stripe-complete")
	require.NotNil(t, topUp)
	require.Equal(t, common.TopUpStatusSuccess, topUp.Status)
	require.Equal(t, "pi_stripe-complete", topUp.ProviderPaymentId)
	require.Equal(t, "cus_test", func() string {
		var user User
		require.NoError(t, DB.First(&user, 501).Error)
		return user.StripeCustomer
	}())
}

func TestCompleteStripeTopUpRejectsAmountCurrencyAndSessionMismatch(t *testing.T) {
	tests := []struct {
		name        string
		mutate      func(*StripePaymentConfirmation)
		expectedErr error
	}{
		{
			name: "amount",
			mutate: func(input *StripePaymentConfirmation) {
				input.AmountTotal = 2499
			},
			expectedErr: ErrStripeAmountMismatch,
		},
		{
			name: "currency",
			mutate: func(input *StripePaymentConfirmation) {
				input.Currency = "USD"
			},
			expectedErr: ErrStripeCurrencyMismatch,
		},
		{
			name: "session",
			mutate: func(input *StripePaymentConfirmation) {
				input.CheckoutSession = "cs_wrong"
			},
			expectedErr: ErrStripeSessionMismatch,
		},
	}

	for index, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			truncateTables(t)
			userId := 520 + index
			tradeNo := "stripe-mismatch-" + test.name
			insertUserForPaymentGuardTest(t, userId, 0)
			insertStripeTopUpForTest(t, userId, tradeNo, 2500, 10_000)
			input := stripeConfirmationForTest(tradeNo, 2500)
			test.mutate(&input)

			credited, err := CompleteStripeTopUp(input)
			require.ErrorIs(t, err, test.expectedErr)
			require.False(t, credited)
			require.Equal(t, 0, getUserQuotaForPaymentGuardTest(t, userId))
			require.Equal(t, common.TopUpStatusPending, getTopUpStatusForPaymentGuardTest(t, tradeNo))
		})
	}
}

func TestStripeRefundIsCumulativeAndIdempotent(t *testing.T) {
	truncateTables(t)
	insertUserForPaymentGuardTest(t, 601, 0)
	insertStripeTopUpForTest(t, 601, "stripe-refund", 10_000, 1_000)
	_, err := CompleteStripeTopUp(stripeConfirmationForTest("stripe-refund", 10_000))
	require.NoError(t, err)
	require.Equal(t, 1_000, getUserQuotaForPaymentGuardTest(t, 601))

	require.NoError(t, ApplyStripeRefund("pi_stripe-refund", 2_500, "AUD"))
	require.Equal(t, 750, getUserQuotaForPaymentGuardTest(t, 601))
	// An older out-of-order cumulative event cannot lower the stored watermark.
	require.NoError(t, ApplyStripeRefund("pi_stripe-refund", 1_000, "AUD"))
	require.Equal(t, 750, getUserQuotaForPaymentGuardTest(t, 601))
	require.Equal(t, common.TopUpStatusPartiallyRefunded, getTopUpStatusForPaymentGuardTest(t, "stripe-refund"))

	// Stripe sends the cumulative refunded amount; replaying it must not deduct twice.
	require.NoError(t, ApplyStripeRefund("pi_stripe-refund", 2_500, "AUD"))
	require.Equal(t, 750, getUserQuotaForPaymentGuardTest(t, 601))

	require.NoError(t, ApplyStripeRefund("pi_stripe-refund", 10_000, "AUD"))
	require.Equal(t, 0, getUserQuotaForPaymentGuardTest(t, 601))
	require.Equal(t, common.TopUpStatusRefunded, getTopUpStatusForPaymentGuardTest(t, "stripe-refund"))
}

func TestStripeDisputeReversesAndRestoresQuota(t *testing.T) {
	truncateTables(t)
	insertUserForPaymentGuardTest(t, 701, 0)
	insertStripeTopUpForTest(t, 701, "stripe-dispute", 10_000, 1_000)
	_, err := CompleteStripeTopUp(stripeConfirmationForTest("stripe-dispute", 10_000))
	require.NoError(t, err)

	require.NoError(t, ApplyStripeDispute("pi_stripe-dispute", 10_000, "AUD", "needs_response", 100))
	require.Equal(t, 0, getUserQuotaForPaymentGuardTest(t, 701))
	require.Equal(t, common.TopUpStatusDisputed, getTopUpStatusForPaymentGuardTest(t, "stripe-dispute"))

	// Repeated updates for the same amount do not reverse twice.
	require.NoError(t, ApplyStripeDispute("pi_stripe-dispute", 10_000, "AUD", "under_review", 101))
	require.Equal(t, 0, getUserQuotaForPaymentGuardTest(t, 701))

	require.NoError(t, ApplyStripeDispute("pi_stripe-dispute", 10_000, "AUD", "won", 102))
	require.Equal(t, 1_000, getUserQuotaForPaymentGuardTest(t, 701))
	require.Equal(t, common.TopUpStatusSuccess, getTopUpStatusForPaymentGuardTest(t, "stripe-dispute"))

	// An older event arriving after closure must not reopen the dispute.
	require.NoError(t, ApplyStripeDispute("pi_stripe-dispute", 10_000, "AUD", "under_review", 101))
	require.Equal(t, 1_000, getUserQuotaForPaymentGuardTest(t, 701))
	require.Equal(t, common.TopUpStatusSuccess, getTopUpStatusForPaymentGuardTest(t, "stripe-dispute"))
}

func TestStripeRefundAndDisputeNeverReverseMoreThanCreditedQuota(t *testing.T) {
	truncateTables(t)
	insertUserForPaymentGuardTest(t, 702, 0)
	insertStripeTopUpForTest(t, 702, "stripe-refund-dispute", 10_000, 1_000)
	_, err := CompleteStripeTopUp(stripeConfirmationForTest("stripe-refund-dispute", 10_000))
	require.NoError(t, err)

	require.NoError(t, ApplyStripeDispute("pi_stripe-refund-dispute", 10_000, "AUD", "needs_response", 100))
	require.Equal(t, 0, getUserQuotaForPaymentGuardTest(t, 702))
	require.NoError(t, ApplyStripeRefund("pi_stripe-refund-dispute", 10_000, "AUD"))
	require.Equal(t, 0, getUserQuotaForPaymentGuardTest(t, 702))

	// Winning the dispute does not restore quota because the full refund remains.
	require.NoError(t, ApplyStripeDispute("pi_stripe-refund-dispute", 10_000, "AUD", "won", 101))
	require.Equal(t, 0, getUserQuotaForPaymentGuardTest(t, 702))
	require.Equal(t, common.TopUpStatusRefunded, getTopUpStatusForPaymentGuardTest(t, "stripe-refund-dispute"))
}
