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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { DEFAULT_PRICING_PAGE_SIZE, DEFAULT_TOKEN_UNIT } from '../constants'
import {
  getDynamicDisplayGroupRatio,
  getDynamicPricingSummary,
} from '../lib/dynamic-price'
import { isTokenBasedModel } from '../lib/model-helpers'
import {
  formatOfficialPrice,
  formatPrice,
  formatRequestPrice,
  getDiscountPercent,
  stripTrailingZeros,
} from '../lib/price'
import type { PriceType, PricingModel, TokenUnit } from '../types'

const VENDOR_PILL_CLASSES: Record<string, string> = {
  OpenAI: 'bg-[#e9f7ef] text-[#0f6b3d]',
  Anthropic: 'bg-[#fef3e2] text-[#8a5900]',
  Google: 'text-[var(--text-primary)]',
  DeepSeek: 'bg-[#f1f5f9] text-[#334155]',
  GLM: 'bg-[#f3ecff] text-[#5933b6]',
}

const TOKEN_COUNT_FORMAT = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
})

function formatContextLength(tokens?: number): string {
  if (tokens == null || !Number.isFinite(tokens) || tokens <= 0) return '—'
  if (tokens >= 1_000_000) {
    return `${TOKEN_COUNT_FORMAT.format(tokens / 1_000_000)}M`
  }
  if (tokens >= 1_000) return `${TOKEN_COUNT_FORMAT.format(tokens / 1_000)}K`
  return TOKEN_COUNT_FORMAT.format(tokens)
}

const HIGHLIGHT_TD = 'il-table-highlight'

export interface ClonePricingTableProps {
  models: PricingModel[]
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
  selectedGroup?: string
  onModelClick?: (modelName: string) => void
}

function DiscountBadge(props: { percent: number }) {
  const { t } = useTranslation()
  return (
    <span className='rounded-full bg-[#fff1e6] px-2 py-0.5 text-xs font-bold text-[#d0240f] dark:bg-[#3a2520] dark:text-[#ffb49a]'>
      {t('{{percent}}% off', { percent: props.percent })}
    </span>
  )
}

function ListPriceCell(props: {
  model: PricingModel
  type: PriceType
  tokenUnit: TokenUnit
  cacheLine?: string
}) {
  const { t } = useTranslation()
  const price = formatOfficialPrice(props.model, props.type, props.tokenUnit)
  if (price === '-') {
    return <span className='text-[var(--text-tertiary)]'>—</span>
  }
  return (
    <span className='inline-flex flex-col items-start gap-0.5'>
      <span className='line-through decoration-[var(--text-tertiary)] decoration-1'>
        {price}
      </span>
      {props.cacheLine && (
        <span className='text-xs leading-4 font-normal text-[var(--text-tertiary)]'>
          {t('Cache')}: {props.cacheLine}
        </span>
      )}
    </span>
  )
}

function IterLoopPriceCell(props: {
  model: PricingModel
  type: PriceType
  tokenUnit: TokenUnit
  showRechargePrice: boolean
  priceRate: number
  usdExchangeRate: number
  selectedGroup?: string
  cacheLine?: string
}) {
  const { t } = useTranslation()
  const model = props.model

  const dynamicSummary = getDynamicPricingSummary(model, {
    tokenUnit: props.tokenUnit,
    showRechargePrice: props.showRechargePrice,
    priceRate: props.priceRate,
    usdExchangeRate: props.usdExchangeRate,
    groupRatioMultiplier: getDynamicDisplayGroupRatio(
      model,
      props.selectedGroup
    ),
  })

  if (dynamicSummary) {
    if (dynamicSummary.isSpecialExpression) {
      return (
        <span className='text-xs text-[var(--text-tertiary)]'>
          {t('Special billing expression')}
        </span>
      )
    }
    const field = props.type === 'input' ? 'inputPrice' : 'outputPrice'
    const entry =
      dynamicSummary.entries.find((item) => item.field === field) ??
      dynamicSummary.primaryEntries[0]
    if (!entry) {
      return (
        <span className='text-xs text-[var(--text-tertiary)]'>
          {t('Dynamic Pricing')}
        </span>
      )
    }
    return (
      <span className='inline-flex flex-col items-start gap-0.5'>
        <span className='font-semibold'>
          {stripTrailingZeros(entry.formatted)}
        </span>
        <span className='text-xs leading-4 font-normal text-[var(--text-tertiary)]'>
          {t('Dynamic Pricing')}
        </span>
      </span>
    )
  }

  if (!isTokenBasedModel(model)) {
    if (props.type === 'output') {
      return <span className='text-[var(--text-tertiary)]'>—</span>
    }
    const requestPrice = stripTrailingZeros(
      formatRequestPrice(
        model,
        props.showRechargePrice,
        props.priceRate,
        props.usdExchangeRate,
        props.selectedGroup
      )
    )
    return (
      <span className='inline-flex flex-col items-start gap-0.5'>
        <span className='font-semibold'>{requestPrice}</span>
        <span className='text-xs leading-4 font-normal text-[var(--text-tertiary)]'>
          / {t('request')}
        </span>
      </span>
    )
  }

  const price = formatPrice(
    model,
    props.type,
    props.tokenUnit,
    props.showRechargePrice,
    props.priceRate,
    props.usdExchangeRate,
    props.selectedGroup
  )
  const percent = getDiscountPercent(
    model,
    props.type,
    props.showRechargePrice,
    props.priceRate,
    props.usdExchangeRate,
    props.selectedGroup
  )

  return (
    <span className='inline-flex flex-col items-start gap-0.5'>
      <span className='inline-flex items-center gap-2 font-semibold'>
        {price}
        {percent != null && <DiscountBadge percent={percent} />}
      </span>
      {props.cacheLine && (
        <span className='text-xs leading-4 font-normal text-[var(--text-tertiary)]'>
          {t('Cache')}: {props.cacheLine}
        </span>
      )}
    </span>
  )
}

