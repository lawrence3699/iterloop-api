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
import type { CurrencyFormatOptions } from '@/lib/currency'

import type {
  PricingCurrencyOption,
  PricingCurrencyPolicy,
  ResolvedPricingCurrency,
} from '../types'

const FALLBACK_CNY: PricingCurrencyOption = {
  currency: 'CNY',
  symbol: '¥',
  exchange_rate: 7.3,
}

const FALLBACK_AUD: PricingCurrencyOption = {
  currency: 'AUD',
  symbol: 'A$',
  exchange_rate: 1.52,
}

function normalizeOption(
  option: PricingCurrencyOption | undefined,
  fallback: PricingCurrencyOption
): PricingCurrencyOption {
  const exchangeRate = Number(option?.exchange_rate)
  return {
    currency: option?.currency?.trim() || fallback.currency,
    symbol: option?.symbol?.trim() || fallback.symbol,
    exchange_rate:
      Number.isFinite(exchangeRate) && exchangeRate > 0
        ? exchangeRate
        : fallback.exchange_rate,
  }
}

export function resolvePricingCurrency(
  policy: PricingCurrencyPolicy | undefined,
  language: string | undefined
): ResolvedPricingCurrency {
  const chinese = language?.trim().toLowerCase().startsWith('zh') ?? false
  const option = chinese
    ? normalizeOption(policy?.chinese, FALLBACK_CNY)
    : normalizeOption(policy?.english, FALLBACK_AUD)

  return {
    code: option.currency,
    symbol: option.symbol,
    exchangeRate: option.exchange_rate,
    locale: chinese ? 'zh-CN' : 'en-AU',
  }
}

function stripTrailingZeros(value: string): string {
  if (!value.includes('.')) return value
  return value.replace(/(\.[0-9]*?)0+$/, '$1').replace(/\.$/, '')
}

export function formatPricingCurrencyFromUSD(
  amountUSD: number | null | undefined,
  currency: ResolvedPricingCurrency | undefined,
  options?: CurrencyFormatOptions
): string {
  if (amountUSD == null || !Number.isFinite(amountUSD)) return '-'

  const resolved = currency ?? resolvePricingCurrency(undefined, 'en')
  const amount = amountUSD * resolved.exchangeRate
  const digits =
    Math.abs(amount) >= 1
      ? (options?.digitsLarge ?? 4)
      : (options?.digitsSmall ?? 6)
  const threshold = options?.minimumNonZero ?? Math.pow(10, -digits)
  const adjusted =
    amount !== 0 && Math.abs(amount) < threshold
      ? Math.sign(amount) * threshold
      : amount
  const formatted = new Intl.NumberFormat(resolved.locale, {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(adjusted)

  return `${resolved.symbol}${stripTrailingZeros(formatted)}`
}
