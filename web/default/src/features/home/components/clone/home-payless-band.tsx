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
import { HelpCircle } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import { iterLoopConsoleUrl } from '@/lib/iterloop-host'

export function HomePaylessBand(props: { staggerDelay: string }) {
  const { t } = useTranslation()

  return (
    <section
      className='hc-band motion-item'
      style={{ '--stagger-delay': props.staggerDelay } as React.CSSProperties}
    >
      <div className='hc-band-bg' aria-hidden='true' />
      <div className='hc-band-grid' aria-hidden='true' />
      <div className='hc-band-blob-red' aria-hidden='true' />
      <div className='hc-band-blob-orange' aria-hidden='true' />

      <div className='hc-band-inner'>
        <div className='hc-band-copy'>
          <div className='hc-band-badge'>{t('PAY-AS-YOU-GO')}</div>
          <h2 className='hc-band-title'>{t('Pay less for every token')}</h2>
          <p className='hc-band-desc'>
            <Trans
              i18nKey='Pay only for what you use. Model rates start at just <highlight>10%</highlight> of the official price — discounts applied automatically, per model.'
              components={{
                highlight: <span className='hc-band-ten' />,
              }}
            />
          </p>
        </div>

        <div className='hc-band-card'>
          <div className='hc-band-card-body'>
            <p className='hc-band-pill'>
              {t('⚡ Transparent pricing · No monthly fees · No subscriptions')}
            </p>
            <div className='hc-band-highlight'>
              <p className='hc-band-highlight-title'>
                {t('Up to 90% off official prices')}
                <span className='hc-band-tooltip-wrap'>
                  <HelpCircle aria-hidden='true' />
                  <span className='hc-band-tooltip'>
                    {t(
                      'Discounts vary by model and may change with upstream costs. See the live pricing table for current rates.'
                    )}
                  </span>
                </span>
              </p>
              <p className='hc-band-highlight-sub'>
                {t('Applied automatically by model.')}
              </p>
            </div>
            <p className='hc-band-note'>
              {t('Credits never expire · Buy credits anytime')}
            </p>
          </div>
          <div className='hc-band-actions'>
            <a
              href={iterLoopConsoleUrl('/console/topup')}
              className='il-btn-primary il-stateful hc-btn-md hc-btn-primary-flex'
            >
              {t('Buy credits')}
            </a>
            <a
              href='#install'
              className='il-btn-outline il-stateful hc-btn-md hc-btn-outline-flex'
            >
              {t('Quick setup')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
