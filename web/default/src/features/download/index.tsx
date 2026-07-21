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
import { ArrowRight, Download as DownloadIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Skeleton } from '@/components/ui/skeleton'
import { usePricingData } from '@/features/pricing/hooks/use-pricing-data'
import { getDisplayGroupRatio } from '@/features/pricing/lib/model-helpers'
import { formatOfficialPrice, formatPrice } from '@/features/pricing/lib/price'
import type { PricingModel } from '@/features/pricing/types'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { iterLoopPublicUrl } from '@/lib/iterloop-host'

import './download.css'

const TEASER_MODELS = [
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'gpt-5.6-luna',
  'claude-opus-4-8',
  'claude-sonnet-5',
  'claude-haiku-4-5-20251001',
  'gpt-5.5',
  'gpt-5.4',
] as const

function AppleGlyph() {
  return (
    <svg
      width='26'
      height='26'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.51 4.09l-.02-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z' />
    </svg>
  )
}

function WindowsGlyph() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M0 3.449 9.75 2.1v9.451H0V3.449ZM10.949 1.949 24 0v11.4H10.949V1.949ZM0 12.6h9.75v9.351L0 20.699V12.6ZM10.949 12.6H24V24l-13.051-1.95V12.6Z' />
    </svg>
  )
}

function providerName(model: PricingModel): string {
  if (model.vendor_name) return model.vendor_name
  return model.model_name.startsWith('claude-') ? 'Anthropic' : 'OpenAI'
}

function providerBadgeClass(provider: string): string {
  if (provider === 'OpenAI') return 'il-download-provider-badge is-openai'
  if (provider === 'Anthropic') return 'il-download-provider-badge is-anthropic'
  if (provider === 'GLM' || provider === 'Zhipu') {
    return 'il-download-provider-badge is-glm'
  }
  return 'il-download-provider-badge'
}

function formatContextLength(model: PricingModel): string {
  const length = model.context_length
  if (!length) return '-'
  if (length >= 1_000_000) return `${Math.round(length / 1_000_000)}M`
  if (length >= 1000) return `${Math.round(length / 1000)}K`
  return String(length)
}

function discountPercent(model: PricingModel): number | null {
  const officialInput = model.official_price?.input_usd
  if (!officialInput || officialInput <= 0) return null
  const iterLoopInput = model.model_ratio * 2 * getDisplayGroupRatio(model)
  const percent = Math.round((1 - iterLoopInput / officialInput) * 100)
  return percent >= 1 ? percent : null
}

function PriceCell(props: {
  model: PricingModel
  type: 'input' | 'output'
  variant: 'list' | 'iterloop'
}) {
  const { t } = useTranslation()
  const isList = props.variant === 'list'
  const price = isList
    ? formatOfficialPrice(props.model, props.type, 'M')
    : formatPrice(props.model, props.type, 'M')
  const cache = isList
    ? formatOfficialPrice(props.model, 'cache', 'M')
    : formatPrice(props.model, 'cache', 'M')
  const percent = isList ? null : discountPercent(props.model)

  return (
    <span className='il-download-price-stack'>
      {isList ? (
        <span className='il-download-price-list'>{price}</span>
      ) : (
        <span className='il-download-price-final'>
          {price}
          {percent !== null && (
            <span className='il-download-discount'>
              {t('{{percent}}% off', { percent })}
            </span>
          )}
        </span>
      )}
      {props.type === 'input' && cache !== '-' && (
        <span className='il-download-price-cache'>
          {t('Cache: {{price}}', { price: cache })}
        </span>
      )}
    </span>
  )
}

