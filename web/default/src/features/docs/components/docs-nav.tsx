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
import { ArrowRightLeft, Braces, WalletCards } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

export type DocsNavActiveId =
  | 'cc-switch'
  | 'codex-desktop'
  | 'codex-cli'
  | 'claude-code'
  | 'claude-desktop'
  | 'cline'
  | 'cherry-studio'
  | 'openclaw'
  | 'api-integration'
  | 'open-apis'
  | 'billing-questions'

type DocRoute =
  | '/docs/install-cc-switch'
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

/* Brand glyphs captured 1:1 from the clone docs sidebar markup. */

function CodexGlyphIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='currentColor'
      fillRule='evenodd'
      aria-hidden='true'
    >
      <path
        clipRule='evenodd'
        d='M8.086.457a6.105 6.105 0 0 1 3.046-.415c1.333.153 2.521.72 3.564 1.7a.117.117 0 0 0 .107.029c1.408-.346 2.762-.224 4.061.366l.063.03.154.076c1.357.703 2.33 1.77 2.918 3.198.278.679.418 1.388.421 2.126a5.655 5.655 0 0 1-.18 1.631.167.167 0 0 0 .04.155 5.982 5.982 0 0 1 1.578 2.891c.385 1.901-.01 3.615-1.183 5.14l-.182.22a6.063 6.063 0 0 1-2.934 1.851.162.162 0 0 0-.108.102c-.255.736-.511 1.364-.987 1.992-1.199 1.582-2.962 2.462-4.948 2.451-1.583-.008-2.986-.587-4.21-1.736a.145.145 0 0 0-.14-.032c-.518.167-1.04.191-1.604.185a5.924 5.924 0 0 1-2.595-.622 6.058 6.058 0 0 1-2.146-1.781c-.203-.269-.404-.522-.551-.821a7.74 7.74 0 0 1-.495-1.283 6.11 6.11 0 0 1-.017-3.064.166.166 0 0 0 .008-.074.115.115 0 0 0-.037-.064 5.958 5.958 0 0 1-1.38-2.202 5.196 5.196 0 0 1-.333-1.589 6.915 6.915 0 0 1 .188-2.132c.45-1.484 1.309-2.648 2.577-3.493.282-.188.55-.334.802-.438.286-.12.573-.22.861-.304a.129.129 0 0 0 .087-.087A6.016 6.016 0 0 1 5.635 2.31C6.315 1.464 7.132.846 8.086.457zm-.804 7.85a.848.848 0 0 0-1.473.842l1.694 2.965-1.688 2.848a.849.849 0 0 0 1.46.864l1.94-3.272a.849.849 0 0 0 .007-.854l-1.94-3.393zm5.446 6.24a.849.849 0 0 0 0 1.695h4.848a.849.849 0 0 0 0-1.696h-4.848z'
      />
    </svg>
  )
}

function ClaudeGlyphIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='currentColor'
      fillRule='evenodd'
      aria-hidden='true'
    >
      <path
        clipRule='evenodd'
        d='M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z'
      />
    </svg>
  )
}

function ClineGlyphIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='currentColor'
      fillRule='evenodd'
      aria-hidden='true'
    >
      <path d='M17.035 3.991c2.75 0 4.98 2.24 4.98 5.003v1.667l1.45 2.896a1.01 1.01 0 0 1-.002.909l-1.448 2.864v1.668c0 2.762-2.23 5.002-4.98 5.002H7.074c-2.751 0-4.98-2.24-4.98-5.002V17.33l-1.48-2.855a1.01 1.01 0 0 1-.003-.927l1.482-2.887V8.994c0-2.763 2.23-5.003 4.98-5.003h9.962zM8.265 9.6a2.274 2.274 0 0 0-2.274 2.274v4.042a2.274 2.274 0 0 0 4.547 0v-4.042A2.274 2.274 0 0 0 8.265 9.6zm7.326 0a2.274 2.274 0 0 0-2.274 2.274v4.042a2.274 2.274 0 1 0 4.548 0v-4.042A2.274 2.274 0 0 0 15.59 9.6z' />
      <path d='M12.054 5.558a2.779 2.779 0 1 0 0-5.558 2.779 2.779 0 0 0 0 5.558z' />
    </svg>
  )
}

function CherryStudioGlyphIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='currentColor'
      fillRule='evenodd'
      aria-hidden='true'
    >
      <path d='M6.513 18.419c-1.6 0-3.107-.64-4.247-1.802A6.146 6.146 0 0 1 .5 12.287c0-1.63.626-3.168 1.766-4.33 1.14-1.162 2.647-1.802 4.247-1.802s3.132.655 4.25 1.795c.835.849.835 2.23 0 3.078a2.11 2.11 0 0 1-3.02 0 1.737 1.737 0 0 0-1.234-.521c-.945 0-1.744.813-1.744 1.776 0 .964.799 1.777 1.744 1.777.46 0 .907-.19 1.234-.522a2.11 2.11 0 0 1 3.02 0c.835.85.835 2.23 0 3.079a5.997 5.997 0 0 1-4.25 1.794v.008z' />
      <path d='M12.026 24c-1.6 0-3.107-.64-4.247-1.802a6.146 6.146 0 0 1-1.766-4.33c0-1.63.644-3.193 1.762-4.337a2.11 2.11 0 0 1 3.021 0c.834.849.834 2.23 0 3.078-.324.331-.51.788-.51 1.255 0 .964.798 1.777 1.744 1.777.945 0 1.744-.813 1.744-1.777 0-.341-.083-.83-.475-1.233a6.255 6.255 0 0 1-1.77-4.348c0-1.615.627-3.168 1.767-4.33s2.646-1.802 4.247-1.802c1.6 0 3.107.64 4.247 1.802a6.146 6.146 0 0 1 1.766 4.33c0 1.63-.644 3.194-1.762 4.337a2.11 2.11 0 0 1-3.021 0 2.206 2.206 0 0 1 0-3.078c.323-.331.51-.788.51-1.255 0-.964-.798-1.777-1.744-1.777s-1.744.813-1.744 1.777c0 .47.19.935.521 1.27 1.115 1.136 1.727 2.667 1.727 4.311a6.122 6.122 0 0 1-1.766 4.33C15.137 23.36 13.63 24 12.03 24h-.004z' />
      <path d='M12.026 6.867 8.53 3.587a1.336 1.336 0 1 1 1.827-1.949l1.4 1.313L13.744.495a1.336 1.336 0 0 1 2.075 1.68l-3.798 4.692h.004z' />
    </svg>
  )
}

function OpenClawGlyphIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='currentColor'
      fillRule='evenodd'
      aria-hidden='true'
    >
      <path d='M9.046 7.104a.527.527 0 1 1 0 1.055.527.527 0 0 1 0-1.055zM15.376 7.104a.528.528 0 1 1 0 1.056.528.528 0 0 1 0-1.056z' />
      <path
        clipRule='evenodd'
        d='M16.877 1.912c.58-.27 1.14-.323 1.616-.037a.317.317 0 0 1-.326.542c-.227-.136-.547-.153-1.022.068-.352.165-.765.45-1.234.866 2.683 1.17 4.4 3.5 5.148 5.921a6.421 6.421 0 0 0-.704.184c-.578.016-1.174.204-1.502.735-.338.55-.268 1.276.072 2.069l.005.012.007.014c.523 1.045 1.318 1.91 2.2 2.284-.912 3.274-3.44 6.144-5.972 6.988v2.109h-2.11v-2.11c-1.043.417-2.086.01-2.11 0v2.11h-2.11v-2.11c-2.531-.843-5.061-3.713-5.973-6.987.882-.373 1.678-1.238 2.2-2.284l.007-.014.006-.012c.34-.793.41-1.518.071-2.069-.327-.531-.923-.719-1.503-.735a6.409 6.409 0 0 0-.704-.183c.749-2.421 2.466-4.751 5.149-5.922-.47-.416-.88-.701-1.234-.866-.474-.221-.794-.204-1.021-.068a.318.318 0 0 1-.435-.109.317.317 0 0 1 .109-.433c.476-.286 1.036-.233 1.615.037.49.229 1.031.628 1.621 1.182A9.924 9.924 0 0 1 12 2.568c1.199 0 2.284.19 3.256.526.59-.554 1.13-.953 1.62-1.182zM8.835 6.577a1.266 1.266 0 1 0 0 2.532 1.266 1.266 0 0 0 0-2.532zm6.33 0a1.267 1.267 0 1 0 0 2.533 1.267 1.267 0 0 0 0-2.533z'
      />
      <path d='M.395 13.118c-.966-1.932-.163-3.863 2.41-3.365v-.001l.05.01c.084.018.17.038.26.06.033.009.067.017.1.027.084.022.168.048.255.076l.09.027c.528 0 .95.158 1.16.501.212.343.212.87-.105 1.61-.085.17-.178.333-.276.489l-.01.017a4.967 4.967 0 0 1-.62.791l-.019.02c-1.092 1.117-2.496 1.336-3.295-.262zM21.193 9.753c2.574-.5 3.378 1.433 2.411 3.365-.58 1.159-1.476 1.361-2.342.96l-.011-.005a2.419 2.419 0 0 1-.114-.056l-.019-.01a2.751 2.751 0 0 1-.115-.067l-.023-.014c-.035-.022-.071-.044-.106-.068l-.05-.035c-.55-.388-1.062-1.007-1.44-1.76-.276-.647-.311-1.132-.174-1.472.176-.439.636-.639 1.23-.639.032-.011.066-.02.099-.03.08-.026.16-.05.238-.072l.117-.03a5.502 5.502 0 0 1 .3-.067z' />
    </svg>
  )
}

type DocsNavEntry = {
  id?: DocsNavActiveId
  label: string
  to?: DocRoute
  icon: React.ReactNode
  lineIcon?: boolean
}

const MAIN_GROUP: DocsNavEntry[] = [
  {
    id: 'cc-switch',
    label: 'CC Switch',
    to: '/docs/install-cc-switch',
    icon: <ArrowRightLeft strokeWidth={2.1} />,
    lineIcon: true,
  },
  {
    id: 'codex-desktop',
    label: 'Codex Desktop',
    to: '/docs/install-codex-desktop',
    icon: <CodexGlyphIcon />,
  },
  {
    id: 'claude-desktop',
    label: 'Claude Desktop',
    to: '/docs/claude-desktop',
    icon: <ClaudeGlyphIcon />,
  },
  {
    id: 'claude-code',
    label: 'Claude Code CLI',
    to: '/docs/claude-code',
    icon: <ClaudeGlyphIcon />,
  },
  {
    id: 'codex-cli',
    label: 'Codex CLI',
    to: '/docs/codex-cli',
    icon: <CodexGlyphIcon />,
  },
  {
    id: 'cline',
    label: 'VSCode + Cline',
    to: '/docs/cline',
    icon: <ClineGlyphIcon />,
  },
  {
    id: 'cherry-studio',
    label: 'Cherry Studio',
    to: '/docs/cherry-studio',
    icon: <CherryStudioGlyphIcon />,
  },
  {
    id: 'openclaw',
    label: 'OpenClaw',
    to: '/docs/openclaw',
    icon: <OpenClawGlyphIcon />,
  },
]

