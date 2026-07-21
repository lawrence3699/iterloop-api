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
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { usePricingData } from '@/features/pricing/hooks/use-pricing-data'
import {
  formatOfficialPrice,
  formatPrice,
} from '@/features/pricing/lib/price'
import type { PricingModel } from '@/features/pricing/types'

import {
  AnthropicMark,
  DeepSeekMark,
  GlmMark,
  GoogleMark,
  OpenAIMark,
} from './clone-icons'

type VendorFilter = {
  label: string
  match: string[]
  icon?: (props: { size?: number }) => React.ReactNode
}

// Full vendor catalog. Only vendors present in the fetched pricing data are
// rendered as chips; the rest (icons included) stay here for the day the
// production /api/pricing starts serving them.
const VENDOR_FILTERS: VendorFilter[] = [
  { label: 'All', match: [] },
  { label: 'OpenAI', match: ['openai'], icon: OpenAIMark },
  { label: 'Anthropic', match: ['anthropic'], icon: AnthropicMark },
  { label: 'Google', match: ['google', 'gemini'], icon: GoogleMark },
  { label: 'DeepSeek', match: ['deepseek'], icon: DeepSeekMark },
  { label: 'GLM', match: ['glm', 'zhipu'], icon: GlmMark },
]

function matchesVendor(model: PricingModel, filter: VendorFilter): boolean {
  const vendor = (model.vendor_name ?? '').toLowerCase()
  const name = model.model_name.toLowerCase()
  return filter.match.some(
    (candidate) => vendor.includes(candidate) || name.startsWith(candidate)
  )
}

const VENDOR_BADGE_CLASS: Record<string, string> = {
  openai: 'vendor-openai',
  anthropic: 'vendor-anthropic',
  deepseek: 'vendor-deepseek',
  glm: 'vendor-glm',
  zhipu: 'vendor-glm',
}

function vendorBadgeClass(vendorName: string): string {
  return VENDOR_BADGE_CLASS[vendorName.toLowerCase()] ?? 'vendor-plain'
}

