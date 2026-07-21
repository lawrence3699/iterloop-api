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
import type { StripePreset, TopupInfo } from '../types'

// ============================================================================
// Stripe language-aware presets & custom-amount math (display only).
//
// All authoritative amounts are computed server-side from the preset id or
// amount_cents; the helpers below only mirror that arithmetic for preview.
// Credits are USD-credit cents (int); charges are AUD minor units (int).
// The backend publishes the catalogs as face-value arrays (`aud_presets`,
// `cny_presets`) plus `usd_exchange_rate` (¥ per $1 credit) and
// `stripe_min_charge_minor` on /api/user/topup/info.
// ============================================================================

/** Minimum Stripe charge for custom amounts: A$1.00 (above Stripe's A$0.50 floor). */
export const STRIPE_MIN_CHARGE_CENTS = 100

/** Maximum credited amount: 10000 USD credits, in cents. */
export const STRIPE_MAX_CREDIT_CENTS = 10000 * 100

export type StripePresetFamily = 'AUD' | 'CNY'

/** UI language → preset currency family (zh sees ¥ presets, en sees A$). */
export function stripePresetFamilyForLanguage(
  language: string
): StripePresetFamily {
  return language === 'en' ? 'AUD' : 'CNY'
}

/** Credited USD-credit cents for a face value in the preset currency. */
export function stripeCreditCentsFromFace(
  faceValue: number,
  family: StripePresetFamily,
  usdExchangeRate: number
): number {
  if (family === 'AUD') {
    // 1:1 rule — A$1 buys $1 of credit.
    return Math.round(faceValue * 100)
  }
  const rate = usdExchangeRate > 0 ? usdExchangeRate : 1
  return Math.round((faceValue * 100) / rate)
}

/** AUD minor units charged for a credited amount (credit × unit price, 1.0 in prod). */
export function stripeChargeCentsFromCredit(creditCents: number): number {
  return Math.round(creditCents)
}

const DEFAULT_FACE_VALUES: Record<StripePresetFamily, number[]> = {
  AUD: [5, 20, 50],
  CNY: [10, 30, 100],
}

/** ¥-per-$ rate for CNY preset conversion; prefers the topup-info value. */
export function stripeUsdExchangeRate(
  topupInfo: TopupInfo | null,
  fallbackRate: number
): number {
  const fromInfo = topupInfo?.usd_exchange_rate
  if (typeof fromInfo === 'number' && fromInfo > 0) return fromInfo
  return fallbackRate > 0 ? fallbackRate : 1
}

/**
 * Presets for the current UI language, built from the server catalogs
 * (`aud_presets` / `cny_presets` face values). Falls back to the
 * owner-approved defaults when the backend hasn't published catalogs yet.
 * Submitting always goes through preset id or amount_cents, so the local
 * credit/charge derivation is display-only.
 */
export function getStripePresetsForLanguage(
  topupInfo: TopupInfo | null,
  language: string,
  usdExchangeRate: number
): StripePreset[] {
  const family = stripePresetFamilyForLanguage(language)
  const serverFaces =
    family === 'AUD' ? topupInfo?.aud_presets : topupInfo?.cny_presets
  const faces =
    Array.isArray(serverFaces) && serverFaces.length > 0
      ? serverFaces.filter((face) => Number.isInteger(face) && face > 0)
      : DEFAULT_FACE_VALUES[family]

  return faces.map((face) => {
    const amountCents = stripeCreditCentsFromFace(
      face,
      family,
      usdExchangeRate
    )
    return {
      id: `${family.toLowerCase()}-${face}`,
      currency: family,
      face_value: face,
      amount_cents: amountCents,
      charge_cents: stripeChargeCentsFromCredit(amountCents),
    }
  })
}

/** True when the string is a positive number with at most 2 decimal places. */
export function isValidStripeAmountInput(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value.trim())
}

export interface StripeCustomQuote {
  /** Credited USD credits in cents */
  amountCents: number
  /** Charged AUD amount in minor units */
  chargeCents: number
}

/**
 * Preview quote for a custom amount typed in the UI currency
 * (en → A$, zh → ¥). Returns null when the input is not parseable.
 */
export function quoteStripeCustomAmount(
  input: string,
  family: StripePresetFamily,
  usdExchangeRate: number
): StripeCustomQuote | null {
  if (!isValidStripeAmountInput(input)) return null
  const face = Number.parseFloat(input)
  if (!Number.isFinite(face) || face <= 0) return null

  const amountCents = stripeCreditCentsFromFace(face, family, usdExchangeRate)
  return {
    amountCents,
    chargeCents: stripeChargeCentsFromCredit(amountCents),
  }
}

/** Format USD-credit cents like "$5" / "$1.37". */
export function formatCreditCents(cents: number): string {
  const value = (cents / 100).toFixed(2).replace(/\.00$/, '')
  return `$${value}`
}

/** Format AUD minor units like "A$5.00". */
export function formatAudCents(cents: number): string {
  return `A$${(cents / 100).toFixed(2)}`
}
