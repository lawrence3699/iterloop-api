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
import { BadgeDollarSign, Check, Route, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ROUTING_STRATEGIES = [
  {
    id: 'curated',
    title: 'Curated Routing',
    description:
      'IterLoop selects the verified production route for consistent model behavior and support.',
    icon: Route,
    bullets: [
      'Verified production channel',
      'Model integrity first',
      'Automatic health checks',
    ],
    selected: true,
  },
  {
    id: 'budget',
    title: 'Budget Routing',
    description:
      'Prioritize the lowest available cost across equivalent provider routes.',
    icon: BadgeDollarSign,
    bullets: [
      'Lowest available rate',
      'Equivalent model routes',
      'Configurable budget ceiling',
    ],
    selected: false,
  },
  {
    id: 'custom',
    title: 'Custom Discount',
    description:
      'Apply a negotiated routing policy for committed team workloads.',
    icon: SlidersHorizontal,
    bullets: [
      'Team-specific rates',
      'Committed usage policy',
      'Dedicated routing rules',
    ],
    selected: false,
  },
]

export function RoutingPanel() {
  const { t } = useTranslation()

  return (
    <div className='iterloop-routing-panel'>
      <div className='iterloop-routing-intro'>
        <span>{t('Read-only in this release')}</span>
        <h2>{t('Choose how requests reach a model')}</h2>
        <p>
          {t(
            'Routing is visible for transparency. The current production environment has one enabled channel, so Curated Routing is locked on.'
          )}
        </p>
      </div>

      <div className='iterloop-routing-cards'>
        {ROUTING_STRATEGIES.map((strategy) => (
          <article
            key={strategy.id}
            className={strategy.selected ? 'is-selected' : 'is-disabled'}
            aria-disabled={!strategy.selected}
          >
            <header>
              <span>
                <strategy.icon aria-hidden='true' />
              </span>
              <div>
                <h3>{t(strategy.title)}</h3>
                <p>{t(strategy.description)}</p>
              </div>
              <i>{strategy.selected ? t('Selected') : t('Unavailable')}</i>
            </header>
            <ul>
              {strategy.bullets.map((bullet) => (
                <li key={bullet}>
                  <Check aria-hidden='true' />
                  {t(bullet)}
                </li>
              ))}
            </ul>
            <button type='button' disabled aria-pressed={strategy.selected}>
              {strategy.selected
                ? t('Current strategy')
                : t('Not available with one channel')}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