function LivePricingTeaser() {
  const { t } = useTranslation()
  const pricing = usePricingData()

  const models = useMemo(() => {
    const byName = new Map(
      pricing.models.map((model) => [model.model_name, model])
    )
    const picked: PricingModel[] = []
    for (const name of TEASER_MODELS) {
      const model = byName.get(name)
      if (model) picked.push(model)
    }
    return picked
  }, [pricing.models])

  return (
    <div className='il-download-pricing'>
      <div className='il-download-pricing-inner'>
        <section
          id='home-pricing-models'
          className='motion-item scroll-mt-24'
          style={{ '--stagger-delay': '100ms' } as React.CSSProperties}
        >
          <div className='il-download-pricing-heading'>
            <h2>{t('Live pricing')}</h2>
            <p>
              {t(
                'Live prices — discounts may vary with upstream costs. Prices in USD / 1M Tokens.'
              )}
            </p>
          </div>

          {pricing.isLoading ? (
            <div className='il-download-pricing-loading'>
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          ) : (
            <div className='il-download-table-wrap'>
              <table className='il-table'>
                <thead>
                  <tr>
                    <th>{t('Model')}</th>
                    <th>{t('Provider')}</th>
                    <th>{t('Context')}</th>
                    <th>{t('Input (List)')}</th>
                    <th>{t('Output (List)')}</th>
                    <th className='il-table-highlight'>
                      {t('Input (IterLoop)')}
                    </th>
                    <th className='il-table-highlight'>
                      {t('Output (IterLoop)')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => {
                    const provider = providerName(model)
                    return (
                      <tr key={model.model_name}>
                        <td>
                          <span className='il-download-model-name'>
                            {model.model_name}
                          </span>
                        </td>
                        <td>
                          <span className={providerBadgeClass(provider)}>
                            {provider}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {formatContextLength(model)}
                        </td>
                        <td>
                          <PriceCell
                            model={model}
                            type='input'
                            variant='list'
                          />
                        </td>
                        <td>
                          <PriceCell
                            model={model}
                            type='output'
                            variant='list'
                          />
                        </td>
                        <td className='il-table-highlight'>
                          <PriceCell
                            model={model}
                            type='input'
                            variant='iterloop'
                          />
                        </td>
                        <td className='il-table-highlight'>
                          <PriceCell
                            model={model}
                            type='output'
                            variant='iterloop'
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className='il-download-pricing-footer'>
            <a
              href={iterLoopPublicUrl('/pricing')}
              className='il-download-pricing-link'
            >
              {t('View full pricing')}
              <ArrowRight aria-hidden='true' className='h-4 w-4' />
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}

export function DownloadPage() {
  const { t } = useTranslation()
  useScrollReveal()

  return (
    <PublicLayout showMainContainer={false}>
      <main className='pt-[76px] max-[640px]:pt-[60px]'>
        <div className='animate-page-enter'>
          <section
            className='il-download-hero motion-item'
            style={{ '--stagger-delay': '0ms' } as React.CSSProperties}
          >
            <div className='il-download-hero-fade' aria-hidden='true' />
            <div className='il-download-hero-grid'>
              <div className='il-download-hero-copy'>
                <h1>{t('Download the IterLoop app')}</h1>
                <p>
                  {t("No subscription — try the world's agents in one click.")}
                </p>
                <div className='il-download-actions'>
                  <div className='il-download-buttons'>
                    <button
                      type='button'
                      className='il-download-btn il-download-btn-mac'
                      disabled
                    >
                      <AppleGlyph />
                      {t('Download for macOS')}
                      <DownloadIcon
                        aria-hidden='true'
                        className='h-4 w-4 shrink-0'
                      />
                      <span className='il-download-soon'>
                        {t('Coming soon')}
                      </span>
                    </button>
                    <button
                      type='button'
                      className='il-download-btn il-download-btn-win'
                      disabled
                    >
                      <WindowsGlyph />
                      {t('Download Windows')}
                      <DownloadIcon
                        aria-hidden='true'
                        className='h-4 w-4 shrink-0'
                      />
                      <span className='il-download-soon'>
                        {t('Coming soon')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <figure className='il-download-preview'>
                <img
                  src='/iterloop-desktop-preview.svg'
                  alt={t('IterLoop app interface')}
                  width='1400'
                  height='900'
                  loading='lazy'
                />
              </figure>
            </div>
          </section>

          <LivePricingTeaser />
        </div>
      </main>
    </PublicLayout>
  )
}
