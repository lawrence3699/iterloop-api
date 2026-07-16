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
  ArrowRightLeft,
  Bot,
  Braces,
  BrainCircuit,
  MessageSquare,
  Monitor,
  SquareTerminal,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { iterLoopPublicUrl } from '@/lib/iterloop-host'

type Category = {
  id: string
  label: string
  icon: typeof SquareTerminal
  tone: string
  href: string
}

const CATEGORIES: Category[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    icon: Bot,
    tone: 'blue',
    href: '/#integrations',
  },
  {
    id: 'claude-desktop',
    label: 'Claude Desktop',
    icon: Monitor,
    tone: 'orange',
    href: '/#integrations',
  },
  {
    id: 'codex',
    label: 'Codex',
    icon: SquareTerminal,
    tone: 'cyan',
    href: '/#integrations',
  },
  {
    id: 'hermes',
    label: 'Hermes',
    icon: BrainCircuit,
    tone: 'violet',
    href: '/#integrations',
  },
  {
    id: 'cc-switch',
    label: 'CC Switch',
    icon: ArrowRightLeft,
    tone: 'green',
    href: '/#integrations',
  },
  {
    id: 'openai-sdk',
    label: 'OpenAI SDK',
    icon: Braces,
    tone: 'sand',
    href: '/docs',
  },
  {
    id: 'anthropic-sdk',
    label: 'Anthropic SDK',
    icon: MessageSquare,
    tone: 'gray',
    href: '/docs',
  },
]

export function HomeCategoryStrip() {
  const { t } = useTranslation()

  return (
    <div className='iterloop-category-viewport'>
      <div className='iterloop-category-track'>
        {CATEGORIES.map((category) => {
          const Icon = category.icon
          const href = iterLoopPublicUrl(category.href)
          return (
            <a key={category.id} href={href} className='iterloop-category-item'>
              <span className={`iterloop-category-icon tone-${category.tone}`}>
                <Icon aria-hidden='true' />
              </span>
              <strong>{t(category.label)}</strong>
            </a>
          )
        })}
      </div>
    </div>
  )
}
