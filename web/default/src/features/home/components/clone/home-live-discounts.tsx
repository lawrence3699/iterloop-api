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
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DISCOUNT_AVG_Y,
  DISCOUNT_CURVE_PATH,
  DISCOUNT_X_LABELS,
  DISCOUNT_Y_LABELS,
} from './clone-data'
import { OpenAIMark } from './clone-icons'

function DiscountSparkline() {
  return (
    <div className='hc-spark' aria-hidden='true'>
      <div className='hc-spark-ylabels'>
        {DISCOUNT_Y_LABELS.map((tick) => (
          <span
            key={tick.text + tick.y}
            className={
              tick.brand ? 'hc-spark-ylabel is-brand' : 'hc-spark-ylabel'
            }
            style={{ top: `${((tick.y - 8) / 126) * 100}%` }}
          >
            {tick.text}
          </span>
        ))}
      </div>
      <div className='hc-spark-plot'>
        <svg viewBox='72 8 1030 126' preserveAspectRatio='none'>
          <defs>
            <linearGradient id='hc-discount-fill' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#121212' stopOpacity='0.14' />
              <stop offset='100%' stopColor='#121212' stopOpacity='0' />
            </linearGradient>
          </defs>
          {[134, 89, 44, 8].map((y) => (
            <line
              key={y}
              x1='72'
              x2='1102'
              y1={y}
              y2={y}
              stroke='var(--il-chart-grid)'
              strokeDasharray='3 3'
              vectorEffect='non-scaling-stroke'
            />
          ))}
          <line
            x1='72'
            x2='1102'
            y1={DISCOUNT_AVG_Y}
            y2={DISCOUNT_AVG_Y}
            stroke='var(--color-brand-solid)'
            strokeDasharray='4 4'
            strokeOpacity='0.72'
            vectorEffect='non-scaling-stroke'
          />
          <path
            d={`${DISCOUNT_CURVE_PATH}L1102,134L72,134Z`}
            fill='url(#hc-discount-fill)'
            fillOpacity='0.6'
          />
          <path
            d={DISCOUNT_CURVE_PATH}
            fill='none'
            stroke='var(--il-chart-1)'
            strokeWidth='2.4'
            strokeLinecap='round'
            strokeLinejoin='round'
            vectorEffect='non-scaling-stroke'
          />
        </svg>
      </div>
      <div className='hc-spark-xlabels'>
        {DISCOUNT_X_LABELS.map((label) => (
          <span key={label.id}>{label.text}</span>
        ))}
      </div>
    </div>
  )
}

export function HomeLiveDiscounts() {
  const { t } = useTranslation()
  const [statMode, setStatMode] = useState<'avg' | 'min'>('avg')

  return (
    <section
      id='live-discounts'
      className='hc-discounts hc-card motion-item'
      style={{ '--stagger-delay': '100ms' } as React.CSSProperties}
    >
      <div className='hc-discounts-glow' aria-hidden='true' />
      <div className='hc-discounts-inner'>
        <div className='hc-discounts-head'>
          <div>
            <h2 className='hc-section-heading'>{t('Live discounts')}</h2>
            <p className='hc-section-sub'>
              {t('Hourly model discount curves, updated in real time.')}
            </p>
          </div>
          <div className='hc-model-select-wrap'>
            <span className='hc-model-select-label'>{t('Model')}</span>
            <button type='button' className='hc-model-select' aria-haspopup='listbox' aria-expanded={false}>
              <span className='hc-model-select-value'>
                <OpenAIMark size={16} />
                <span>GPT-5.6-Sol</span>
              </span>
              <ChevronDown className='hc-model-select-chevron' aria-hidden='true' />
            </button>
          </div>
        </div>

        <div className='hc-chart-card'>
          <div className='hc-chart-head'>
            <div>
              <h3 className='hc-chart-title'>
                <span className='hc-chart-title-model'>GPT-5.6-Sol</span>{' '}
                {t('discount trend')}
              </h3>
              <p className='hc-chart-sub'>
                {t('48 hours · hourly · dashed = Average')}
              </p>
            </div>
            <div className='hc-stat-chips'>
              <button
                type='button'
                className={
                  statMode === 'avg' ? 'hc-stat-chip is-on' : 'hc-stat-chip'
                }
                onClick={() => setStatMode('avg')}
              >
                <span className='hc-stat-chip-label'>{t('Avg')}</span>
                <span className='hc-stat-chip-value'>12%</span>
              </button>
              <button
                type='button'
                className={
                  statMode === 'min' ? 'hc-stat-chip is-on' : 'hc-stat-chip'
                }
                onClick={() => setStatMode('min')}
              >
                <span className='hc-stat-chip-label'>{t('Min')}</span>
                <span className='hc-stat-chip-value'>10%</span>
              </button>
            </div>
          </div>
          <DiscountSparkline />
        </div>
      </div>
    </section>
  )
}
