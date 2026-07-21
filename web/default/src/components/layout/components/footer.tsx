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
import { Link } from '@tanstack/react-router'
import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { cn } from '@/lib/utils'

interface FooterLink {
  text: string
  href: string
}

interface FooterColumnProps {
  title: string
  links: FooterLink[]
}

interface FooterProps {
  logo?: string
  name?: string
  columns?: FooterColumnProps[]
  copyright?: string
  className?: string
}

function FooterLinkItem(props: { link: FooterLink }) {
  const { t } = useTranslation()
  const isExternal = props.link.href.startsWith('http')
  const label = t(props.link.text)

  if (isExternal) {
    return (
      <a
        href={props.link.href}
        target='_blank'
        rel='noopener noreferrer'
        className='il-footer-link'
      >
        <span>{label}</span>
      </a>
    )
  }

  return (
    <Link to={props.link.href} className='il-footer-link'>
      <span>{label}</span>
    </Link>
  )
}

// Renders User Agreement / Privacy Policy links inline with the parent's
// copyright row when either is configured in System Settings → Site. Emits
// fragmented siblings so the parent flex container's gap controls spacing.
function LegalLinks(props: { leadingSeparator?: boolean }) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const items: { key: string; label: string; href: string }[] = []
  if (status?.user_agreement_enabled) {
    items.push({
      key: 'user-agreement',
      label: t('User Agreement'),
      href: '/user-agreement',
    })
  }
  if (status?.privacy_policy_enabled) {
    items.push({
      key: 'privacy-policy',
      label: t('Privacy Policy'),
      href: '/privacy-policy',
    })
  }
  if (items.length === 0) {
    return null
  }
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {(props.leadingSeparator || index > 0) && (
            <span aria-hidden='true' className='opacity-40'>
              ·
            </span>
          )}
          <Link
            to={item.href}
            className='transition-colors hover:text-[var(--text-primary)]'
          >
            {item.label}
          </Link>
        </Fragment>
      ))}
    </>
  )
}

// inline=true returns just the inner span for composition in a parent flex
// row. inline=false wraps in a centered/right-aligned div (default).
function ProjectAttribution(props: { currentYear: number; inline?: boolean }) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const version = String(status?.version || 'source')
  const content = (
    <span>
      &copy; {props.currentYear}{' '}
      <a
        href='https://github.com/lawrence3699/iterloop-api'
        target='_blank'
        rel='noopener noreferrer'
        className='font-medium transition-colors hover:text-[var(--text-primary)]'
      >
        IterLoop API
      </a>
      {' · '}
      {t('AGPLv3 source')} · {version}
    </span>
  )
  if (props.inline) {
    return content
  }
  return <div className='text-center sm:text-right'>{content}</div>
}

export function Footer(props: FooterProps) {
  const { t } = useTranslation()
  const { systemName, footerHtml } = useSystemConfig()

  const displayName = systemName || props.name || 'IterLoop'
  const currentYear = new Date().getFullYear()

  const fallbackColumns = useMemo<FooterColumnProps[]>(
    () => [
      {
        title: t('Platform'),
        links: [
          {
            text: t('Console'),
            href: '/dashboard',
          },
          {
            text: t('Pricing'),
            href: '/pricing',
          },
          {
            text: t('API Keys'),
            href: '/keys',
          },
        ],
      },
      {
        title: t('Developers'),
        links: [
          {
            text: t('Quick start'),
            href: '/docs',
          },
          {
            text: t('Public pricing data'),
            href: 'https://api.iter-loop.com/pricing.json',
          },
          {
            text: t('Service health'),
            href: 'https://api.iter-loop.com/healthz',
          },
        ],
      },
      {
        title: t('Open source'),
        links: [
          {
            text: t('Running source'),
            href: 'https://github.com/lawrence3699/iterloop-api',
          },
          {
            text: t('Upstream project'),
            href: 'https://github.com/QuantumNous/new-api',
          },
          {
            text: t('License'),
            href: 'https://github.com/lawrence3699/iterloop-api/blob/iterloop/phase-1/LICENSE',
          },
        ],
      },
    ],
    [t]
  )

  const displayColumns = props.columns ?? fallbackColumns

  if (footerHtml) {
    return (
      <footer className={cn('il-footer', props.className)}>
        <div className='il-footer-inner py-5'>
          <div className='il-card flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-5'>
            <div
              className='custom-footer il-footer-tagline min-w-0 text-center sm:text-left'
              dangerouslySetInnerHTML={{ __html: footerHtml }}
            />
            <div className='il-footer-bottom flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 !border-t-0 !py-0 sm:w-auto sm:justify-end'>
              <LegalLinks />
              <ProjectAttribution currentYear={currentYear} inline />
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className={cn('il-footer', props.className)}>
      <div className='il-footer-inner'>
        <div className='grid gap-10 py-10 md:grid-cols-3 md:items-start md:gap-12 md:py-14'>
          {/* Brand column — clone: wordmark logo + one-line tagline. */}
          <div className='max-w-sm space-y-4'>
            <Link to='/' className='inline-flex' aria-label={displayName}>
              <img
                src='/media/clone/iterloop-logo-transparent.svg'
                alt={displayName}
                width={150}
                height={35}
                className='dark:invert'
                loading='lazy'
              />
            </Link>
            <p className='il-footer-tagline'>
              {t('The native billing and routing layer built for developers.')}
            </p>
          </div>

          {/* Link columns — clone: two-column footer nav. */}
          {displayColumns.length > 0 && (
            <nav
              className='grid grid-cols-2 gap-10 sm:gap-16 md:col-span-2 md:grid-cols-3 md:gap-12'
              aria-label={t('Footer navigation')}
            >
              {displayColumns.map((column) => (
                <div key={column.title}>
                  <h2 className='il-footer-col-title'>{t(column.title)}</h2>
                  <ul className='mt-3.5 space-y-1.5'>
                    {column.links.map((link) => (
                      <li key={`${link.href}-${link.text}`}>
                        <FooterLinkItem link={link} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          )}
        </div>

        {/* Bottom bar — clone: © line left, tagline right; legal links and
            AGPL attribution preserved. */}
        <div className='il-footer-bottom'>
          <div className='flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start'>
            <span>
              &copy; {currentYear} {displayName}.{' '}
              {props.copyright ?? t('footer.defaultCopyright')}
            </span>
            <LegalLinks leadingSeparator />
          </div>
          <ProjectAttribution currentYear={currentYear} />
        </div>
      </div>
    </footer>
  )
}
