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
import { Coins, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { sideDrawerContentClassName } from '@/components/drawer-layout'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getLobeIcon } from '@/lib/lobe-icon'

import { isTokenBasedModel } from '../lib/model-helpers'
import { formatRequestPrice } from '../lib/price'
import type { PriceType } from '../types'
import type { ModelDetailsDrawerProps } from './model-details'
import { PriceComparison } from './price-comparison'

const PRICE_FIELDS: { label: string; type: PriceType }[] = [
  { label: 'Input', type: 'input' },
  { label: 'Output', type: 'output' },
  { label: 'Cached input', type: 'cache' },
  { label: 'Cache write', type: 'create_cache' },
]

function SectionHeading(props: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  const Icon = props.icon

  return (
    <div className='mb-4 flex items-start gap-3'>
      <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm'>
        <Icon className='size-4.5' />
      </span>
      <div>
        <h2 className='text-base font-semibold'>{props.title}</h2>
        <p className='text-muted-foreground text-sm'>{props.description}</p>
      </div>
    </div>
  )
}

export function ModelCatalogDrawer(props: ModelDetailsDrawerProps) {
  const { t } = useTranslation()
  const modelIconKey = props.model.icon || props.model.vendor_icon
  const modelIcon = modelIconKey ? getLobeIcon(modelIconKey, 30) : null
  const tokenUnitLabel = props.tokenUnit === 'K' ? '1K' : '1M'
  const isTokenBased = isTokenBasedModel(props.model)
  const availablePriceFields = PRICE_FIELDS.filter((field) => {
    if (field.type === 'cache') return props.model.cache_ratio != null
    if (field.type === 'create_cache') {
      return props.model.create_cache_ratio != null
    }
    return true
  })

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent
        side='right'
        className={sideDrawerContentClassName('sm:max-w-xl lg:max-w-2xl')}
      >
        <SheetHeader className='sr-only'>
          <SheetTitle>{props.model.model_name}</SheetTitle>
          <SheetDescription>{t('Model details')}</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-5 pt-12 pb-8 sm:px-7'>
          <header className='flex items-center gap-3 border-b pb-5'>
            <span className='bg-muted flex size-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm'>
              {modelIcon || props.model.model_name.charAt(0).toUpperCase()}
            </span>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <h1 className='truncate text-xl font-semibold tracking-tight sm:text-2xl'>
                  {props.model.model_name}
                </h1>
                <CopyButton
                  value={props.model.model_name}
                  className='size-7'
                  iconClassName='size-3.5'
                  tooltip={t('Copy model name')}
                  successTooltip={t('Copied!')}
                  aria-label={t('Copy model name')}
                />
              </div>
              {props.model.vendor_name && (
                <p className='text-muted-foreground mt-1 text-sm'>
                  {props.model.vendor_name}
                </p>
              )}
            </div>
          </header>

          <section className='border-b py-6'>
            <SectionHeading
              icon={Info}
              title={t('Basic Information')}
              description={t('Model details')}
            />
            <p className='text-muted-foreground text-sm leading-6'>
              {props.model.description || t('No description available.')}
            </p>
          </section>

          <section className='py-6'>
            <SectionHeading
              icon={Coins}
              title={t('Pricing')}
              description={`${tokenUnitLabel} tokens · ${props.model.pricing_currency?.code || ''}`}
            />
            {isTokenBased ? (
              <div className='grid gap-3 sm:grid-cols-2'>
                {availablePriceFields.map((field) => (
                  <PriceComparison
                    key={field.type}
                    model={props.model}
                    type={field.type}
                    label={field.label}
                    tokenUnit={props.tokenUnit}
                    showRechargePrice={props.showRechargePrice ?? false}
                    priceRate={props.priceRate}
                    usdExchangeRate={props.usdExchangeRate}
                  />
                ))}
              </div>
            ) : (
              <div className='bg-muted/20 rounded-xl border p-4 font-mono text-lg font-semibold'>
                {formatRequestPrice(
                  props.model,
                  props.showRechargePrice ?? false,
                  props.priceRate,
                  props.usdExchangeRate
                )}{' '}
                / {t('request')}
              </div>
            )}
            {props.model.official_price?.source_url && (
              <a
                href={props.model.official_price.source_url}
                target='_blank'
                rel='noreferrer'
                className='text-muted-foreground hover:text-foreground mt-4 inline-flex text-xs underline underline-offset-4'
              >
                {t('Official')} · {props.model.official_price.source_model}
              </a>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
