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
import { Link, useRouterState } from '@tanstack/react-router'
import { Earth, Menu, Moon, Sun, UserRound, X } from 'lucide-react'
import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'

import { useTheme } from '@/context/theme-provider'
import {
  INTERFACE_LANGUAGE_OPTIONS,
  normalizeInterfaceLanguage,
} from '@/i18n/languages'
import { iterLoopConsoleUrl, iterLoopPublicUrl } from '@/lib/iterloop-host'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const ProfileDropdown = lazy(async () => {
  const module = await import('@/components/profile-dropdown')
  return { default: module.ProfileDropdown }
})

type IterLoopPublicHeaderProps = {
  showThemeSwitch?: boolean
  showLanguageSwitcher?: boolean
  showAuthButtons?: boolean
  className?: string
}

type HeaderLinkProps = {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

function HeaderLink(props: HeaderLinkProps) {
  if (props.href.startsWith('http') || props.href.includes('#')) {
    return (
      <a href={props.href} className={props.className} onClick={props.onClick}>
        {props.children}
      </a>
    )
  }

  return (
    <Link to={props.href} className={props.className} onClick={props.onClick}>
      {props.children}
    </Link>
  )
}

/** Clone's `.top-nav-lang` pill: globe icon + short language label. The
 * original functionality (native select overlay) is preserved. */
function PublicLanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const language = normalizeInterfaceLanguage(i18n.language)
  const shortLabel = language === 'en' ? 'EN' : '中文'

  return (
    <label className='il-top-nav-lang iterloop-native-select'>
      <span className='il-top-nav-lang-icon' aria-hidden='true'>
        <Earth className='size-4' aria-hidden='true' />
        <span className='il-top-nav-lang-dot' />
      </span>
      <span className='il-top-nav-lang-label'>{shortLabel}</span>
      <span className='sr-only'>{t('Change language')}</span>
      <select
        aria-label={t('Change language')}
        value={language}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
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

function PublicThemeSwitch() {
  const { t } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type='button'
      className='il-top-nav-icon-btn'
      aria-label={t('Toggle theme')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? (
        <Moon className='size-[17px]' aria-hidden='true' />
      ) : (
        <Sun className='size-[17px]' aria-hidden='true' />
      )}
    </button>
  )
}

export function IterLoopPublicHeader(props: IterLoopPublicHeaderProps) {
  const { t } = useTranslation()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const user = useAuthStore((state) => state.auth.user)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { label: t('Home'), href: iterLoopPublicUrl('/'), path: '/' },
    {
      label: t('Pricing'),
      href: iterLoopPublicUrl('/pricing'),
      path: '/pricing',
    },
    {
      label: t('Download'),
      href: iterLoopPublicUrl('/download'),
      path: '/download',
    },
    { label: t('Docs'), href: iterLoopPublicUrl('/docs'), path: '/docs' },
    {
      label: t('Dashboard'),
      href: iterLoopConsoleUrl('/dashboard'),
      path: '/dashboard',
    },
  ]

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header
      className={cn('il-navbar-glass', props.className)}
      data-menu-open={mobileOpen || undefined}
    >
      <div className='il-top-nav-inner'>
        <HeaderLink href={iterLoopPublicUrl('/')} className='il-top-nav-brand'>
          <img
            src='/media/clone/iterloop-logo-transparent.svg'
            alt='IterLoop'
            className='il-top-nav-logo'
            loading='lazy'
          />
        </HeaderLink>

        <nav className='il-top-nav-links' aria-label={t('Main navigation')}>
          {navLinks.map((link) => (
            <HeaderLink
              key={link.path}
              href={link.href}
              className={cn(
                'il-top-nav-link',
                isActive(link.path) && 'is-active'
              )}
            >
              {link.label}
            </HeaderLink>
          ))}
        </nav>

        <div className='il-top-nav-actions'>
          {props.showLanguageSwitcher !== false && <PublicLanguageSwitcher />}
          {props.showThemeSwitch !== false && <PublicThemeSwitch />}
          <button
            type='button'
            className='il-top-nav-menu-button'
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t('Close menu') : t('Open menu')}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className='size-[23px]' aria-hidden='true' />
            ) : (
              <Menu className='size-[23px]' aria-hidden='true' />
            )}
          </button>
          {props.showAuthButtons !== false &&
            (user ? (
              <Suspense
                fallback={
                  <HeaderLink
                    href={iterLoopConsoleUrl('/dashboard')}
                    className='il-top-nav-icon-btn max-[640px]:hidden'
                  >
                    <UserRound className='size-[18px]' aria-hidden='true' />
                    <span className='sr-only'>{t('Dashboard')}</span>
                  </HeaderLink>
                }
              >
                <ProfileDropdown />
              </Suspense>
            ) : (
              <HeaderLink
                href={iterLoopConsoleUrl('/sign-in')}
                className='il-btn-outline il-btn-sm max-[640px]:hidden'
              >
                {t('Sign in')}
              </HeaderLink>
            ))}
        </div>
      </div>

      <div
        className={cn('il-top-nav-mobile', mobileOpen && 'is-open')}
        aria-hidden={!mobileOpen}
      >
        {navLinks.map((link) => (
          <HeaderLink
            key={link.path}
            href={link.href}
            className={cn(
              'il-top-nav-link',
              isActive(link.path) && 'is-active'
            )}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </HeaderLink>
        ))}
        {props.showAuthButtons !== false && !user && (
          <HeaderLink
            href={iterLoopConsoleUrl('/sign-in')}
            className='il-top-nav-link'
            onClick={() => setMobileOpen(false)}
          >
            {t('Sign in')}
          </HeaderLink>
        )}
      </div>
    </header>
  )
}
