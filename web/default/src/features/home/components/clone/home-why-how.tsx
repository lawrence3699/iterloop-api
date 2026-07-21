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
import { Route, ShieldCheck, TrendingDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const WHY_CARDS = [
  {
    title: 'Model Integrity',
    description:
      'Get exactly the model you request. Every request is routed to the model and protocol you select through vetted upstream providers, never silently swapped or downgraded.',
    delay: '160ms',
  },
  {
    title: 'Data Privacy',
    description:
      'Prompts and completions are processed only for routing, metering, billing, abuse prevention, and support. Logs are never used to train models or sold as usage data.',
    delay: '240ms',
  },
  {
    title: 'Spend Tracking',
    description:
      'Billing details show every request, including model, token usage, applied discount, and final charge. Teams can see exactly where credits are spent instead of guessing from aggregate spend.',
    delay: '320ms',
  },
]

const HOW_CARDS = [
  {
    icon: TrendingDown,
    number: '01',
    title: 'Buy at scale',
    description:
      'We secure enterprise-scale volume commitments with vetted model providers. That is where the discount comes from.',
  },
  {
    icon: ShieldCheck,
    number: '02',
    title: 'Verify every route',
    description:
      'Every route is tested for protocol compatibility, cache hit rate, and provenance before it goes live.',
  },
  {
    icon: Route,
    number: '03',
    title: 'Route every request',
    description:
      'Live routing monitors latency, concurrency, cache hit rate, and provider availability to choose the best route at request time.',
  },
]

const HOW_STATS = [
  { value: '>99%', translate: false, label: 'Cache hit rate' },
  { value: '99.6%', translate: false, label: 'SLA' },
  { value: 'On par', translate: true, label: 'TTFT vs official' },
  { value: 'Hours', translate: true, label: 'To new-model support' },
]

export function HomeWhySection() {
  const { t } = useTranslation()

  return (
    <section
      className='hc-why motion-item'
      style={{ '--stagger-delay': '120ms' } as React.CSSProperties}
    >
      <h2 className='hc-why-title'>{t('Why Developers Choose IterLoop')}</h2>
      <div className='hc-3col'>
        {WHY_CARDS.map((card) => (
          <div
            key={card.title}
            className='il-card hc-why-card motion-item'
            style={{ '--stagger-delay': card.delay } as React.CSSProperties}
          >
            <h3 className='hc-why-card-title'>{t(card.title)}</h3>
            <p className='hc-why-card-desc'>{t(card.description)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function HomeHowSection() {
  const { t } = useTranslation()

  return (
    <section
      className='hc-how motion-item'
      style={{ '--stagger-delay': '180ms' } as React.CSSProperties}
    >
      <div>
        <h2 className='hc-section-heading'>
          {t('How does IterLoop offer these prices?')}
        </h2>
        <p className='hc-section-sub'>
          {t("One account, one bill. We vet providers, so you don't have to.")}
        </p>
      </div>
      <div className='hc-3col'>
        {HOW_CARDS.map((card) => (
          <div key={card.title} className='il-card hc-how-card'>
            <div className='hc-how-card-head'>
              <span className='hc-how-icon'>
                <card.icon aria-hidden='true' strokeWidth={1.6} />
              </span>
              <span className='hc-how-num'>{card.number}</span>
            </div>
            <h3 className='hc-how-card-title'>{t(card.title)}</h3>
            <p className='hc-how-card-desc'>{t(card.description)}</p>
          </div>
        ))}
      </div>
      <dl className='hc-stats'>
        {HOW_STATS.map((stat) => (
          <div key={stat.label} className='hc-stat-cell'>
            <dt className='hc-stat-value'>
              {stat.translate ? t(stat.value) : stat.value}
            </dt>
            <dd className='hc-stat-label'>{t(stat.label)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