function formatContext(model: PricingModel): string {
  const length = model.context_length
  if (!length) return '-'
  if (length >= 1_000_000) {
    const millions = length / 1_000_000
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`
  }
  if (length >= 1000) return `${Math.round(length / 1000)}K`
  return String(length)
}

/** IterLoop settlement price in USD per 1M tokens (group ratio 1). */
function iterLoopUsd(model: PricingModel, type: 'input' | 'output'): number {
  const base = model.model_ratio * 2
  return type === 'output' ? base * model.completion_ratio : base
}

function percentOff(model: PricingModel, type: 'input' | 'output'): number | null {
  const official =
    type === 'input'
      ? model.official_price?.input_usd
      : model.official_price?.output_usd
  if (!official || official <= 0) return null
  const off = Math.round((1 - iterLoopUsd(model, type) / official) * 100)
  return off > 0 ? off : null
}

function ListPriceCell(props: {
  model: PricingModel
  type: 'input' | 'output'
}) {
  const { t } = useTranslation()
  const official =
    props.type === 'input'
      ? props.model.official_price?.input_usd
      : props.model.official_price?.output_usd
  const formatted = formatOfficialPrice(props.model, props.type, 'M')
  const cache =
    props.type === 'input' && props.model.official_price?.cache_read_usd != null
      ? formatOfficialPrice(props.model, 'cache', 'M')
      : null
  const hasDiscount = percentOff(props.model, props.type) != null

  return (
    <td>
      <span className='hc-price-stack'>
        <span className={official && hasDiscount ? 'hc-strike' : undefined}>
          {formatted}
        </span>
        {cache && cache !== '-' && (
          <span className='hc-cache-note'>{t('Cache')}: {cache}</span>
        )}
      </span>
    </td>
  )
}

function IterLoopPriceCell(props: {
  model: PricingModel
  type: 'input' | 'output'
}) {
  const { t } = useTranslation()
  const price = formatPrice(props.model, props.type, 'M')
  const off = percentOff(props.model, props.type)
  const cache =
    props.type === 'input' ? formatPrice(props.model, 'cache', 'M') : null

  return (
    <td className='is-highlight'>
      <span className='hc-price-stack'>
        <span className='hc-price-main'>
          {price}
          {off != null && (
            <span className='hc-off-badge'>
              {t('{{percent}}% off', { percent: off })}
            </span>
          )}
        </span>
        {cache && cache !== '-' && (
          <span className='hc-cache-note'>{t('Cache')}: {cache}</span>
        )}
      </span>
    </td>
  )
}

export function HomeLivePricing() {
  const { t } = useTranslation()
  const pricing = usePricingData()
  const [vendorLabel, setVendorLabel] = useState('All')
  const [search, setSearch] = useState('')

  // "All" plus only the vendors actually present in the fetched pricing data.
  const vendorFilters = useMemo(
    () =>
      VENDOR_FILTERS.filter(
        (filter) =>
          filter.match.length === 0 ||
          pricing.models.some((model) => matchesVendor(model, filter))
      ),
    [pricing.models]
  )

  const activeFilter =
    vendorFilters.find((filter) => filter.label === vendorLabel) ??
    vendorFilters[0]

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return pricing.models.filter((model) => {
      if (query && !model.model_name.toLowerCase().includes(query)) {
        return false
      }
      if (activeFilter.match.length === 0) return true
      return matchesVendor(model, activeFilter)
    })
  }, [pricing.models, activeFilter, search])

  return (
    <section
      id='home-pricing-models'
      className='hc-pricing motion-item'
      aria-label={t('Production model pricing')}
      style={{ '--stagger-delay': '240ms' } as React.CSSProperties}
    >
      <div className='hc-pricing-head'>
        <div>
          <h2 className='hc-pricing-title'>{t('Live pricing')}</h2>
          <p className='hc-pricing-sub'>
            {t(
              'Live prices — discounts may vary with upstream costs. Prices in USD / 1M Tokens.'
            )}
          </p>
        </div>
        <div className='hc-search-wrap'>
          <input
            className='hc-search il-stateful'
            placeholder={t('Search models...')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={t('Search models...')}
          />
        </div>
      </div>

      <div className='hc-vendor-chips'>
        {vendorFilters.map((filter) => (
          <button
            key={filter.label}
            type='button'
            className={
              filter.label === activeFilter.label
                ? 'hc-vendor-chip il-stateful is-on'
                : 'hc-vendor-chip il-stateful'
            }
            onClick={() => setVendorLabel(filter.label)}
          >
            {filter.icon && <filter.icon size={15} />}
            {filter.label === 'All' ? t('All') : filter.label}
          </button>
        ))}
      </div>

      <div className='il-card hc-table-card hc-card-flat'>
        <div className='hc-table-scroll'>
          {pricing.isLoading ? (
            <div className='hc-table-skeletons'>
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className='hc-skeleton-row' />
              ))}
            </div>
          ) : (
            <table className='hc-price-table'>
              <thead>
                <tr>
                  <th>{t('Model')}</th>
                  <th>{t('Provider')}</th>
                  <th>{t('Context')}</th>
                  <th>{t('Input (List)')}</th>
                  <th>{t('Output (List)')}</th>
                  <th className='is-highlight'>{t('Input (IterLoop)')}</th>
                  <th className='is-highlight'>{t('Output (IterLoop)')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((model) => (
                  <tr key={model.model_name}>
                    <td className='hc-model-cell'>
                      <Link
                        to='/pricing'
                        search={{ search: model.model_name }}
                        className='hc-model-link'
                      >
                        {model.model_name}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`hc-vendor-badge ${vendorBadgeClass(model.vendor_name ?? '')}`}
                      >
                        {model.vendor_name ?? '-'}
                      </span>
                    </td>
                    <td className='hc-cell-muted'>
                      {formatContext(model)}
                    </td>
                    <ListPriceCell model={model} type='input' />
                    <ListPriceCell model={model} type='output' />
                    <IterLoopPriceCell model={model} type='input' />
                    <IterLoopPriceCell model={model} type='output' />
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className='hc-table-empty'>
                      {t('No models found.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className='hc-table-fade' aria-hidden='true' />
      </div>
    </section>
  )
}
