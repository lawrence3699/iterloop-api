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
import { ChevronRight, Copy } from 'lucide-react'
import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import { DEFAULT_TOKEN_UNIT } from '../constants'
import {
  getDynamicDisplayGroupRatio,
  getDynamicPricingSummary,
} from '../lib/dynamic-price'
import { isTokenBasedModel } from '../lib/model-helpers'
import { formatRequestPrice } from '../lib/price'
import type { PricingModel, TokenUnit } from '../types'
import { PriceComparison } from './price-comparison'

export interface ModelCardProps {
  model: PricingModel
  onClick: () => void
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
  selectedGroup?: string
}

export const ModelCard = memo(function ModelCard(props: ModelCardProps) {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()
  const tokenUnit = props.tokenUnit ?? DEFAULT_TOKEN_UNIT
  const priceRate = props.priceRate ?? 1
  const usdExchangeRate = props.usdExchangeRate ?? 1
  const showRechargePrice = props.showRechargePrice ?? false
  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = tokenUnit === 'K' ? '1K' : '1M'
  const modelIconKey = props.model.icon || props.model.vendor_icon
  const modelIcon = modelIconKey ? getLobeIcon(modelIconKey, 28) : null
  const initial = props.model.model_name?.charAt(0).toUpperCase() || '?'
  const isDynamicPricing =
    props.model.billing_mode === 'tiered_expr' &&
    Boolean(props.model.billing_expr)
  const dynamicSummary = isDynamicPricing
    ? getDynamicPricingSummary(props.model, {
        tokenUnit,
        showRechargePrice,
        priceRate,
        usdExchangeRate,
        groupRatioMultiplier: getDynamicDisplayGroupRatio(
          props.model,
          props.selectedGroup
        ),
      })
    : null

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    copyToClipboard(props.model.model_name || '')
  }

  let priceSummary: ReactNode
  if (dynamicSummary) {
    if (dynamicSummary.isSpecialExpression) {
      priceSummary = (
        <span className='min-w-0'>
          <span className='text-amber-700 dark:text-amber-300'>
            {t('Special billing expression')}
          </span>
          <code className='text-muted-foreground/70 mt-0.5 line-clamp-1 block font-mono text-[11px] break-all'>
            {dynamicSummary.rawExpression}
          </code>
        </span>
      )
    } else if (dynamicSummary.primaryEntries.length > 0) {
      priceSummary = (
        <>
          {dynamicSummary.primaryEntries.map((entry) => (
            <span
              key={entry.key}
              className='text-muted-foreground whitespace-nowrap'
            >
              {t(entry.shortLabel)}{' '}
              <span className='text-foreground font-mono font-semibold'>
                {entry.formatted}
              </span>
            </span>
          ))}
        </>
      )
    } else {
      priceSummary = (
        <span className='text-muted-foreground text-sm'>
          {t('Dynamic Pricing')}
        </span>
      )
    }
  } else if (isTokenBased) {
    priceSummary = (
      <div className='grid grid-cols-2 gap-2'>
        <PriceComparison
          model={props.model}
          type='input'
          label='Input'
          tokenUnit={tokenUnit}
          showRechargePrice={showRechargePrice}
          priceRate={priceRate}
          usdExchangeRate={usdExchangeRate}
          selectedGroup={props.selectedGroup}
        />
        <PriceComparison
          model={props.model}
          type='output'
          label='Output'
          tokenUnit={tokenUnit}
          showRechargePrice={showRechargePrice}
          priceRate={priceRate}
          usdExchangeRate={usdExchangeRate}
          selectedGroup={props.selectedGroup}
        />
      </div>
    )
  } else {
    priceSummary = (
      <span className='text-muted-foreground whitespace-nowrap'>
        <span className='text-foreground font-mono font-semibold'>
          {formatRequestPrice(
            props.model,
            showRechargePrice,
            priceRate,
            usdExchangeRate,
            props.selectedGroup
          )}
        </span>{' '}
        / {t('request')}
      </span>
    )
  }

  return (
    <article
      className={cn(
        'group relative flex min-h-[280px] cursor-pointer flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all',
        'hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md'
      )}
    >
      <button
        type='button'
        onClick={props.onClick}
        className='focus-visible:ring-primary/30 absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:outline-none'
        aria-label={`${t('Details')}: ${props.model.model_name}`}
      />

      <div className='pointer-events-none relative z-10 flex items-start justify-between gap-3'>
        <div className='flex min-w-0 items-start gap-3'>
          <div className='bg-muted/40 flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-sm'>
            {modelIcon || (
              <span className='text-muted-foreground text-sm font-bold'>
                {initial}
              </span>
            )}
          </div>
          <div className='min-w-0 pt-1'>
            <h3 className='text-foreground truncate text-lg leading-tight font-semibold tracking-tight'>
              {props.model.model_name}
            </h3>
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-1'>
          <button
            type='button'
            onClick={handleCopy}
            className='text-muted-foreground hover:text-foreground hover:bg-muted pointer-events-auto rounded-lg border p-2 transition-colors'
            title={t('Copy')}
          >
            <Copy className='size-3.5' />
          </button>
          <ChevronRight className='text-muted-foreground/50 size-4 transition-transform group-hover:translate-x-0.5' />
        </div>
      </div>

      <div className='pointer-events-none relative z-10 mt-4 text-sm'>
        {priceSummary}
      </div>

      <div className='pointer-events-none relative z-10 mt-auto flex flex-wrap items-center gap-2 pt-5'>
        {props.model.vendor_name && (
          <span className='bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium'>
            {modelIconKey ? getLobeIcon(modelIconKey, 13) : null}
            {props.model.vendor_name}
          </span>
        )}
        <span className='rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'>
          {t('Pay as you go')}
        </span>
        <span className='text-muted-foreground/60 ml-auto text-xs'>
          {tokenUnitLabel}
        </span>
      </div>
    </article>
  )
})
