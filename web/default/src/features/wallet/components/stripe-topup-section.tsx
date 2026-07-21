/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useSystemConfigStore } from '@/stores/system-config-store'

import { isApiSuccess, requestStripeCheckout } from '../api'
import {
  STRIPE_MAX_CREDIT_CENTS,
  STRIPE_MIN_CHARGE_CENTS,
  formatAudCents,
  formatCreditCents,
  getStripePresetsForLanguage,
  quoteStripeCustomAmount,
  stripePresetFamilyForLanguage,
  stripeUsdExchangeRate,
} from '../lib/stripe'
import { getPaymentIcon } from '../lib/ui'
import type { StripeCheckoutRequest, TopupInfo } from '../types'

interface StripeTopupSectionProps {
  topupInfo: TopupInfo
}

/**
 * Language-aware Stripe top-up: zh users see ¥ face-value presets
 * (¥10/¥30/¥100), en users see A$ presets (A$5/A$20/A$50), plus a custom
 * amount in the same face currency. Charged and credited amounts are always
 * previewed; the server recomputes both from the preset id / amount_cents.
 */
export function StripeTopupSection(props: StripeTopupSectionProps) {
  const { t, i18n } = useTranslation()
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [customInput, setCustomInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Raw ¥-per-$ conversion rate (7.3 in production). Prefers the topup-info
  // value published by the backend; deliberately NOT the display-effective
  // rate, which collapses to 1 when the display currency is USD.
  const configExchangeRate = useSystemConfigStore(
    (s) => s.config.currency.usdExchangeRate
  )
  const usdExchangeRate = stripeUsdExchangeRate(
    props.topupInfo,
    configExchangeRate
  )
  const family = stripePresetFamilyForLanguage(i18n.language)
  const faceSymbol = family === 'AUD' ? 'A$' : '¥'
  const minChargeCents =
    props.topupInfo.stripe_min_charge_minor ?? STRIPE_MIN_CHARGE_CENTS
  // Custom amounts stay locked out only while the backend still enforces
  // preset-only checkout; once it reports false the input is available.
  const customAllowed = props.topupInfo.stripe_preset_only === false

  const presets = useMemo(
    () =>
      getStripePresetsForLanguage(
        props.topupInfo,
        i18n.language,
        usdExchangeRate
      ),
    [props.topupInfo, i18n.language, usdExchangeRate]
  )

  const customQuote = useMemo(() => {
    if (!customInput.trim()) return null
    return quoteStripeCustomAmount(customInput, family, usdExchangeRate)
  }, [customInput, family, usdExchangeRate])

  const customError = useMemo(() => {
    if (!customInput.trim()) return null
    if (!customQuote) return t('Please enter a valid amount')
    if (customQuote.chargeCents < minChargeCents) {
      return t('Minimum charge {{amount}}', {
        amount: formatAudCents(minChargeCents),
      })
    }
    if (customQuote.amountCents > STRIPE_MAX_CREDIT_CENTS) {
      return t('Amount exceeds the maximum of {{amount}} credits', {
        amount: STRIPE_MAX_CREDIT_CENTS / 100,
      })
    }
    return null
  }, [customInput, customQuote, minChargeCents, t])

  const selectedPreset =
    presets.find((preset) => preset.id === selectedPresetId) ?? null
  const usingCustom = !selectedPreset && customAllowed
  const canSubmit = selectedPreset
    ? !submitting
    : Boolean(usingCustom && customQuote && !customError && !submitting)

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId)
    setCustomInput('')
  }

  const handleCustomInput = (value: string) => {
    setCustomInput(value)
    setSelectedPresetId(null)
  }

  const handleCheckout = async () => {
    let request: StripeCheckoutRequest | null = null
    if (selectedPreset) {
      request = { preset: selectedPreset.id, payment_method: 'stripe' }
    } else if (customQuote && !customError) {
      request = {
        amount_cents: customQuote.amountCents,
        payment_method: 'stripe',
      }
    }
    if (!request) return

    try {
      setSubmitting(true)
      const response = await requestStripeCheckout(request)
      if (!isApiSuccess(response)) {
        toast.error(response.message || t('Payment request failed'))
        return
      }
      if (response.data?.pay_link) {
        window.open(response.data.pay_link, '_blank')
        toast.success(t('Redirecting to payment page...'))
        return
      }
      toast.error(t('Payment request failed'))
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setSubmitting(false)
    }
  }

  let summary: { credit: string; charge: string } | null = null
  if (selectedPreset) {
    summary = {
      credit: formatCreditCents(selectedPreset.amount_cents),
      charge: formatAudCents(selectedPreset.charge_cents),
    }
  } else if (customQuote && !customError) {
    summary = {
      credit: formatCreditCents(customQuote.amountCents),
      charge: formatAudCents(customQuote.chargeCents),
    }
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='space-y-2.5 sm:space-y-3'>
        <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          {t('Amount')}
        </Label>
        <div className='grid grid-cols-3 gap-1.5 sm:gap-3'>
          {presets.map((preset) => (
            <Button
              key={preset.id}
              variant='outline'
              className={cn(
                'flex min-h-16 flex-col items-start rounded-lg px-3 py-2.5 text-left whitespace-normal sm:min-h-[72px] sm:p-4',
                selectedPresetId === preset.id
                  ? 'border-foreground bg-foreground/5 dark:border-foreground dark:bg-foreground/10'
                  : 'border-muted'
              )}
              onClick={() => handleSelectPreset(preset.id)}
            >
              <span className='text-base font-semibold sm:text-lg'>
                {faceSymbol}
                {preset.face_value}
              </span>
              <span className='text-muted-foreground mt-1.5 w-full text-xs sm:mt-2'>
                {t('Credited {{amount}}', {
                  amount: formatCreditCents(preset.amount_cents),
                })}
                {' · '}
                {t('Charged {{amount}}', {
                  amount: formatAudCents(preset.charge_cents),
                })}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {customAllowed && (
        <div className='space-y-2.5 sm:space-y-3'>
          <Label
            htmlFor='stripe-custom-amount'
            className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
          >
            {t('Custom Amount')}
          </Label>
          <div className='grid grid-cols-[minmax(0,1fr)_minmax(140px,0.7fr)] gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center'>
            <div className='relative'>
              <span className='text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm'>
                {faceSymbol}
              </span>
              <Input
                id='stripe-custom-amount'
                type='text'
                inputMode='decimal'
                value={customInput}
                onChange={(e) => handleCustomInput(e.target.value)}
                placeholder={t('Minimum charge {{amount}}', {
                  amount: formatAudCents(minChargeCents),
                })}
                className='h-9 pl-9 text-base sm:h-10 sm:text-lg'
                aria-invalid={Boolean(customError)}
              />
            </div>
            <div className='bg-muted/30 flex min-h-9 items-center justify-between gap-2 rounded-md border px-3 lg:min-w-64'>
              {customQuote && !customError ? (
                <span className='truncate text-xs'>
                  {t('Credited {{amount}}', {
                    amount: formatCreditCents(customQuote.amountCents),
                  })}
                  {' · '}
                  {t('Charged {{amount}}', {
                    amount: formatAudCents(customQuote.chargeCents),
                  })}
                </span>
              ) : (
                <span className='text-muted-foreground truncate text-xs'>
                  {t('Credited {{amount}}', { amount: '—' })}
                </span>
              )}
            </div>
          </div>
          {customError && (
            <p className='text-destructive text-xs'>{customError}</p>
          )}
        </div>
      )}

      <div className='space-y-2.5 sm:space-y-3'>
        <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          {t('Payment Method')}
        </Label>
        <Button
          variant='outline'
          onClick={handleCheckout}
          disabled={!canSubmit}
          className='min-h-14 w-full justify-start gap-2 rounded-lg px-3 py-2 text-left sm:w-auto sm:min-w-64'
        >
          {submitting ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            getPaymentIcon('stripe', 'h-4 w-4')
          )}
          <span className='flex min-w-0 flex-col items-start gap-0.5'>
            <span className='max-w-full truncate'>
              {t('Pay with Stripe')}
            </span>
            {summary && (
              <span className='text-muted-foreground max-w-full truncate text-[11px] leading-4 font-normal'>
                {t('Charged {{amount}}', { amount: summary.charge })}
                {' · '}
                {t('Credited {{amount}}', { amount: summary.credit })}
              </span>
            )}
          </span>
        </Button>
      </div>
    </div>
  )
}
