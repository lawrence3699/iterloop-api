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
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Footer } from '@/components/layout/components/footer'
import { PublicLayout } from '@/components/layout/components/public-layout'
import { cn } from '@/lib/utils'

const DOC_TABS = [
  { id: 'desktop', label: 'Codex Desktop', to: '/docs/install-codex-desktop' },
  { id: 'api', label: 'API integration', to: '/docs/api-integration' },
] as const

export function DocsLayout(props: {
  active: (typeof DOC_TABS)[number]['id']
  eyebrow: string
  title: string
  description: string
  sections: { id: string; label: string }[]
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  return (
    <PublicLayout showMainContainer={false}>
      <main className='iterloop-docs-page'>
        <motion.header
          className='iterloop-docs-hero'
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.72,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span>{t(props.eyebrow)}</span>
          <h1>{t(props.title)}</h1>
          <p>{t(props.description)}</p>
        </motion.header>

        <div
          className='iterloop-docs-tabs'
          role='navigation'
          aria-label={t('Documentation')}
        >
          {DOC_TABS.map((tab) => (
            <Link
              key={tab.id}
              to={tab.to}
              className={props.active === tab.id ? 'is-active' : undefined}
            >
              {t(tab.label)}
            </Link>
          ))}
        </div>

        <div className='iterloop-docs-layout'>
          <aside>
            <span>{t('On this page')}</span>
            <nav aria-label={t('On this page')}>
              {props.sections.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {t(section.label)}
                </a>
              ))}
            </nav>
          </aside>
          <motion.article
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.68,
              delay: reduceMotion ? 0 : 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {props.children}
          </motion.article>
        </div>
      </main>
      <Footer />
    </PublicLayout>
  )
}

export function DocSection(props: {
  id: string
  number: string
  title: string
  children: React.ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <section
      id={props.id}
      className={cn('iterloop-doc-section', props.className)}
    >
      <header>
        <span>{props.number}</span>
        <h2>{t(props.title)}</h2>
      </header>
      {props.children}
    </section>
  )
}

export function CodeSample(props: { title: string; value: string }) {
  const { t } = useTranslation()
  return (
    <div className='iterloop-doc-code'>
      <header>
        <span>{props.title}</span>
        <CopyButton
          value={props.value}
          tooltip={`${t('Copy')} ${props.title}`}
        />
      </header>
      <pre>
        <code>{props.value}</code>
      </pre>
      <i aria-hidden='true' />
    </div>
  )
}

export function DocsPager(props: {
  previous?: {
    label: string
    to: '/docs/install-codex-desktop' | '/docs/api-integration'
  }
  next?: {
    label: string
    to: '/docs/install-codex-desktop' | '/docs/api-integration'
  }
}) {
  const { t } = useTranslation()
  return (
    <nav
      className='iterloop-docs-pager'
      aria-label={t('Documentation pagination')}
    >
      {props.previous ? (
        <Link to={props.previous.to}>
          <ArrowLeft aria-hidden='true' />
          <span>
            <small>{t('Previous')}</small>
            {t(props.previous.label)}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {props.next ? (
        <Link to={props.next.to}>
          <span>
            <small>{t('Next')}</small>
            {t(props.next.label)}
          </span>
          <ArrowRight aria-hidden='true' />
        </Link>
      ) : null}
    </nav>
  )
}
