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
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { usePricingData } from '@/features/pricing/hooks/use-pricing-data'
import { formatPrice } from '@/features/pricing/lib/price'

const PRODUCTION_MODELS = new Set([
  'codex-auto-review',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.5',
  'gpt-5.6-luna',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'claude-fable-5',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-5-20251101',
  'claude-opus-4-6',
  'claude-opus-4-7',
  'claude-opus-4-8',
  'claude-sonnet-4-5-20250929',
  'claude-sonnet-4-6',
  'claude-sonnet-5',
])

export function LivePricingGrid() {
  const { t } = useTranslation()
  const pricing = usePricingData()
  const models = useMemo(
    () =>
      pricing.models.filter((model) => PRODUCTION_MODELS.has(model.model_name)),
    [pricing.models]
  )

  return (
    <section
      id='pricing'
      className='iterloop-download-section iterloop-live-pricing'
    >
      <div className='iterloop-download-section-heading'>
        <div>
          <span>{t('Live Pricing')}</span>
          <h2>{t('Production models, priced for your locale.')}</h2>
        </div>
        <p>
          {t(
            'Live data from the IterLoop pricing API. Chinese uses CNY; English uses AUD.'
          )}
        </p>
      </div>

      {pricing.isLoading ? (
        <div className='iterloop-live-pricing-loading'>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className='h-36' />
          ))}
        </div>
      ) : (
        <div
          className='iterloop-live-pricing-grid'
          role='region'
          aria-label={t('Production model pricing')}
        >
          {models.map((model) => (
            <article key={model.model_name}>
              <header>
                <span>
                  {model.model_name.startsWith('claude-')
                    ? 'Anthropic'
                    : 'OpenAI'}
                </span>
                <i />
              </header>
              <h3>{model.model_name}</h3>
              <div>
                <p>
                  <span>{t('Input')}</span>
                  <strong>{formatPrice(model, 'input', 'M')}</strong>
                </p>
                <p>
                  <span>{t('Output')}</span>
                  <strong>{formatPrice(model, 'output', 'M')}</strong>
                </p>
              </div>
              <small>{t('per 1M tokens')}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
