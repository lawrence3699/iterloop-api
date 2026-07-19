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
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Copy,
  Download,
  MoreHorizontal,
  Plus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getApiKeys } from '@/features/keys/api'
import { ApiKeysDialogs } from '@/features/keys/components/api-keys-dialogs'
import {
  ApiKeysProvider,
  useApiKeys,
} from '@/features/keys/components/api-keys-provider'
import { API_KEY_STATUSES } from '@/features/keys/constants'
import { formatQuota } from '@/lib/format'

import { getSelfAnalytics } from '../api'

const BASE_URLS = {
  openai: 'https://api.iter-loop.com/v1',
  anthropic: 'https://api.iter-loop.com',
} as const

function EndpointCard() {
  const { t } = useTranslation()
  const [protocol, setProtocol] = useState<keyof typeof BASE_URLS>('openai')
  const baseURL = BASE_URLS[protocol]

  return (
    <section className='iterloop-endpoint-card'>
      <header>
        <div>
          <span>{t('Connection endpoint')}</span>
          <h2>{t('One key, two compatible protocols')}</h2>
        </div>
        <div
          className='iterloop-segmented-control'
          role='group'
          aria-label={t('API protocol')}
        >
          {(['openai', 'anthropic'] as const).map((item) => (
            <button
              key={item}
              type='button'
              className={protocol === item ? 'is-active' : undefined}
              aria-pressed={protocol === item}
              onClick={() => setProtocol(item)}
            >
              {item === 'openai' ? 'OpenAI' : 'Anthropic'}
            </button>
          ))}
        </div>
      </header>
      <div className='iterloop-endpoint-value'>
        <code>{baseURL}</code>
        <CopyButton value={baseURL} tooltip={t('Copy Base URL')} />
      </div>
      <p>
        {protocol === 'openai'
          ? t('Use for Responses API and OpenAI-compatible clients.')
          : t('Use for Claude Code and Anthropic Messages clients.')}
      </p>
    </section>
  )
}

function DesktopDownloadCard() {
  const { t } = useTranslation()
  return (
    <section className='iterloop-download-card'>
      <div>
        <span>{t('IterLoop Desktop')}</span>
        <h2>{t('Configure local coding agents in one click')}</h2>
        <p>{t('Windows and macOS public downloads are coming soon.')}</p>
      </div>
      <div>
        <Button disabled variant='outline'>
          <Download aria-hidden='true' />
          macOS · {t('Coming soon')}
        </Button>
        <Button disabled variant='outline'>
          <Download aria-hidden='true' />
          Windows · {t('Coming soon')}
        </Button>
      </div>
    </section>
  )
}

function ApiKeysTable() {
  const { t } = useTranslation()
  const apiKeys = useApiKeys()
  const keysQuery = useQuery({
    queryKey: ['console-api-keys', apiKeys.refreshTrigger],
    queryFn: () => getApiKeys({ p: 1, size: 100 }),
  })
  const analyticsQuery = useQuery({
    queryKey: ['console-api-key-request-counts'],
    queryFn: async () => {
      const endTimestamp = Math.floor(Date.now() / 1000)
      const response = await getSelfAnalytics({
        startTimestamp: endTimestamp - 31 * 24 * 60 * 60,
        endTimestamp,
      })
      return response.data?.by_token ?? []
    },
  })
  const requestCounts = useMemo(
    () =>
      new Map(
        (analyticsQuery.data ?? []).map((item) => [
          item.token_id,
          item.requests,
        ])
      ),
    [analyticsQuery.data]
  )
  const keys = keysQuery.data?.data?.items ?? []

  const copyKey = async (id: number) => {
    const key = await apiKeys.resolveRealKey(id)
    if (!key) return
    await navigator.clipboard.writeText(key)
    apiKeys.markKeyCopied(id)
    toast.success(t('Copied'))
  }

  return (
    <section className='iterloop-api-keys-table'>
      <header>
        <div>
          <span>{t('Credentials')}</span>
          <h2>{t('API Keys')}</h2>
        </div>
        <Button size='sm' onClick={() => apiKeys.setOpen('create')}>
          <Plus aria-hidden='true' />
          {t('Create API Key')}
        </Button>
      </header>
      <div className='iterloop-api-keys-table-scroll'>
        <table>
          <thead>
            <tr>
              <th>{t('Name')}</th>
              <th>{t('Status')}</th>
              <th>{t('Requests')}</th>
              <th>{t('Used')}</th>
              <th>{t('API Key')}</th>
              <th>
                <span className='sr-only'>{t('Actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => {
              const status = API_KEY_STATUSES[key.status]
              return (
                <tr key={key.id}>
                  <td>
                    <strong>{key.name}</strong>
                    <small>{key.group || t('Default group')}</small>
                  </td>
                  <td>
                    <span className='iterloop-key-status'>
                      <CheckCircle2 aria-hidden='true' />
                      {status ? t(status.label) : t('Unknown')}
                    </span>
                  </td>
                  <td>{requestCounts.get(key.id) ?? 0}</td>
                  <td>{formatQuota(key.used_quota)}</td>
                  <td>
                    <button
                      type='button'
                      className='iterloop-key-copy'
                      onClick={() => copyKey(key.id)}
                    >
                      <code>{key.key}</code>
                      <Copy aria-hidden='true' />
                      <span className='sr-only'>{t('Copy API Key')}</span>
                    </button>
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            aria-label={t('Actions')}
                          />
                        }
                      >
                        <MoreHorizontal aria-hidden='true' />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          onClick={() => {
                            apiKeys.setCurrentRow(key)
                            apiKeys.setOpen('update')
                          }}
                        >
                          {t('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant='destructive'
                          onClick={() => {
                            apiKeys.setCurrentRow(key)
                            apiKeys.setOpen('delete')
                          }}
                        >
                          {t('Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!keysQuery.isLoading && keys.length === 0 ? (
        <div className='iterloop-table-empty'>
          {t('Create your first API key to begin.')}
        </div>
      ) : null}
    </section>
  )
}

export function ApiKeysPanel() {
  return (
    <ApiKeysProvider>
      <div className='iterloop-dashboard-stack'>
        <div className='iterloop-api-key-intro-grid'>
          <EndpointCard />
          <DesktopDownloadCard />
        </div>
        <ApiKeysTable />
      </div>
      <ApiKeysDialogs />
    </ApiKeysProvider>
  )
}
