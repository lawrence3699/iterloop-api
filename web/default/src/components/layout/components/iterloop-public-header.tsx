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
import { Search, UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { IterLoopMark } from '@/components/iterloop-mark'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { iterLoopConsoleUrl, iterLoopPublicUrl } from '@/lib/iterloop-host'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

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

export function IterLoopPublicHeader(props: IterLoopPublicHeaderProps) {
  const { t } = useTranslation()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const user = useAuthStore((state) => state.auth.user)
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const megaButtonRef = useRef<HTMLButtonElement>(null)

  const primaryLinks = [
    { label: t('Pricing'), href: iterLoopPublicUrl('/pricing') },
    { label: t('API docs'), href: iterLoopPublicUrl('/docs') },
    { label: t('Service status'), href: 'https://api.iter-loop.com/healthz' },
    {
      label: user ? t('Open console') : t('Sign in'),
      href: iterLoopConsoleUrl(user ? '/dashboard' : '/sign-in'),
    },
  ]

  useEffect(() => {
    setMegaOpen(false)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = megaOpen || mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [megaOpen, mobileOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const shouldRestoreFocus = megaOpen
      setMegaOpen(false)
      setMobileOpen(false)
      if (shouldRestoreFocus) {
        window.requestAnimationFrame(() => megaButtonRef.current?.focus())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [megaOpen])

  return (
    <>
      <header className={cn('iterloop-public-header', props.className)}>
        <div className='iterloop-public-header-inner'>
          <nav
            className='iterloop-public-nav'
            aria-label={t('Main navigation')}
          >
            <HeaderLink
              href={iterLoopPublicUrl('/')}
              className='flex h-11 items-center px-2'
            >
              <IterLoopMark compact />
              <span className='sr-only'>IterLoop API</span>
            </HeaderLink>

            <div className='hidden h-11 items-center lg:flex'>
              <button
                ref={megaButtonRef}
                type='button'
                className={cn(
                  'iterloop-global-link',
                  megaOpen && 'text-foreground'
                )}
                aria-expanded={megaOpen}
                aria-controls='iterloop-mega-menu'
                onClick={() => setMegaOpen((open) => !open)}
              >
                {t('Models')}
              </button>
              <HeaderLink
                href={iterLoopPublicUrl('/pricing')}
                className='iterloop-global-link'
              >
                {t('Pricing')}
              </HeaderLink>
              <HeaderLink
                href={iterLoopPublicUrl('/#integrations')}
                className='iterloop-global-link'
              >
                {t('Connect')}
              </HeaderLink>
              <HeaderLink
                href={iterLoopPublicUrl('/docs')}
                className='iterloop-global-link'
              >
                {t('Docs')}
              </HeaderLink>
              <HeaderLink
                href='https://api.iter-loop.com/healthz'
                className='iterloop-global-link'
              >
                {t('Status')}
              </HeaderLink>
            </div>

            <div className='flex h-11 items-center'>
              <HeaderLink
                href={iterLoopPublicUrl('/docs')}
                className='iterloop-global-icon hidden sm:inline-flex'
              >
                <Search className='size-[17px]' aria-hidden='true' />
                <span className='sr-only'>{t('Search')}</span>
              </HeaderLink>
              {props.showLanguageSwitcher !== false && <LanguageSwitcher />}
              {props.showThemeSwitch !== false && <ThemeSwitch />}
              {props.showAuthButtons !== false &&
                (user ? (
                  <ProfileDropdown />
                ) : (
                  <HeaderLink
                    href={iterLoopConsoleUrl('/sign-in')}
                    className='iterloop-global-icon hidden sm:inline-flex'
                  >
                    <UserRound className='size-[18px]' aria-hidden='true' />
                    <span className='sr-only'>{t('Sign in')}</span>
                  </HeaderLink>
                ))}
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-11 rounded-none lg:hidden'
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? t('Close menu') : t('Open menu')}
                onClick={() => setMobileOpen((open) => !open)}
              >
                {mobileOpen ? (
                  <X className='size-5' />
                ) : (
                  <span className='iterloop-menu-lines' aria-hidden='true'>
                    <span />
                    <span />
                  </span>
                )}
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <div
        id='iterloop-mega-menu'
        className={cn('iterloop-mega-menu', megaOpen && 'is-open')}
        aria-hidden={!megaOpen}
      >
        <div className='iterloop-mega-menu-inner'>
          <section>
            <span>{t('Explore')}</span>
            <HeaderLink href={iterLoopPublicUrl('/pricing')}>
              {t('Models and pricing')}
            </HeaderLink>
          </section>
          <section>
            <span>{t('Quick links')}</span>
            <HeaderLink href={iterLoopPublicUrl('/#integrations')}>
              Responses
            </HeaderLink>
            <HeaderLink href={iterLoopPublicUrl('/#integrations')}>
              Messages
            </HeaderLink>
            <HeaderLink href={iterLoopPublicUrl('/docs')}>Codex CLI</HeaderLink>
            <HeaderLink href={iterLoopPublicUrl('/docs')}>
              Claude Code
            </HeaderLink>
          </section>
          <section>
            <span>{t('Account')}</span>
            {primaryLinks.map((link) => (
              <HeaderLink key={link.href} href={link.href}>
                {link.label}
              </HeaderLink>
            ))}
          </section>
        </div>
      </div>
      <button
        type='button'
        className={cn('iterloop-mega-backdrop', megaOpen && 'is-open')}
        aria-label={t('Close menu')}
        tabIndex={megaOpen ? 0 : -1}
        onClick={() => setMegaOpen(false)}
      />

      <div
        className={cn('iterloop-mobile-menu', mobileOpen && 'is-open')}
        aria-hidden={!mobileOpen}
      >
        <nav aria-label={t('Mobile navigation')}>
          {[
            {
              label: t('Models and pricing'),
              href: iterLoopPublicUrl('/pricing'),
            },
            { label: t('Connect'), href: iterLoopPublicUrl('/#integrations') },
            { label: t('API docs'), href: iterLoopPublicUrl('/docs') },
            {
              label: t('Service status'),
              href: 'https://api.iter-loop.com/healthz',
            },
          ].map((link, index) => (
            <HeaderLink
              key={link.href + link.label}
              href={link.href}
              className={mobileOpen ? 'is-visible' : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <span style={{ transitionDelay: `${80 + index * 45}ms` }}>
                {link.label}
              </span>
            </HeaderLink>
          ))}
        </nav>
        <HeaderLink
          href={iterLoopConsoleUrl(user ? '/dashboard' : '/sign-in')}
          className='iterloop-mobile-account'
          onClick={() => setMobileOpen(false)}
        >
          {user ? t('Open console') : t('Sign in')}
        </HeaderLink>
      </div>
    </>
  )
}
