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
import { ExternalLink, KeyRound, RadioTower, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Footer } from '@/components/layout/components/footer'
import { PublicLayout } from '@/components/layout/components/public-layout'
import { Badge } from '@/components/ui/badge'

const API_BASE = 'https://api.iter-loop.com/v1'

const CODEX_CONFIG = `model = "gpt-5.5"
model_provider = "iterloop"
supports_websockets = false

[model_providers.iterloop]
base_url = "https://api.iter-loop.com/v1"
experimental_bearer_token = "sk-your-iterloop-key"
name = "IterLoop API"
wire_api = "responses"
requires_openai_auth = true`

const CLAUDE_CONFIG = `export ANTHROPIC_BASE_URL="https://api.iter-loop.com"
export ANTHROPIC_AUTH_TOKEN="sk-your-iterloop-key"
export ANTHROPIC_API_KEY=""`

const GROK_OPENAI_CONFIG = `from openai import OpenAI

client = OpenAI(
    base_url="https://api.iter-loop.com/v1",
    api_key="sk-your-iterloop-key",
)
response = client.responses.create(model="grok-4.5", input="Say hello")
print(response.output_text)`

const GROK_CODEX_CONFIG = `model = "grok-4.5"
model_provider = "iterloop-grok"
supports_websockets = false

[model_providers.iterloop-grok]
base_url = "https://api.iter-loop.com/v1"
experimental_bearer_token = "sk-your-iterloop-key"
name = "IterLoop Grok"
wire_api = "responses"
requires_openai_auth = true`

const CURL_EXAMPLE = `curl https://api.iter-loop.com/v1/responses \\
  -H "Authorization: Bearer sk-your-iterloop-key" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-5.5","input":"Say hello in one sentence."}'`

