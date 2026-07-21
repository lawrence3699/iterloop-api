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
import { BarChart3, CalendarDays, Database } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Skeleton } from '@/components/ui/skeleton'
import { formatCompactNumber, formatLogQuota } from '@/lib/format'

import { useConsoleAnalytics } from '../hooks/use-console-analytics'
import type { AnalyticsFilters, SelfAnalytics } from '../types'

type AnalyticsPanelProps = {
  kind: 'usage' | 'cost'
}

function AnalyticsFiltersBar(props: {
  filters: AnalyticsFilters
  onChange: (filters: AnalyticsFilters) => void
  apiKeys: { id: number; name: string }[]
  loading: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      className='iterloop-analytics-filters'
      aria-label={t('Analytics filters')}
    >
      <label>
        <span>{t('API Key')}</span>
        <select
          aria-label={t('Filter by API Key')}
          value={props.filters.tokenId}
          disabled={props.loading}
          onChange={(event) =>
            props.onChange({ ...props.filters, tokenId: event.target.value })
          }
        >
          <option value=''>{t('All API Keys')}</option>
          {props.apiKeys.map((key) => (
            <option key={key.id} value={key.id}>
              {key.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t('Start date')}</span>
        <input
          aria-label={t('Start date')}
          type='date'
          value={props.filters.startDate}
          max={props.filters.endDate}
          onChange={(event) =>
            props.onChange({ ...props.filters, startDate: event.target.value })
          }
        />
      </label>
      <label>
        <span>{t('End date')}</span>
        <input
          aria-label={t('End date')}
          type='date'
          value={props.filters.endDate}
          min={props.filters.startDate}
          onChange={(event) =>
            props.onChange({ ...props.filters, endDate: event.target.value })
          }
        />
      </label>
    </div>
  )
}

function AnalyticsCards(props: {
  data: SelfAnalytics
  kind: AnalyticsPanelProps['kind']
}) {
  const { t } = useTranslation()
  let cards: { label: string; value: string; detail: string }[]

  if (props.kind === 'cost') {
    const totalQuota = Math.max(props.data.totals.quota, 1)
    const leadingModel = props.data.models[0]
    const leadingShare = leadingModel
      ? `${Math.round((leadingModel.quota / totalQuota) * 100)}%`
      : '0%'
    cards = [
      {
        label: t('Total cost'),
        value: formatLogQuota(props.data.totals.quota),
        detail: t('{{count}} requests', {
          count: props.data.totals.requests,
        }),
      },
      {
        label: t('Leading model share'),
        value: leadingShare,
        detail: leadingModel?.model_name || t('No usage'),
      },
      {
        label: t('Average request cost'),
        value: formatLogQuota(
          props.data.totals.requests
            ? props.data.totals.quota / props.data.totals.requests
            : 0
        ),
        detail: t('Based on settled quota'),
      },
    ]
  } else {
    cards = [
      {
        label: t('Input tokens'),
        value: formatCompactNumber(props.data.totals.input_tokens),
        detail: t('{{count}} requests', {
          count: props.data.totals.requests,
        }),
      },
      {
        label: t('Output tokens'),
        value: formatCompactNumber(props.data.totals.output_tokens),
        detail: t('Generated tokens'),
      },
      {
        label: t('Cached tokens'),
        value: formatCompactNumber(props.data.totals.cached_tokens),
        detail: t('Read from provider cache'),
      },
    ]
  }

  return (
    <div className='iterloop-analytics-cards'>
      {cards.map((card) => (
        <article key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.detail}</small>
        </article>
      ))}
    </div>
  )
}

function AnalyticsTrend(props: {
  data: SelfAnalytics
  kind: AnalyticsPanelProps['kind']
}) {
  const { t } = useTranslation()
  const chartData = useMemo(
    () =>
      props.data.trend.map((point) => ({
        ...point,
        label: new Intl.DateTimeFormat(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
        }).format(point.timestamp * 1000),
        value:
          props.kind === 'cost'
            ? point.quota
            : point.input_tokens + point.output_tokens,
      })),
    [props.data.trend, props.kind]
  )

  return (
    <section className='iterloop-analytics-panel'>
      <header>
        <div>
          <span>
            {props.kind === 'cost' ? t('Cost trend') : t('Token trend')}
          </span>
          <p>{t('Hourly, within the selected date range')}</p>
        </div>
        <CalendarDays aria-hidden='true' />
      </header>
      <div className='iterloop-analytics-chart'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart
            data={chartData}
            margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`analytics-${props.kind}`}
                x1='0'
                y1='0'
                x2='0'
                y2='1'
              >
                <stop
                  offset='0%'
                  stopColor='var(--dash-amber)'
                  stopOpacity={0.32}
                />
                <stop
                  offset='100%'
                  stopColor='var(--dash-amber)'
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid stroke='var(--dash-line)' vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              minTickGap={42}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
              fontSize={11}
            />
            <Tooltip
              formatter={(value) => {
                const numberValue = Number(value)
                return props.kind === 'cost'
                  ? formatLogQuota(numberValue)
                  : formatCompactNumber(numberValue)
              }}
              contentStyle={{
                border: '1px solid var(--dash-line-strong)',
                borderRadius: 10,
                background: 'var(--dash-card, #fff)',
              }}
            />
            <Area
              type='monotone'
              dataKey='value'
              stroke='var(--dash-amber)'
              strokeWidth={2}
              fill={`url(#analytics-${props.kind})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function ModelDistribution(props: {
  data: SelfAnalytics
  kind: AnalyticsPanelProps['kind']
}) {
  const { t } = useTranslation()
  const total = props.data.models.reduce((sum, model) => {
    if (props.kind === 'cost') return sum + model.quota
    return sum + model.input_tokens + model.output_tokens
  }, 0)

  return (
    <section className='iterloop-analytics-panel iterloop-model-distribution'>
      <header>
        <div>
          <span>{t('Model distribution')}</span>
          <p>
            {props.kind === 'cost'
              ? t('Share of settled cost')
              : t('Share of token volume')}
          </p>
        </div>
        <BarChart3 aria-hidden='true' />
      </header>
      <div className='iterloop-model-bars'>
        {props.data.models.map((model) => {
          const value =
            props.kind === 'cost'
              ? model.quota
              : model.input_tokens + model.output_tokens
          const share = total ? Math.round((value / total) * 100) : 0
          return (
            <div key={model.model_name}>
              <div>
                <strong>{model.model_name}</strong>
                <span>{share}%</span>
              </div>
              <i>
                <span style={{ width: `${share}%` }} />
              </i>
              <small>
                {props.kind === 'cost'
                  ? formatLogQuota(value)
                  : formatCompactNumber(value)}
              </small>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function AnalyticsPanel(props: AnalyticsPanelProps) {
  const { t } = useTranslation()
  const analytics = useConsoleAnalytics()
  const data = analytics.analyticsQuery.data

  return (
    <div className='iterloop-dashboard-stack'>
      <AnalyticsFiltersBar
        filters={analytics.filters}
        onChange={analytics.setFilters}
        apiKeys={analytics.apiKeys}
        loading={analytics.apiKeysLoading}
      />
      {analytics.analyticsQuery.isLoading ? (
        <div className='iterloop-analytics-loading'>
          <Skeleton className='h-32' />
          <Skeleton className='h-80' />
        </div>
      ) : null}
      {analytics.analyticsQuery.isError ? (
        <div className='iterloop-analytics-empty' role='alert'>
          <Database aria-hidden='true' />
          <h2>{t('Analytics are unavailable')}</h2>
          <p>{t('Try again or choose a shorter date range.')}</p>
        </div>
      ) : null}
      {data && data.totals.requests === 0 ? (
        <div className='iterloop-analytics-empty'>
          <Database aria-hidden='true' />
          <h2>{t('No data for this range')}</h2>
          <p>
            {t('Requests will appear here after the selected key is used.')}
          </p>
        </div>
      ) : null}
      {data && data.totals.requests > 0 ? (
        <>
          <AnalyticsCards data={data} kind={props.kind} />
          <div className='iterloop-analytics-grid'>
            <AnalyticsTrend data={data} kind={props.kind} />
            <ModelDistribution data={data} kind={props.kind} />
          </div>
        </>
      ) : null}
    </div>
  )
}
