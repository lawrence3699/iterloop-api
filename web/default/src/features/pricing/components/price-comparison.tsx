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
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { formatOfficialPrice, formatPrice } from '../lib/price'
import type { PriceType, PricingModel, TokenUnit } from '../types'

export interface PriceComparisonProps {
  model: PricingModel
  type: PriceType
  label: string
  tokenUnit: TokenUnit
  showRechargePrice?: boolean
  priceRate?: number
  usdExchangeRate?: number
  selectedGroup?: string
  className?: string
}

export function PriceComparison(props: PriceComparisonProps) {
  const { t } = useTranslation()
  const officialPrice = formatOfficialPrice(
    props.model,
    props.type,
    props.tokenUnit
  )
  const iterLoopPrice = formatPrice(
    props.model,
    props.type,
    props.tokenUnit,
    props.showRechargePrice ?? false,
    props.priceRate ?? 1,
    props.usdExchangeRate ?? 1,
    props.selectedGroup
  )

  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-brand-cell-line)] bg-[var(--color-brand-cell)] p-3',
        props.className
      )}
    >
      <div className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
        {t(props.label)}
      </div>
      <div className='space-y-1.5'>
        <div className='flex items-baseline justify-between gap-2'>
          <span className='text-[11px] text-[var(--text-tertiary)]'>
            {t('Official price')}
          </span>
          <span className='font-mono text-sm font-semibold text-[var(--text-secondary)] tabular-nums line-through decoration-[var(--text-tertiary)] decoration-1'>
            {officialPrice}
          </span>
        </div>
        <div
          className='text-muted-foreground/50 flex items-center gap-2'
          aria-hidden='true'
        >
          <span className='bg-border h-px flex-1' />
          <span className='font-mono text-[10px]'>/</span>
          <span className='bg-border h-px flex-1' />
        </div>
        <div className='flex items-baseline justify-between gap-2'>
          <span className='text-[11px] font-semibold text-[var(--color-brand-accent-muted)]'>
            {t('IterLoop price')}
          </span>
          <span className='font-mono text-sm font-bold text-[var(--color-brand-accent)] tabular-nums'>
            {iterLoopPrice}
          </span>
        </div>
      </div>
    </div>
  )
}