const API_GROUP: DocsNavEntry[] = [
  {
    id: 'api-integration',
    label: 'API Integration',
    to: '/docs/api-integration',
    icon: <Braces strokeWidth={2.1} />,
    lineIcon: true,
  },
  {
    id: 'open-apis',
    label: 'Open APIs',
    to: '/docs/open-apis',
    icon: <Braces strokeWidth={2.1} />,
    lineIcon: true,
  },
]

const BILLING_GROUP: DocsNavEntry[] = [
  {
    id: 'billing-questions',
    label: 'Billing Questions',
    to: '/docs/billing-questions',
    icon: <WalletCards strokeWidth={2.1} />,
    lineIcon: true,
  },
]

function NavEntry(props: { entry: DocsNavEntry; active: DocsNavActiveId }) {
  const { t } = useTranslation()
  const entry = props.entry
  const icon = (
    <span
      className={cn('ico', entry.lineIcon && 'ico-line')}
      aria-hidden='true'
    >
      {entry.icon}
    </span>
  )

  if (entry.to && entry.id) {
    return (
      <Link
        to={entry.to}
        className={cn('toc-item', props.active === entry.id && 'is-active')}
        aria-current={props.active === entry.id ? 'page' : undefined}
      >
        {icon}
        <span>{t(entry.label)}</span>
      </Link>
    )
  }

  return (
    <span className='toc-item is-disabled' aria-disabled='true'>
      {icon}
      <span>{t(entry.label)}</span>
      <i className='doc-soon'>{t('Soon')}</i>
    </span>
  )
}

/** The clone docs left sidebar: "Quick Start for Agents" grouped list. */
export function DocsSidebarNav(props: { active: DocsNavActiveId }) {
  const { t } = useTranslation()

  return (
    <nav className='doc-toc' aria-label={t('Docs navigation')}>
      <div className='toc-group'>
        <div className='doc-toc-title'>{t('Quick Start for Agents')}</div>
        {MAIN_GROUP.map((entry) => (
          <NavEntry key={entry.label} entry={entry} active={props.active} />
        ))}
      </div>
      <div className='toc-group toc-group-standalone'>
        {API_GROUP.map((entry) => (
          <NavEntry key={entry.label} entry={entry} active={props.active} />
        ))}
      </div>
      <div className='toc-group'>
        {BILLING_GROUP.map((entry) => (
          <NavEntry key={entry.label} entry={entry} active={props.active} />
        ))}
      </div>
    </nav>
  )
}

/** Mobile top chips (clone `.doc-nav-m`), shown below 900px. */
export function DocsMobileNav(props: { active: DocsNavActiveId }) {
  const { t } = useTranslation()

  const chips: DocsNavEntry[] = [...MAIN_GROUP, ...API_GROUP]

  return (
    <nav className='doc-nav-m' aria-label={t('Mobile docs navigation')}>
      <div className='m-group-tabs'>
        <Link to='/docs/install-codex-desktop' className='m-group is-active'>
          {t('Integration')}
        </Link>
        <span className='m-group is-disabled' aria-disabled='true'>
          {t('Billing Questions')}
        </span>
      </div>
      <div className='m-sub-scroll'>
        {chips.map((entry) => {
          const icon = (
            <span
              className={cn('ico', entry.lineIcon && 'ico-line')}
              aria-hidden='true'
            >
              {entry.icon}
            </span>
          )
          if (entry.to && entry.id) {
            return (
              <Link
                key={entry.label}
                to={entry.to}
                className={cn(
                  'm-chip',
                  props.active === entry.id && 'is-active'
                )}
                aria-current={props.active === entry.id ? 'page' : undefined}
              >
                {icon}
                <span>{t(entry.label)}</span>
              </Link>
            )
          }
          return (
            <span
              key={entry.label}
              className='m-chip is-disabled'
              aria-disabled='true'
            >
              {icon}
              <span>{t(entry.label)}</span>
              <i className='doc-soon'>{t('Soon')}</i>
            </span>
          )
        })}
      </div>
    </nav>
  )
}
