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
import { Coins, Info, Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { sideDrawerContentClassName } from '@/components/drawer-layout'
import { GroupBadge } from '@/components/group-badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getLobeIcon } from '@/lib/lobe-icon'

import { isTokenBasedModel } from '../lib/model-helpers'
import { formatFixedPrice, formatGroupPrice } from '../lib/price'
import type { PriceType } from '../types'
import type { ModelDetailsDrawerProps } from './model-details'

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
  const groups = (props.model.enable_groups || []).filter((group) =>
    Object.hasOwn(props.usableGroup, group)
  )

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

          <section className='border-b py-6'>
            <SectionHeading
              icon={Link2}
              title={t('API Endpoints')}
              description={t('API')}
            />
            <div className='space-y-2'>
              {(props.model.supported_endpoint_types || []).map((endpoint) => {
                const endpointInfo = props.endpointMap[endpoint]
                return (
                  <div
                    key={endpoint}
                    className='bg-muted/30 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm'
                  >
                    <span className='size-2 rounded-full bg-emerald-500' />
                    <span className='text-muted-foreground font-medium'>
                      {endpoint}
                    </span>
                    <code className='min-w-0 flex-1 truncate font-mono text-xs sm:text-sm'>
                      {endpointInfo?.path || '—'}
                    </code>
                    <span className='text-muted-foreground text-xs font-semibold'>
                      {endpointInfo?.method || 'POST'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className='py-6'>
            <SectionHeading
              icon={Coins}
              title={t('Pricing by Group')}
              description={t('Price display mode')}
            />
            <div className='overflow-hidden rounded-xl border'>
              {groups.map((group) => (
                <div
                  key={group}
                  className='border-b p-4 last:border-b-0 sm:grid sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4'
                >
                  <div className='mb-3 sm:mb-0'>
                    <GroupBadge group={group} size='sm' />
                  </div>
                  {isTokenBased ? (
                    <div className='grid gap-2 text-sm sm:grid-cols-2'>
                      {availablePriceFields.map((field) => (
                        <div
                          key={field.type}
                          className='flex justify-between gap-3'
                        >
                          <span className='text-muted-foreground'>
                            {t(field.label)}
                          </span>
                          <span className='font-mono font-semibold tabular-nums'>
                            {formatGroupPrice(
                              props.model,
                              group,
                              field.type,
                              props.tokenUnit,
                              props.showRechargePrice ?? false,
                              props.priceRate,
                              props.usdExchangeRate,
                              props.groupRatio
                            )}
                            <span className='text-muted-foreground ml-1 text-[10px] font-normal'>
                              / {tokenUnitLabel}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-sm font-semibold'>
                      {formatFixedPrice(
                        props.model,
                        group,
                        props.showRechargePrice ?? false,
                        props.priceRate,
                        props.usdExchangeRate,
                        props.groupRatio
                      )}{' '}
                      / {t('request')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
