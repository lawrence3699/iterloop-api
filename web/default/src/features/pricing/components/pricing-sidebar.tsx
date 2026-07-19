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
import { RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import { FILTER_ALL } from '../constants'
import type { PricingModel, PricingVendor } from '../types'

type FilterOption = {
  value: string
  label: string
  count?: number
  suffix?: string
  icon?: ReactNode
}

export interface PricingSidebarProps {
  vendorFilter: string
  onVendorChange: (value: string) => void
  vendors: PricingVendor[]
  models: PricingModel[]
  hasActiveFilters: boolean
  onClearFilters: () => void
  className?: string
}

function countBy(
  models: PricingModel[],
  predicate: (model: PricingModel) => boolean
): number {
  return models.reduce((count, model) => count + (predicate(model) ? 1 : 0), 0)
}

function FilterChip(props: {
  option: FilterOption
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={props.onClick}
      className={cn(
        'group flex min-h-10 w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all',
        props.active
          ? 'border-primary/25 bg-primary/8 text-foreground shadow-sm'
          : 'border-border/70 bg-background text-muted-foreground hover:border-primary/20 hover:bg-muted/40 hover:text-foreground'
      )}
      title={props.option.label}
    >
      {props.option.icon && (
        <span className='shrink-0'>{props.option.icon}</span>
      )}
      <span className='min-w-0 flex-1 truncate text-left'>
        {props.option.label}
      </span>
      {(props.option.suffix || props.option.count != null) && (
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs tabular-nums',
            props.active
              ? 'bg-background/80 text-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {props.option.suffix ?? props.option.count}
        </span>
      )}
    </button>
  )
}

export function PricingSidebar(props: PricingSidebarProps) {
  const { t } = useTranslation()

  const vendorOptions: FilterOption[] = [
    {
      value: FILTER_ALL,
      label: t('All Vendors'),
      count: props.models.length,
    },
    ...props.vendors
      .map((vendor) => ({
        value: vendor.name,
        label: vendor.name,
        count: countBy(
          props.models,
          (model) => model.vendor_name === vendor.name
        ),
        icon: vendor.icon ? getLobeIcon(vendor.icon, 14) : undefined,
      }))
      .filter((vendor) => vendor.count > 0),
  ]

  return (
    <aside className={cn('rounded-2xl border p-4', props.className)}>
      <div className='flex items-center justify-between gap-2'>
        <div>
          <h2 className='text-foreground text-base font-semibold'>
            {t('Filter')}
          </h2>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={props.onClearFilters}
          disabled={!props.hasActiveFilters}
          className='h-8 gap-1.5 px-2 text-xs'
        >
          <RotateCcw className='size-3.5' />
          {t('Reset')}
        </Button>
      </div>

      <div className='border-border/70 mt-5 border-t pt-5'>
        <h3 className='text-foreground mb-3 text-sm font-semibold'>
          {t('Provider')}
        </h3>
        <div className='space-y-2'>
          {vendorOptions.map((option) => (
            <FilterChip
              key={option.value}
              option={option}
              active={props.vendorFilter === option.value}
              onClick={() => props.onVendorChange(option.value)}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}
