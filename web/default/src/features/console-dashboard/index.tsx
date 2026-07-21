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
import { getRouteApi } from '@tanstack/react-router'
import { LayoutGrid, Rows3 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { AnalyticsPanel } from './components/analytics-panel'
import { ApiKeysPanel } from './components/api-keys-panel'
import { BillingPanel } from './components/billing-panel'
import { RoutingPanel } from './components/routing-panel'
import type { ConsoleLayoutMode } from './types'

import './clone-console.css'

const route = getRouteApi('/_authenticated/dashboard/')
const LAYOUT_STORAGE_KEY = 'iterloop:console-layout'

const TAB_COPY = {
  billing: {
    title: 'Balance & billing',
    description:
      'Manage balance, add funds, and understand every settled charge.',
  },
  routing: {
    title: 'Routing settings',
    description:
      'See how IterLoop chooses the production path for each request.',
  },
  'api-keys': {
    title: 'API keys',
    description:
      'Connect OpenAI and Anthropic-compatible clients with scoped credentials.',
  },
  usage: {
    title: 'Usage',
    description: 'Explore request and token volume by key, time, and model.',
  },
  cost: {
    title: 'Cost',
    description: 'Review settled spend, model share, and cost trends.',
  },
} as const

function DashboardContent(props: { tab: keyof typeof TAB_COPY }) {
  if (props.tab === 'billing') return <BillingPanel />
  if (props.tab === 'routing') return <RoutingPanel />
  if (props.tab === 'api-keys') return <ApiKeysPanel />
  if (props.tab === 'usage') return <AnalyticsPanel kind='usage' />
  return <AnalyticsPanel kind='cost' />
}

export function ConsoleDashboard() {
  const { t } = useTranslation()
  const { tab = 'billing' } = route.useSearch()
  const reduceMotion = useReducedMotion()
  const [layoutMode, setLayoutMode] = useState<ConsoleLayoutMode>(() => {
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
    return stored === 'flat' ? 'flat' : 'bento'
  })
  const copy = TAB_COPY[tab]

  useEffect(() => {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, layoutMode)
  }, [layoutMode])

  return (
    <div className={cn('iterloop-dashboard', `is-${layoutMode}`)}>
      <header className='iterloop-dashboard-header'>
        <div>
          <span>{t('Console')}</span>
          <h1>{t(copy.title)}</h1>
          <p>{t(copy.description)}</p>
        </div>
        <div
          className='iterloop-layout-toggle'
          role='group'
          aria-label={t('Layout')}
        >
          <button
            type='button'
            className={layoutMode === 'flat' ? 'is-active' : undefined}
            aria-pressed={layoutMode === 'flat'}
            onClick={() => setLayoutMode('flat')}
          >
            <Rows3 aria-hidden='true' />
            {t('Flat')}
          </button>
          <button
            type='button'
            className={layoutMode === 'bento' ? 'is-active' : undefined}
            aria-pressed={layoutMode === 'bento'}
            onClick={() => setLayoutMode('bento')}
          >
            <LayoutGrid aria-hidden='true' />
            {t('Bento')}
          </button>
        </div>
      </header>

      <motion.div
        key={tab}
        className='iterloop-dashboard-content'
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.22,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <DashboardContent tab={tab} />
      </motion.div>
    </div>
  )
}
