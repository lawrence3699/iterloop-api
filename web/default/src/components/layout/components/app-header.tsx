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
import { useTranslation } from 'react-i18next'

import { ConfigDrawer } from '@/components/config-drawer'
import { ITERLOOP_BRAND_LOCKED } from '@/components/iterloop-mark'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useNotifications } from '@/hooks/use-notifications'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'
import {
  isIterLoopAdminHost,
  isIterLoopAdminPath,
} from '@/lib/iterloop-host'

import { defaultTopNavLinks } from '../config/top-nav.config'
import { type TopNavLink } from '../types'
import { SystemBrand } from './system-brand'
import { TopNav } from './top-nav'

/**
 * General application Header component
 * Integrates navigation bar, search, configuration and profile functions
 *
 * @example
 * // Basic usage
 * <AppHeader />
 *
 * @example
 * // Custom navigation links
 * <AppHeader navLinks={customLinks} />
 *
 * @example
 * // Hide navigation bar and search box
 * <AppHeader showTopNav={false} showSearch={false} />
 *
 * @example
 * // Fully customize left and right content
 * <AppHeader
 *   leftContent={<CustomLeft />}
 *   rightContent={<CustomRight />}
 * />
 */
type AppHeaderProps = {
  /**
   * Custom navigation links, uses default global navigation or dynamically generated from backend if not provided
   */
  navLinks?: TopNavLink[]
  /**
   * Whether to show top navigation bar
   * @default true
   */
  showTopNav?: boolean
  /**
   * Left content, overrides TopNav if provided
   */
  leftContent?: React.ReactNode
  /**
   * Whether to show search box
   * @default true
   */
  showSearch?: boolean
  /**
   * Custom right content, overrides default right content if provided
   */
  rightContent?: React.ReactNode
  /**
   * Whether to show notification button
   * @default true
   */
  showNotifications?: boolean
  /**
   * Whether to show config drawer
   * @default true
   */
  showConfigDrawer?: boolean
  /**
   * Whether to show profile dropdown
   * @default true
   */
  showProfileDropdown?: boolean
}

export function AppHeader({
  navLinks = defaultTopNavLinks,
  showTopNav = true,
  leftContent,
  showSearch = true,
  rightContent,
  showNotifications = true,
  showConfigDrawer = false,
  showProfileDropdown = true,
}: AppHeaderProps) {
  const { t } = useTranslation()
  const pathname = useLocation({ select: (location) => location.pathname })
  // Prioritize dynamically generated links from backend
  const dynamicLinks = useTopNavLinks()
  const links = dynamicLinks.length > 0 ? dynamicLinks : navLinks
  const adminWorkspace =
    isIterLoopAdminHost() || isIterLoopAdminPath(pathname)

  // Notifications hook
  const notifications = useNotifications()

  return (
    <header className='iterloop-app-header'>
      <div className='iterloop-app-global'>
        <div className='iterloop-app-global-inner'>
          <SystemBrand variant='inline' />

          <nav className='iterloop-app-global-links' aria-label={t('Main navigation')}>
            <Link to='/dashboard'>{t('Dashboard')}</Link>
            <Link to='/keys'>{t('API Keys')}</Link>
            <Link to='/usage-logs/$section' params={{ section: 'common' }}>
              {t('Usage Logs')}
            </Link>
            <Link to='/pricing'>{t('Pricing')}</Link>
            <Link to='/docs'>{t('API docs')}</Link>
          </nav>

          {rightContent ?? (
            <div className='iterloop-app-actions'>
              {showSearch && <Search />}
              {showNotifications && (
                <NotificationPopover
                  open={notifications.popoverOpen}
                  onOpenChange={notifications.setPopoverOpen}
                  unreadCount={notifications.unreadCount}
                  activeTab={notifications.activeTab}
                  onTabChange={notifications.setActiveTab}
                  notice={notifications.notice}
                  announcements={notifications.announcements}
                  loading={notifications.loading}
                />
              )}
              <LanguageSwitcher />
              <ThemeSwitch />
              {showConfigDrawer && !ITERLOOP_BRAND_LOCKED && <ConfigDrawer />}
              {showProfileDropdown && <ProfileDropdown />}
            </div>
          )}
        </div>
      </div>

      <div className='iterloop-app-local'>
        <div className='iterloop-app-local-title'>
          <SidebarTrigger variant='ghost' className='size-9' />
          <span>
            IterLoop {adminWorkspace ? t('Admin') : t('Console')}
          </span>
          {leftContent ? (
            <div className='ms-3 flex items-center'>{leftContent}</div>
          ) : null}
        </div>

        {showTopNav && links.length > 0 ? (
          <div className='iterloop-app-local-links'>
            <TopNav links={links} />
          </div>
        ) : null}
      </div>
    </header>
  )
}
