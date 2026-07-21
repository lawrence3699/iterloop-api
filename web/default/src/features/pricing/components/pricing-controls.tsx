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
import { ArrowUpDown, Check, LayoutGrid, Table2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import {
  getSortLabels,
  VIEW_MODES,
  type SortOption,
  type ViewMode,
} from '../constants'
import type { TokenUnit } from '../types'

export interface PricingControlsProps {
  sortBy: string
  onSortChange: (value: string) => void
  tokenUnit: TokenUnit
  onTokenUnitChange: (value: TokenUnit) => void
  showRechargePrice: boolean
  onRechargePriceChange: (value: boolean) => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  filteredCount: number
  totalCount: number
}

function TogglePill(props: {
  options: { value: string; label: React.ReactNode; ariaLabel?: string }[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
}) {
  return (
    <div
      role='group'
      aria-label={props.ariaLabel}
      className='inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-1'
    >
      {props.options.map((option) => (
        <button
          key={option.value}
          type='button'
          onClick={() => props.onChange(option.value)}
          aria-pressed={option.value === props.value}
          aria-label={option.ariaLabel}
          className={cn(
            'il-stateful inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap',
            option.value === props.value
              ? 'border border-[var(--color-brand-solid)] bg-[var(--bg-selected)] text-[var(--text-primary)]'
              : 'border border-transparent text-[var(--text-secondary)]'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Compact control strip under the vendor chips: model count, price mode,
 * token unit, sort dropdown and card/table view toggle — all rendered with
 * the clone chip/outline styling.
 */
export function PricingControls(props: PricingControlsProps) {
  const { t } = useTranslation()
  const sortLabels = getSortLabels(t)

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <p className='mr-auto text-sm text-[var(--text-secondary)]'>
        <span className='font-semibold text-[var(--text-primary)] tabular-nums'>
          {props.filteredCount.toLocaleString()}
        </span>{' '}
        / {props.totalCount.toLocaleString()} {t('models')}
      </p>

      <TogglePill
        ariaLabel={t('Price display mode')}
        options={[
          { value: 'standard', label: t('Standard') },
          { value: 'recharge', label: t('Recharge') },
        ]}
        value={props.showRechargePrice ? 'recharge' : 'standard'}
        onChange={(value) => props.onRechargePriceChange(value === 'recharge')}
      />

      <TogglePill
        ariaLabel={t('Token unit')}
        options={[
          { value: 'M', label: '/1M' },
          { value: 'K', label: '/1K' },
        ]}
        value={props.tokenUnit}
        onChange={(value) => props.onTokenUnitChange(value as TokenUnit)}
      />

      <TogglePill
        ariaLabel={t('View mode')}
        options={[
          {
            value: VIEW_MODES.TABLE,
            label: <Table2 className='size-3.5' aria-hidden='true' />,
            ariaLabel: t('Table view'),
          },
          {
            value: VIEW_MODES.CARD,
            label: <LayoutGrid className='size-3.5' aria-hidden='true' />,
            ariaLabel: t('Card view'),
          },
        ]}
        value={props.viewMode}
        onChange={(value) => props.onViewModeChange(value as ViewMode)}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type='button'
              className='il-chip il-stateful gap-1.5 text-xs font-medium'
            />
          }
        >
          <ArrowUpDown className='size-3.5' aria-hidden='true' />
          <span>{sortLabels[props.sortBy as SortOption] || t('Sort')}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-44'>
          {Object.entries(sortLabels).map(([value, label]) => (
            <DropdownMenuItem
              key={value}
              onClick={() => props.onSortChange(value)}
              className='gap-2'
            >
              <Check
                className={cn(
                  'size-4 shrink-0',
                  props.sortBy === value ? 'opacity-100' : 'opacity-0'
                )}
              />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
