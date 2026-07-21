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
import { TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  LEADERBOARD_ROWS,
  TREND_AREAS,
  TREND_LEGEND,
  TREND_X_LABELS,
  TREND_Y_LABELS,
} from './clone-data'

function TrendChart() {
  return (
    <div className='hc-trend' aria-hidden='true'>
      <div className='hc-trend-ylabels'>
        {TREND_Y_LABELS.map((label, index) => (
          <span
            key={label}
            className='hc-trend-ylabel'
            style={{
              top: `${100 - (index / (TREND_Y_LABELS.length - 1)) * 100}%`,
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <div className='hc-trend-plot'>
        <svg viewBox='51 5 1104 300' preserveAspectRatio='none'>
          {[305, 230, 155, 80, 5].map((y) => (
            <line
              key={y}
              x1='51'
              x2='1155'
              y1={y}
              y2={y}
              stroke='var(--il-chart-grid)'
              strokeDasharray='3 3'
              vectorEffect='non-scaling-stroke'
            />
          ))}
          {TREND_AREAS.map((area) => (
            <path
              key={area.color}
              d={area.area}
              fill={area.color}
              fillOpacity='0.8'
            />
          ))}
        </svg>
      </div>
      <div className='hc-trend-xlabels'>
        {TREND_X_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  )
}

export function HomeLeaderboard() {
  const { t } = useTranslation()

  return (
    <section
      id='leaderboard'
      className='hc-leader motion-item'
      style={
        {
          '--stagger-delay': '280ms',
          marginTop: '16px',
        } as React.CSSProperties
      }
    >
      <div className='hc-leader-stack'>
        <div className='il-card hc-leader-card'>
          <div className='hc-leader-head'>
            <h3 className='hc-leader-title'>{t('Usage Leaderboard')}</h3>
            <span className='hc-leader-note'>
              {t('Refreshes daily at midnight')}
            </span>
          </div>
          <div className='hc-table-scroll'>
            <table className='hc-leader-table'>
              <thead>
                <tr>
                  <th>{t('Rank')}</th>
                  <th>{t('Model')}</th>
                  <th>{t('Total Tokens Routed')}</th>
                  <th>{t('Trend')}</th>
                  <th>{t('TTFT')}</th>
                  <th>{t('Success Rate')}</th>
                </tr>
              </thead>
              <tbody>
                {LEADERBOARD_ROWS.map((row) => (
                  <tr key={row.rank}>
                    <td>#{row.rank}</td>
                    <td>
                      <span className='hc-leader-model'>
                        <span
                          className='hc-leader-dot'
                          style={{ backgroundColor: row.dot }}
                          aria-hidden='true'
                        />
                        {row.model}
                      </span>
                    </td>
                    <td>{row.tokens}</td>
                    <td>
                      <span className='hc-trend-up'>
                        <TrendingUp aria-hidden='true' />
                        {row.trend}
                      </span>
                    </td>
                    <td>{row.ttft}</td>
                    <td>{row.success}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className='hc-table-fade' aria-hidden='true' />
          </div>
        </div>

        <div className='il-card hc-leader-card'>
          <div className='hc-leader-head hc-leader-head-stack'>
            <div>
              <h3 className='hc-leader-title'>{t('Model Usage Trends')}</h3>
              <p className='hc-section-sub'>
                {t(
                  'Weekly routed token volume for models connected to IterLoop (in B tokens)'
                )}
              </p>
            </div>
          </div>
          <TrendChart />
          <div
            className='hc-trend-legend'
            role='group'
            aria-label={t('Legend')}
          >
            {TREND_LEGEND.map((item) => (
              <span key={item.label} className='hc-trend-legend-item'>
                <span
                  className='hc-trend-legend-swatch'
                  style={{ backgroundColor: item.color }}
                  aria-hidden='true'
                />
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