export function IterLoopDocs() {
  const { t } = useTranslation()
  return (
    <PublicLayout showMainContainer={false}>
      <main className='pt-11'>
        <section className='border-b px-4 py-10 sm:px-6'>
          <div className='mx-auto max-w-[1320px]'>
            <p className='font-mono text-xs text-[#0071e3] uppercase'>
              {t('IterLoop API documentation')}
            </p>
            <h1 className='mt-3 text-4xl font-semibold'>
              {t('Connect Codex, Claude, and Grok')}
            </h1>
            <p className='text-muted-foreground mt-5 max-w-2xl text-base leading-7'>
              {t(
                'Use the key issued in your console. Model, IP, expiry, and quota permissions are enforced by that key.'
              )}
            </p>
            <div className='mt-8 flex max-w-2xl items-center justify-between gap-3 border-y py-4'>
              <div className='min-w-0'>
                <div className='text-muted-foreground font-mono text-[10px] uppercase'>
                  Base URL
                </div>
                <code className='mt-1 block truncate text-sm'>{API_BASE}</code>
              </div>
              <CopyButton value={API_BASE} tooltip={t('Copy Base URL')} />
            </div>
          </div>
        </section>

        <section className='px-4 py-10 sm:px-6'>
          <div className='mx-auto grid max-w-[1320px] gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(600px,760px)_180px]'>
            <aside className='lg:sticky lg:top-20 lg:self-start'>
              <div className='iterloop-section-label'>Documentation</div>
              <nav className='mt-4 border-t text-sm'>
                {[
                  [t('Quick start'), '#endpoints'],
                  [t('Compatible endpoints'), '#endpoints'],
                  ['Codex', '#codex'],
                  ['Claude Code', '#claude-code'],
                  ['Grok', '#grok'],
                  [t('Troubleshooting'), '#troubleshooting'],
                ].map(([label, href]) => (
                  <a
                    key={href + label}
                    href={href}
                    className='text-muted-foreground hover:text-primary block border-b py-3 transition-colors'
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </aside>

            <div className='min-w-0'>
              <DocSection
                id='endpoints'
                label='01'
                title={t('Compatible endpoints')}
              >
                <div className='border-t'>
                  {[
                    [
                      'POST',
                      '/v1/responses',
                      'Codex and Grok Responses API and SSE',
                    ],
                    ['POST', '/v1/chat/completions', 'OpenAI-compatible chat'],
                    [
                      'POST',
                      '/v1/messages',
                      'Anthropic-compatible Messages API',
                    ],
                    ['GET', '/v1/models', 'Models visible to the current key'],
                  ].map(([method, path, description]) => (
                    <div
                      key={path}
                      className='grid gap-2 border-b py-4 sm:grid-cols-[70px_210px_minmax(0,1fr)] sm:items-center'
                    >
                      <Badge variant='outline' className='w-fit font-mono'>
                        {method}
                      </Badge>
                      <code className='text-sm'>{path}</code>
                      <span className='text-muted-foreground text-sm'>
                        {t(description)}
                      </span>
                    </div>
                  ))}
                </div>
              </DocSection>

              <DocSection id='codex' label='02' title='Codex'>
                <p className='text-muted-foreground mb-5 text-sm leading-6'>
                  {t(
                    'Add this provider to the Codex config file. WebSockets stay disabled until their billing path is verified.'
                  )}
                </p>
                <CodeSample title='config.toml' value={CODEX_CONFIG} />
              </DocSection>

              <DocSection id='claude-code' label='03' title='Claude Code'>
                <p className='text-muted-foreground mb-5 text-sm leading-6'>
                  {t(
                    'Set these variables in the shell that launches Claude Code. Use a Claude-enabled or combined IterLoop key.'
                  )}
                </p>
                <CodeSample title='shell' value={CLAUDE_CONFIG} />
              </DocSection>

              <DocSection id='grok' label='04' title='Grok'>
                <p className='text-muted-foreground mb-5 text-sm leading-6'>
                  {t(
                    'Use a Grok-enabled key with the OpenAI SDK or the Codex Responses client. WebSocket and hosted search tools remain disabled.'
                  )}
                </p>
                <div className='grid gap-4'>
                  <CodeSample
                    title='Python · OpenAI SDK'
                    value={GROK_OPENAI_CONFIG}
                  />
                  <CodeSample
                    title='Codex · config.toml'
                    value={GROK_CODEX_CONFIG}
                  />
                </div>
              </DocSection>

              <DocSection
                id='direct-request'
                label='05'
                title={t('Direct request')}
              >
                <CodeSample title='curl' value={CURL_EXAMPLE} />
              </DocSection>

              <DocSection
                id='troubleshooting'
                label='06'
                title={t('Troubleshooting')}
              >
                <div className='border-t'>
                  {[
                    [
                      KeyRound,
                      '401 or invalid key',
                      'Confirm the full sk- key and that it is still enabled.',
                    ],
                    [
                      ShieldCheck,
                      '403 model or IP denied',
                      'Use a model and source IP allowed by the issued key.',
                    ],
                    [
                      RadioTower,
                      'Streaming stops early',
                      'Record the Request ID and check the usage log before retrying.',
                    ],
                  ].map(([Icon, title, description]) => {
                    const ItemIcon = Icon as typeof KeyRound
                    return (
                      <div
                        key={title as string}
                        className='grid gap-3 border-b py-5 sm:grid-cols-[36px_180px_minmax(0,1fr)]'
                      >
                        <ItemIcon className='text-primary size-5' />
                        <div className='text-sm font-medium'>
                          {t(title as string)}
                        </div>
                        <div className='text-muted-foreground text-sm leading-6'>
                          {t(description as string)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </DocSection>

              <a
                href='https://github.com/lawrence3699/iterloop-api'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary mt-10 inline-flex items-center gap-2 text-sm hover:underline'
              >
                {t('View the running AGPL source')}
                <ExternalLink className='size-4' />
              </a>
            </div>

            <aside className='hidden xl:sticky xl:top-20 xl:block xl:self-start'>
              <div className='iterloop-section-label'>{t('On this page')}</div>
              <nav className='mt-4 border-t text-sm'>
                {[
                  ['Endpoints', '#endpoints'],
                  ['Codex', '#codex'],
                  ['Claude Code', '#claude-code'],
                  ['Grok', '#grok'],
                  ['Direct request', '#direct-request'],
                  ['Troubleshooting', '#troubleshooting'],
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    className='text-muted-foreground hover:text-primary block border-b py-3 transition-colors'
                  >
                    {t(label)}
                  </a>
                ))}
              </nav>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </PublicLayout>
  )
}

function DocSection(props: {
  id: string
  label: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={props.id} className='scroll-mt-24 border-b py-10 first:pt-0'>
      <div className='mb-6 flex items-baseline gap-4'>
        <span className='text-primary font-mono text-xs'>{props.label}</span>
        <h2 className='text-2xl font-semibold sm:text-3xl'>{props.title}</h2>
      </div>
      {props.children}
    </section>
  )
}

function CodeSample(props: { title: string; value: string }) {
  return (
    <div className='overflow-hidden border bg-[#17171c] text-white'>
      <div className='flex items-center justify-between border-b border-white/10 px-4 py-2.5'>
        <span className='font-mono text-[10px] text-white/45 uppercase'>
          {props.title}
        </span>
        <CopyButton
          value={props.value}
          className='text-white/65 hover:bg-white/10 hover:text-white'
          tooltip={`Copy ${props.title}`}
        />
      </div>
      <pre className='overflow-x-auto p-4 font-mono text-xs leading-6 text-white/75'>
        {props.value}
      </pre>
    </div>
  )
}
