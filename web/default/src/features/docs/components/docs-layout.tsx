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
import { Check, Copy, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Footer } from '@/components/layout/components/footer'
import { PublicLayout } from '@/components/layout/components/public-layout'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

import '../docs-clone.css'

import { DocsMobileNav, DocsSidebarNav, type DocsNavActiveId } from './docs-nav'

/** Clone docs shell: warm paper stage, sticky "Quick Start for Agents"
 * sidebar, article column with the original entrance animation. */
export function DocsLayout(props: {
  active: DocsNavActiveId
  title: string
  description: string
  children: React.ReactNode
}) {
  const { t } = useTranslation()

  return (
    <PublicLayout showMainContainer={false}>
      <main className='pt-[76px] max-[640px]:pt-[60px]'>
        <div className='docs-new-ui'>
          <div className='doc-shell'>
            <aside className='doc-aside'>
              <DocsSidebarNav active={props.active} />
            </aside>
            <div className='doc-main'>
              <DocsMobileNav active={props.active} />
              <div className='doc-article-transition'>
                <div className='doc-article-content'>
                  <div className='docs-body ti-panel'>
                    <div className='ti-head'>
                      <h1>{t(props.title)}</h1>
                    </div>
                    <p className='ti-blurb'>{t(props.description)}</p>
                    {props.children}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </PublicLayout>
  )
}

export function DocSection(props: {
  id: string
  title: string
  children: React.ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <section id={props.id} className={cn('doc-sec', props.className)}>
      <header className='doc-sec-head'>
        <h2>{t(props.title)}</h2>
      </header>
      {props.children}
    </section>
  )
}

/** Amber tip callout — the clone `.doc-note` box. */
export function DocNote(props: { children: React.ReactNode }) {
  return (
    <div className='doc-note'>
      <Info className='ic' aria-hidden='true' />
      <div className='note-body'>{props.children}</div>
    </div>
  )
}

/** Clone `.code` block: dark panel, language bar, mono copy button. */
export function CodeSample(props: { title: string; value: string }) {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard({ notify: false })
  const isCopied = copiedText === props.value

  return (
    <div className='code'>
      <div className='code-bar'>
        <span className='code-lang'>{props.title}</span>
        <button
          type='button'
          className='code-copy'
          onClick={() => copyToClipboard(props.value)}
          aria-label={`${t('Copy')} ${props.title}`}
        >
          {isCopied ? (
            <Check aria-hidden='true' />
          ) : (
            <Copy aria-hidden='true' />
          )}
          <span>{isCopied ? t('Copied') : t('Copy')}</span>
        </button>
      </div>
      <pre>
        <code>{props.value}</code>
      </pre>
    </div>
  )
}

type DocsPagerRoute =
  | '/docs/install-codex-desktop'
  | '/docs/codex-cli'
  | '/docs/claude-code'
  | '/docs/claude-desktop'
  | '/docs/cline'
  | '/docs/cherry-studio'
  | '/docs/openclaw'
  | '/docs/api-integration'
  | '/docs/open-apis'
  | '/docs/billing-questions'

export function DocsPager(props: {
  previous?: {
    label: string
    to: DocsPagerRoute
  }
  next?: {
    label: string
    to: DocsPagerRoute
  }
}) {
  const { t } = useTranslation()
  return (
    <nav className='doc-pager' aria-label={t('Documentation pagination')}>
      {props.previous ? (
        <Link to={props.previous.to} className='doc-pager-card'>
          <span className='doc-pager-kicker'>{t('Previous')}</span>
          <span className='doc-pager-title'>{t(props.previous.label)}</span>
        </Link>
      ) : (
        <span className='doc-pager-spacer' aria-hidden='true' />
      )}
      {props.next ? (
        <Link to={props.next.to} className='doc-pager-card is-next'>
          <span className='doc-pager-kicker'>{t('Next')}</span>
          <span className='doc-pager-title'>{t(props.next.label)}</span>
        </Link>
      ) : null}
    </nav>
  )
}
