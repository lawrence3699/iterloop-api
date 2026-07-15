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
  Check,
  FileText,
  KeyRound,
  LayoutDashboard,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IterLoopMark } from '@/components/iterloop-mark'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

export type ConsolePreviewScene = 'keys' | 'logs' | 'config'

type ConsolePreviewProps = {
  scene: ConsolePreviewScene
  className?: string
}

const MODELS = ['gpt-5.5', 'claude-sonnet-4-6', 'grok-4.5']
const CLIENT_CONFIGURATION = `model = "gpt-5.5"
model_provider = "iterloop"

[model_providers.iterloop]
base_url = "https://api.iter-loop.com/v1"
wire_api = "responses"
supports_websockets = false`

function PreviewSidebar(props: { scene: ConsolePreviewScene }) {
  const { t } = useTranslation()
  const items = [
    { id: 'overview', label: t('Overview'), icon: LayoutDashboard },
    { id: 'keys', label: t('API Keys'), icon: KeyRound },
    { id: 'logs', label: t('Usage logs'), icon: Activity },
    { id: 'config', label: t('API docs'), icon: FileText },
  ]

  return (
    <aside className='iterloop-preview-sidebar'>
      <div className='iterloop-preview-brand'>
        <IterLoopMark compact />
        <span>IterLoop API</span>
      </div>
      <nav>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className={cn(item.id === props.scene && 'is-active')}
            >
              <Icon aria-hidden='true' />
              <span>{item.label}</span>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

function KeysScene() {
  const { t } = useTranslation()
  return (
    <div className='iterloop-preview-content'>
      <div className='iterloop-preview-heading'>
        <div>
          <span>{t('Workspace')}</span>
          <h3>{t('API Keys')}</h3>
        </div>
        <button type='button'>{t('Create key')}</button>
      </div>
      <div className='iterloop-preview-metrics'>
        <div>
          <span>{t('Available balance')}</span>
          <strong>¥ 2,486.20</strong>
        </div>
        <div>
          <span>{t('Active keys')}</span>
          <strong>4</strong>
        </div>
        <div>
          <span>{t('Requests today')}</span>
          <strong>1,284</strong>
        </div>
      </div>
      <div className='iterloop-preview-table'>
        <div className='is-header'>
          <span>{t('Name')}</span>
          <span>{t('Models')}</span>
          <span>{t('Quota')}</span>
          <span>{t('Status')}</span>
        </div>
        {[
          ['Production Codex', 'gpt-5.5', '¥ 1,200', t('Active')],
          ['Claude research', 'Sonnet 4.6', '¥ 800', t('Active')],
          ['Team sandbox', '2 models', '¥ 300', t('Expires in 12 days')],
        ].map((row) => (
          <div key={row[0]}>
            <span>
              <b>{row[0]}</b>
              <small>sk-i••••••3f92</small>
            </span>
            <span className='font-mono'>{row[1]}</span>
            <span>{row[2]}</span>
            <span>
              <i />
              {row[3]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LogsScene() {
  const { t } = useTranslation()
  return (
    <div className='iterloop-preview-content'>
      <div className='iterloop-preview-heading'>
        <div>
          <span>{t('Observability')}</span>
          <h3>{t('Usage logs')}</h3>
        </div>
        <button type='button'>{t('Last 24 hours')}</button>
      </div>
      <div className='iterloop-preview-chart' aria-hidden='true'>
        {[32, 46, 40, 68, 58, 76, 54, 82, 72, 91, 66, 84].map((height) => (
          <span key={height} style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className='iterloop-preview-table iterloop-preview-log-table'>
        <div className='is-header'>
          <span>{t('Time')}</span>
          <span>{t('Model')}</span>
          <span>{t('Tokens')}</span>
          <span>{t('Result')}</span>
        </div>
        {[
          ['10:42:18', 'gpt-5.5', '18,420', '200 · 1.8s'],
          ['10:41:02', 'claude-sonnet-4-6', '9,834', '200 · 2.1s'],
          ['10:39:44', 'gpt-5.4', '4,262', '200 · 0.9s'],
        ].map((row) => (
          <div key={row[0]}>
            <span className='font-mono'>{row[0]}</span>
            <span className='font-mono'>{row[1]}</span>
            <span>{row[2]}</span>
            <span>
              <i />
              {row[3]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConfigScene() {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard()
  const isCopied = copiedText === CLIENT_CONFIGURATION

  return (
    <div className='iterloop-preview-content'>
      <div className='iterloop-preview-heading'>
        <div>
          <span>{t('Client delivery')}</span>
          <h3>{t('Connect your tools')}</h3>
        </div>
        <button
          type='button'
          onClick={() => copyToClipboard(CLIENT_CONFIGURATION)}
          aria-label={isCopied ? t('Copied') : t('Copy configuration')}
        >
          {isCopied && <Check aria-hidden='true' />}
          {isCopied ? t('Copied') : t('Copy configuration')}
        </button>
      </div>
      <div className='iterloop-preview-config-tabs'>
        <span className='is-active'>Codex</span>
        <span>Claude Code</span>
        <span>cURL</span>
      </div>
      <pre className='iterloop-preview-code'>{CLIENT_CONFIGURATION}</pre>
      <div className='iterloop-preview-models'>
        {MODELS.map((model, index) => (
          <span
            key={model}
            className={index === 2 ? 'is-preparing' : undefined}
          >
            <i />
            {model}
          </span>
        ))}
      </div>
    </div>
  )
}

export function HomeConsolePreview(props: ConsolePreviewProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('iterloop-console-preview', props.className)}>
      <div className='iterloop-preview-browser-bar'>
        <span>
          <i />
          <i />
          <i />
        </span>
        <code>console.iter-loop.com</code>
        <span className='iterloop-preview-health'>
          <i />
          API · {t('Operational')}
        </span>
      </div>
      <div className='iterloop-preview-body'>
        <PreviewSidebar scene={props.scene} />
        {props.scene === 'keys' && <KeysScene />}
        {props.scene === 'logs' && <LogsScene />}
        {props.scene === 'config' && <ConfigScene />}
      </div>
    </div>
  )
}
