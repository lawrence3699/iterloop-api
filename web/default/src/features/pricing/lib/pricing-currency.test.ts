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
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { PricingCurrencyPolicy } from '../types'
import {
  formatPricingCurrencyFromUSD,
  resolvePricingCurrency,
} from './pricing-currency.ts'

const policy: PricingCurrencyPolicy = {
  base_currency: 'USD',
  chinese: { currency: 'CNY', symbol: '¥', exchange_rate: 7.3 },
  english: { currency: 'AUD', symbol: 'A$', exchange_rate: 1.52 },
}

describe('pricing currency', () => {
  test('uses CNY for Chinese and AUD for English', () => {
    const chinese = resolvePricingCurrency(policy, 'zhCN')
    const english = resolvePricingCurrency(policy, 'en')

    assert.equal(chinese.code, 'CNY')
    assert.equal(chinese.exchangeRate, 7.3)
    assert.equal(english.code, 'AUD')
    assert.equal(english.exchangeRate, 1.52)
  })

  test('formats the same USD reference price in locale settlement currencies', () => {
    const chinese = resolvePricingCurrency(policy, 'zh-CN')
    const english = resolvePricingCurrency(policy, 'en-AU')

    assert.equal(
      formatPricingCurrencyFromUSD(0.787, chinese, {
        digitsLarge: 4,
        digitsSmall: 6,
      }),
      '¥5.7451'
    )
    assert.equal(
      formatPricingCurrencyFromUSD(0.787, english, {
        digitsLarge: 4,
        digitsSmall: 6,
      }),
      'A$1.1962'
    )
  })

  test('formats official and IterLoop token prices in the same locale currency', () => {
    const chinese = resolvePricingCurrency(policy, 'zh-CN')
    const english = resolvePricingCurrency(policy, 'en-AU')

    assert.equal(formatPricingCurrencyFromUSD(2.5, chinese), '¥18.25')
    assert.equal(formatPricingCurrencyFromUSD(0.787, chinese), '¥5.7451')
    assert.equal(formatPricingCurrencyFromUSD(2.5, english), 'A$3.8')
    assert.equal(formatPricingCurrencyFromUSD(0.787, english), 'A$1.1962')
  })

  test('falls back safely when the server policy is unavailable', () => {
    assert.equal(resolvePricingCurrency(undefined, 'zhTW').code, 'CNY')
    assert.equal(resolvePricingCurrency(undefined, 'fr').code, 'AUD')
  })
})
