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
import {
  Activity,
  Bot,
  Braces,
  KeyRound,
  MessageSquare,
  RadioTower,
  ScrollText,
  Sparkles,
  SquareTerminal,
  Ticket,
  Workflow,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { iterLoopConsoleUrl, iterLoopPublicUrl } from '@/lib/iterloop-host'

type Category = {
  id: string
  label: string
  icon: typeof SquareTerminal
  tone: string
  href: string
  console?: boolean
  preparing?: boolean
}

const CATEGORIES: Category[] = [
  {
    id: 'codex',
    label: 'Codex',
    icon: SquareTerminal,
    tone: 'blue',
    href: '/#codex',
  },
  {
    id: 'claude',
    label: 'Claude',
    icon: MessageSquare,
    tone: 'orange',
    href: '/#claude',
  },
  {
    id: 'grok',
    label: 'Grok',
    icon: Sparkles,
    tone: 'gray',
    href: '/#grok',
    preparing: true,
  },
  {
    id: 'responses',
    label: 'Responses',
    icon: Braces,
    tone: 'cyan',
    href: '/#integrations',
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: Workflow,
    tone: 'violet',
    href: '/#integrations',
  },
  {
    id: 'sse',
    label: 'HTTP / SSE',
    icon: RadioTower,
    tone: 'green',
    href: '/docs',
  },
  {
    id: 'keys',
    label: 'API Key',
    icon: KeyRound,
    tone: 'blue',
    href: '/keys',
    console: true,
  },
  {
    id: 'logs',
    label: 'Usage logs',
    icon: Activity,
    tone: 'orange',
    href: '/usage-logs/common',
    console: true,
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    icon: Bot,
    tone: 'sand',
    href: '/docs',
  },
  {
    id: 'codex-cli',
    label: 'Codex CLI',
    icon: ScrollText,
    tone: 'gray',
    href: '/docs',
  },
  {
    id: 'credit',
    label: 'Redeem credit',
    icon: Ticket,
    tone: 'pink',
    href: '/wallet',
    console: true,
  },
]

export function HomeCategoryStrip() {
  const { t } = useTranslation()

  return (
    <div className='iterloop-category-viewport'>
      <div className='iterloop-category-track'>
        {CATEGORIES.map((category) => {
          const Icon = category.icon
          const href = category.console
            ? iterLoopConsoleUrl(category.href)
            : iterLoopPublicUrl(category.href)
          return (
            <a key={category.id} href={href} className='iterloop-category-item'>
              <span className={`iterloop-category-icon tone-${category.tone}`}>
                <Icon aria-hidden='true' />
              </span>
              <strong>{t(category.label)}</strong>
              {category.preparing && <small>{t('Preparing')}</small>}
            </a>
          )
        })}
      </div>
    </div>
  )
}
