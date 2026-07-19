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
import { Link, useLocation } from '@tanstack/react-router'
import {
  ChartNoAxesCombined,
  CircleDollarSign,
  CreditCard,
  KeyRound,
  Route as RouteIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IterLoopMark } from '@/components/iterloop-mark'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { cn } from '@/lib/utils'

const consoleTabItems = [
  { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  { id: 'routing' as const, label: 'Routing', icon: RouteIcon },
  { id: 'api-keys' as const, label: 'API Keys', icon: KeyRound },
  { id: 'usage' as const, label: 'Usage', icon: ChartNoAxesCombined },
  { id: 'cost' as const, label: 'Cost', icon: CircleDollarSign },
]

export function IterLoopConsoleHeader() {
  const { t } = useTranslation()

  return (
    <header className='iterloop-console-header'>
      <Link
        to='/dashboard'
        search={{ tab: 'billing' }}
        className='iterloop-console-brand'
      >
        <IterLoopMark compact />
        <span>IterLoop</span>
        <i>{t('Console')}</i>
      </Link>
      <div className='iterloop-console-header-meta'>
        <span className='iterloop-console-status'>
          <i aria-hidden='true' />
          {t('All systems operational')}
        </span>
        <ProfileDropdown />
      </div>
    </header>
  )
}

function ConsoleNavigation(props: { mobile?: boolean }) {
  const { t } = useTranslation()
  const location = useLocation()
  const activeTab =
    new URLSearchParams(location.searchStr).get('tab') || 'billing'

  return (
    <nav
      className={cn(
        'iterloop-console-navigation',
        props.mobile && 'iterloop-console-navigation-mobile'
      )}
      aria-label={t('Console navigation')}
    >
      {consoleTabItems.map((item) => (
        <Link
          key={item.id}
          to='/dashboard'
          search={{ tab: item.id }}
          className={cn(activeTab === item.id && 'is-active')}
          aria-current={activeTab === item.id ? 'page' : undefined}
        >
          <item.icon aria-hidden='true' />
          <span>{t(item.label)}</span>
        </Link>
      ))}
    </nav>
  )
}

export function IterLoopConsoleSidebar() {
  const { t } = useTranslation()

  return (
    <aside className='iterloop-console-sidebar'>
      <div className='iterloop-console-sidebar-label'>{t('Workspace')}</div>
      <ConsoleNavigation />
      <div className='iterloop-console-sidebar-note'>
        <span>{t('Production route')}</span>
        <strong>{t('Curated routing')}</strong>
        <p>{t('One verified channel is active.')}</p>
      </div>
    </aside>
  )
}

export function IterLoopConsoleMobileTabs() {
  return <ConsoleNavigation mobile />
}
