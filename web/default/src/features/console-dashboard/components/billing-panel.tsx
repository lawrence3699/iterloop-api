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
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgePercent,
  CircleDollarSign,
  WalletCards,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { PricingData } from '@/features/pricing/types'
import { Wallet } from '@/features/wallet'
import { api } from '@/lib/api'
import {
  formatBillingCurrencyFromUSD,
  getCurrencyDisplay,
} from '@/lib/currency'
import { formatLogQuota, formatQuota } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'

import { getSelfAnalytics } from '../api'

export function BillingPanel() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const analyticsQuery = useQuery({
    queryKey: ['self-analytics', 'current-month'],
    queryFn: async () => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const response = await getSelfAnalytics({
        startTimestamp: Math.floor(monthStart.getTime() / 1000),
        endTimestamp: Math.floor(now.getTime() / 1000),
      })
      return response.data
    },
  })
  const pricingQuery = useQuery({
    queryKey: ['pricing', 'billing-savings'],
    queryFn: async () => {
      const response = await api.get('/api/pricing')
      return response.data as PricingData
    },
  })

  const savingsUSD = useMemo(() => {
    const analytics = analyticsQuery.data
    const pricing = pricingQuery.data?.data
    if (!analytics || !pricing) return 0

    const pricingByModel = new Map(
      pricing.map((item) => [item.model_name, item])
    )
    const officialUSD = analytics.models.reduce((total, item) => {
      const official = pricingByModel.get(item.model_name)?.official_price
      if (!official) return total
      const uncachedInput = Math.max(item.input_tokens - item.cached_tokens, 0)
      const cachedRate = official.cache_read_usd ?? official.input_usd
      return (
        total +
        (uncachedInput * official.input_usd +
          item.cached_tokens * cachedRate +
          item.output_tokens * official.output_usd) /
          1_000_000
      )
    }, 0)
    const chargedUSD =
      analytics.totals.quota / getCurrencyDisplay().config.quotaPerUnit
    return Math.max(officialUSD - chargedUSD, 0)
  }, [analyticsQuery.data, pricingQuery.data])

  const cards = [
    {
      label: t('Spent this month'),
      value: formatLogQuota(analyticsQuery.data?.totals.quota ?? 0),
      detail: t('{{count}} settled requests', {
        count: analyticsQuery.data?.totals.requests ?? 0,
      }),
      icon: CircleDollarSign,
    },
    {
      label: t('Saved vs official'),
      value: formatBillingCurrencyFromUSD(savingsUSD),
      detail: t('Estimated from official token rates'),
      icon: BadgePercent,
    },
  ]

  const scrollToAddFunds = () => {
    document
      .querySelector('#wallet-add-funds')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className='iterloop-dashboard-stack iterloop-billing-panel'>
      {/* Background image set inline: the bundler rewrites absolute url()
          in CSS as module imports and breaks the build. */}
      <section
        className='dashboard-wallet-card'
        style={{ backgroundImage: "url('/media/clone/hero-art-bg.png')" }}
      >
        <div className='dashboard-wallet-top'>
          <div>
            <p>{t('Wallet balance')}</p>
            <p className='dashboard-wallet-amount'>
              {formatQuota(user?.quota ?? 0)}
            </p>
          </div>
          <button type='button' onClick={scrollToAddFunds}>
            <WalletCards aria-hidden='true' />
            {t('Top up')}
          </button>
        </div>
      </section>

      <div className='iterloop-billing-summary'>
        {cards.map((card) => (
          <article key={card.label}>
            <card.icon aria-hidden='true' />
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.detail}</small>
            </div>
          </article>
        ))}
      </div>

      <section className='iterloop-request-billing-callout'>
        <div>
          <span>{t('Per-request billing')}</span>
          <p>
            {t(
              'Inspect settled cost, model share, and hourly trends without exposing prompt or response content.'
            )}
          </p>
        </div>
        <Button
          variant='outline'
          render={<Link to='/dashboard' search={{ tab: 'cost' }} />}
        >
          {t('View cost details')}
          <ArrowRight aria-hidden='true' />
        </Button>
      </section>

      <Wallet embedded />
    </div>
  )
}