/**
 * Live pricing table reproduced from the captured iter-loop.com pricing
 * page: Model / Provider / Context / list prices (struck through) and the
 * cream-highlighted IterLoop columns with red "% off" badges.
 */
export function ClonePricingTable(props: ClonePricingTableProps) {
  const { t } = useTranslation()
  const tokenUnit = props.tokenUnit ?? DEFAULT_TOKEN_UNIT
  const priceRate = props.priceRate ?? 1
  const usdExchangeRate = props.usdExchangeRate ?? 1
  const showRechargePrice = props.showRechargePrice ?? false

  const [page, setPage] = useState(1)
  const pageSize = DEFAULT_PRICING_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(props.models.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  useEffect(() => {
    setPage(1)
  }, [props.models])

  const pagedModels = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return props.models.slice(start, start + pageSize)
  }, [currentPage, pageSize, props.models])

  if (props.models.length === 0) return null

  return (
    <div className='overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0'>
      <div className='relative'>
        <div className='overflow-x-auto'>
          <table className='il-table min-w-[1024px]'>
            <thead>
              <tr>
                <th>{t('Model')}</th>
                <th>{t('Provider')}</th>
                <th>{t('Context')}</th>
                <th>{t('Input (List)')}</th>
                <th>{t('Output (List)')}</th>
                <th className='il-table-highlight'>{t('Input (IterLoop)')}</th>
                <th className='il-table-highlight'>{t('Output (IterLoop)')}</th>
              </tr>
            </thead>
            <tbody>
              {pagedModels.map((model) => {
                const officialCacheRead = model.official_price?.cache_read_usd
                const listCacheLine =
                  officialCacheRead != null && officialCacheRead > 0
                    ? formatOfficialPrice(model, 'cache', tokenUnit)
                    : undefined
                const iterLoopCacheLine =
                  isTokenBasedModel(model) && model.cache_ratio != null
                    ? formatPrice(
                        model,
                        'cache',
                        tokenUnit,
                        showRechargePrice,
                        priceRate,
                        usdExchangeRate,
                        props.selectedGroup
                      )
                    : undefined
                const vendorName = model.vendor_name
                const vendorPillClass = vendorName
                  ? (VENDOR_PILL_CLASSES[vendorName] ??
                    'bg-[var(--bg-surface)] text-[var(--text-secondary)]')
                  : undefined

                return (
                  <tr
                    key={model.id ?? model.model_name}
                    className='cursor-pointer transition-colors hover:bg-[var(--bg-canvas)]/60'
                    onClick={() => props.onModelClick?.(model.model_name)}
                  >
                    <td className='font-medium transition-colors hover:text-[var(--text-link)]'>
                      <span className='inline-flex items-center gap-1.5'>
                        {model.model_name}
                      </span>
                    </td>
                    <td>
                      {vendorName ? (
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-xs font-medium',
                            vendorPillClass
                          )}
                        >
                          {vendorName}
                        </span>
                      ) : (
                        <span className='text-[var(--text-tertiary)]'>—</span>
                      )}
                    </td>
                    <td className='text-[var(--text-secondary)]'>
                      {formatContextLength(model.context_length)}
                    </td>
                    <td>
                      <ListPriceCell
                        model={model}
                        type='input'
                        tokenUnit={tokenUnit}
                        cacheLine={listCacheLine}
                      />
                    </td>
                    <td>
                      <ListPriceCell
                        model={model}
                        type='output'
                        tokenUnit={tokenUnit}
                      />
                    </td>
                    <td className={HIGHLIGHT_TD}>
                      <IterLoopPriceCell
                        model={model}
                        type='input'
                        tokenUnit={tokenUnit}
                        showRechargePrice={showRechargePrice}
                        priceRate={priceRate}
                        usdExchangeRate={usdExchangeRate}
                        selectedGroup={props.selectedGroup}
                        cacheLine={iterLoopCacheLine}
                      />
                    </td>
                    <td className={HIGHLIGHT_TD}>
                      <IterLoopPriceCell
                        model={model}
                        type='output'
                        tokenUnit={tokenUnit}
                        showRechargePrice={showRechargePrice}
                        priceRate={priceRate}
                        usdExchangeRate={usdExchangeRate}
                        selectedGroup={props.selectedGroup}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--bg-surface)] to-transparent md:hidden'
        />
      </div>

      {totalPages > 1 && (
        <div className='flex flex-col items-center justify-between gap-3 border-t border-[color-mix(in_srgb,var(--border-subtle)_70%,transparent)] px-4 py-4 text-sm text-[var(--text-secondary)] sm:flex-row'>
          <p>
            {t('Page {{current}} of {{total}}', {
              current: currentPage,
              total: totalPages,
            })}
          </p>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              className='il-btn-outline il-btn-sm il-stateful gap-1.5 disabled:pointer-events-none disabled:opacity-40'
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className='size-4' aria-hidden='true' />
              {t('Previous page')}
            </button>
            <button
              type='button'
              className='il-btn-outline il-btn-sm il-stateful gap-1.5 disabled:pointer-events-none disabled:opacity-40'
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={currentPage >= totalPages}
            >
              {t('Next page')}
              <ChevronRight className='size-4' aria-hidden='true' />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
