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
  Earth,
  KeyRound,
  Moon,
  Route as RouteIcon,
  Sun,
} from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { IterLoopMark } from '@/components/iterloop-mark'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { useTheme } from '@/context/theme-provider'
import {
  INTERFACE_LANGUAGE_OPTIONS,
  normalizeInterfaceLanguage,
} from '@/i18n/languages'
import { api } from '@/lib/api'
import { iterLoopPublicUrl } from '@/lib/iterloop-host'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const consoleTabItems = [
  { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  { id: 'routing' as const, label: 'Routing', icon: RouteIcon },
  { id: 'api-keys' as const, label: 'API Keys', icon: KeyRound },
  { id: 'usage' as const, label: 'Usage', icon: ChartNoAxesCombined },
  { id: 'cost' as const, label: 'Cost', icon: CircleDollarSign },
]

/** Clone-styled compact language pill (globe + 中文/EN), mirroring the
 * public header's `.il-top-nav-lang` control. Persists the choice onto the
 * user profile like the shared LanguageSwitcher does. */
function ConsoleLanguagePill() {
  const { i18n, t } = useTranslation()
  const user = useAuthStore((s) => s.auth.user)
  const language = normalizeInterfaceLanguage(i18n.language)
  const shortLabel = language === 'en' ? 'EN' : '中文'

  const handleChangeLanguage = async (code: string) => {
    await i18n.changeLanguage(code)
    if (user) {
      try {
        await api.put('/api/user/self', { language: code })
      } catch {
        // Best-effort persistence; don't block the UI on failure
      }
    }
  }

  return (
    <label className='iterloop-console-lang iterloop-native-select'>
      <Earth aria-hidden='true' />
      <span>{shortLabel}</span>
      <span className='sr-only'>{t('Change language')}</span>
      <select
        aria-label={t('Change language')}
        value={language}
        onChange={(event) => void handleChangeLanguage(event.target.value)}
      >
        {INTERFACE_LANGUAGE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ConsoleThemePill() {
  const { t } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type='button'
      className='iterloop-console-theme'
      aria-label={t('Toggle theme')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? (
        <Moon aria-hidden='true' />
      ) : (
        <Sun aria-hidden='true' />
      )}
    </button>
  )
}

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
        <a
          href={iterLoopPublicUrl('/')}
          className='iterloop-console-website-link'
        >
          {t('Website')}
        </a>
        <span className='iterloop-console-status'>
          <i aria-hidden='true' />
          {t('All systems operational')}
        </span>
        <ConsoleLanguagePill />
        <ConsoleThemePill />
        <ProfileDropdown />
      </div>
    </header>
  )
}

function ConsoleNavigation(props: { mobile?: boolean }) {
  const { t } = useTranslation()
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const activeTab =
    new URLSearchParams(location.searchStr).get('tab') || 'billing'
  const withIndicator = !props.mobile

  // Slide the clone's active-item indicator to match the active link
  // (original .dashboard-menu-indicator behavior).
  useLayoutEffect(() => {
    if (!withIndicator) return
    const nav = navRef.current
    if (!nav) return
    const activeLink = nav.querySelector<HTMLElement>('a.is-active')
    if (activeLink) {
      nav.style.setProperty(
        '--console-menu-indicator-y',
        `${activeLink.offsetTop}px`
      )
      nav.style.setProperty(
        '--console-menu-indicator-h',
        `${activeLink.offsetHeight}px`
      )
    }
  }, [activeTab, withIndicator])

  return (
    <nav
      ref={navRef}
      className={cn(
        'iterloop-console-navigation',
        withIndicator && 'has-indicator',
        props.mobile && 'iterloop-console-navigation-mobile'
      )}
      aria-label={t('Console navigation')}
    >
      {withIndicator && (
        <span className='iterloop-console-menu-indicator' aria-hidden='true' />
      )}
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
    </aside>
  )
}

export function IterLoopConsoleMobileTabs() {
  return <ConsoleNavigation mobile />
}
