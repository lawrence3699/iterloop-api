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
import {
  ArrowRight,
  Check,
  CircleGauge,
  Code2,
  KeyRound,
  LockKeyhole,
  RadioTower,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Footer } from '@/components/layout/components/footer'
import { Button } from '@/components/ui/button'

const MODEL_ROWS = [
  ['gpt-5.5', 'Codex', '0.4x'],
  ['gpt-5.6-sol', 'Codex', '0.4x'],
  ['claude-sonnet-4-6', 'Claude', '0.7x'],
  ['grok-4.5', 'xAI', '1.0x'],
]

function ProductInterface() {
  const { t } = useTranslation()
  const navigation = [
    t('Overview'),
    t('API Keys'),
    t('Usage logs'),
    t('Issuance'),
    t('Upstream'),
  ]

  return (
    <div className='mx-auto w-full max-w-7xl overflow-hidden rounded-lg border border-[#c5d6ef] bg-white text-[#172033] shadow-[0_24px_70px_rgba(44,83,135,0.12)] dark:border-white/15 dark:bg-[#14243a] dark:text-white'>
      <div className='flex h-11 items-center justify-between border-b border-[#dce5f1] bg-[#f6f9ff] px-4 dark:border-white/10 dark:bg-[#102038]'>
        <div className='flex items-center gap-2 font-mono text-[11px] text-[#627087] dark:text-white/65'>
          <span className='size-2 rounded-full bg-[#68c49d]' />
          admin.iter-loop.com
        </div>
        <span className='font-mono text-[10px] text-[#6f7c90] dark:text-white/55'>
          {t('Upstream healthy')}
        </span>
      </div>
      <div className='grid h-[340px] grid-cols-1 overflow-hidden sm:h-[360px] md:h-[340px] md:grid-cols-[190px_minmax(0,1fr)]'>
        <aside className='hidden border-r border-[#dce5f1] bg-[#f6f9ff] p-4 md:block dark:border-white/10 dark:bg-[#102038]'>
          <div className='mb-8 flex items-center gap-2'>
            <img
              src='/logo.png'
              alt='IterLoop API'
              className='size-7 rounded-md'
            />
            <span className='font-display text-sm'>IterLoop API</span>
          </div>
          <div className='space-y-1 text-xs text-[#65738a] dark:text-white/60'>
            {navigation.map((item, index) => (
              <div
                key={item}
                className={
                  index === 3
                    ? 'rounded-md border border-[#c8daf5] bg-[#eaf3ff] px-2.5 py-2 text-[#164f9f] dark:border-white/15 dark:bg-[#24456e] dark:text-white'
                    : 'px-2.5 py-2'
                }
              >
                {item}
              </div>
            ))}
          </div>
        </aside>
        <div className='min-w-0 bg-white text-[#172033] dark:bg-[#14243a] dark:text-white'>
          <div className='flex items-center justify-between border-b border-[#dce5f1] px-4 py-3 sm:px-6 dark:border-white/10'>
            <div>
              <p className='font-mono text-[10px] text-[#778398] uppercase dark:text-white/50'>
                {t('Admin workspace')}
              </p>
              <h2 className='font-display text-lg sm:text-xl'>
                {t('API issuance')}
              </h2>
            </div>
            <div className='flex items-center gap-2 text-xs'>
              <span className='size-2 rounded-full bg-[#176b55]' />
              {t('183 active')}
            </div>
          </div>
          <div className='grid grid-cols-2 border-b border-[#dce5f1] lg:grid-cols-4 dark:border-white/10'>
            {[
              [t('Active accounts'), '183'],
              [t('5-hour remaining'), '78%'],
              [t('Weekly remaining'), '64%'],
              [t('Error accounts'), '3'],
            ].map(([label, value], index) => (
              <div
                key={label}
                className={`px-4 py-3 sm:px-6 ${index % 2 === 0 ? 'border-r' : ''} border-[#dce5f1] lg:border-r lg:last:border-r-0 dark:border-white/10`}
              >
                <div className='font-mono text-[10px] text-[#778398] uppercase dark:text-white/50'>
                  {label}
                </div>
                <div className='mt-1 font-mono text-lg'>{value}</div>
              </div>
            ))}
          </div>
          <div className='grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'>
            <div className='border-b border-[#dce5f1] p-4 sm:p-6 lg:border-r lg:border-b-0 dark:border-white/10'>
              <div className='mb-4 flex items-center justify-between'>
                <span className='font-display text-base'>
                  {t('Issue access')}
                </span>
                <span className='rounded bg-[#eaf3ff] px-2 py-1 font-mono text-[10px] text-[#1854aa] dark:bg-[#24456e] dark:text-[#c7ddff]'>
                  {t('Combined standard')}
                </span>
              </div>
              <div className='space-y-3'>
                <div className='border-b border-[#dce5f1] pb-2 dark:border-white/10'>
                  <div className='font-mono text-[10px] text-[#778398] dark:text-white/50'>
                    {t('Recipient email').toUpperCase()}
                  </div>
                  <div className='mt-1 text-sm'>client@example.com</div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='border-b border-[#dce5f1] pb-2 dark:border-white/10'>
                    <div className='font-mono text-[10px] text-[#778398] dark:text-white/50'>
                      {t('Account balance').toUpperCase()}
                    </div>
                    <div className='mt-1 text-sm'>¥ 3,000.00</div>
                  </div>
                  <div className='border-b border-[#dce5f1] pb-2 dark:border-white/10'>
                    <div className='font-mono text-[10px] text-[#778398] dark:text-white/50'>
                      {t('Expires').toUpperCase()}
                    </div>
                    <div className='mt-1 text-sm'>{t('90 days')}</div>
                  </div>
                </div>
                <div className='pt-1'>
                  {MODEL_ROWS.map(([model, provider, ratio]) => (
                    <div
                      key={model}
                      className='flex items-center justify-between border-b border-[#edf1f6] py-2 text-xs last:border-b-0 dark:border-white/10'
                    >
                      <span className='font-mono'>{model}</span>
                      <span className='text-[#778398] dark:text-white/50'>
                        {provider} · {ratio}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className='bg-[#17477f] p-4 text-white sm:p-6 dark:bg-[#0d3260]'>
              <div className='flex items-center justify-between border-b border-white/15 pb-3'>
                <span className='font-display text-base'>
                  {t('Client delivery')}
                </span>
                <span className='font-mono text-[10px] text-[#b8d3fa]'>
                  {t('Ready').toUpperCase()}
                </span>
              </div>
              <div className='space-y-4 pt-4 font-mono text-[11px] leading-5'>
                <div>
                  <div className='text-white/50'>BASE_URL</div>
                  <div className='break-all text-[#b8d5ff]'>
                    https://api.iter-loop.com/v1
                  </div>
                </div>
                <div>
                  <div className='text-white/50'>API_KEY</div>
                  <div>sk-iterloop-••••••••••••9a2f</div>
                </div>
                <pre className='overflow-hidden border-t border-white/15 pt-4 text-[10px] leading-5 text-white/75'>
                  {`model_provider = "iterloop"
supports_websockets = false

[model_providers.iterloop]
base_url = "https://api.iter-loop.com/v1"
wire_api = "responses"`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function IterLoopHome(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()

  return (
    <>
      <section className='bg-background overflow-hidden px-4 pt-24 pb-8 sm:px-6 sm:pt-28'>
        <div className='mx-auto max-w-7xl'>
          <div className='max-w-3xl'>
            <div className='mb-4 flex items-center gap-2 font-mono text-xs text-[#1863dc]'>
              <RadioTower className='size-4' />
              {t('Unified Codex, Claude, and Grok access').toUpperCase()}
            </div>
            <h1 className='font-display text-5xl leading-[1.02] font-normal sm:text-6xl md:text-7xl'>
              IterLoop API
            </h1>
            <p className='text-muted-foreground mt-5 max-w-2xl text-base leading-7 sm:text-lg'>
              {t(
                'One governed API surface for Codex, Claude, and Grok, with clear balances, scoped keys, auditable usage, and delivery-ready client configuration.'
              )}
            </p>
            <div className='mt-7 flex flex-wrap gap-3'>
              <Button
                size='lg'
                className='h-11 px-4'
                render={
                  <Link
                    to={props.isAuthenticated ? '/dashboard' : '/sign-up'}
                  />
                }
              >
                {props.isAuthenticated
                  ? t('Open console')
                  : t('Create account')}
                <ArrowRight />
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='h-11 px-4'
                render={<Link to='/pricing' />}
              >
                {t('View pricing')}
              </Button>
              <Button
                size='lg'
                variant='ghost'
                className='h-11 px-4'
                render={<Link to='/docs' />}
              >
                <Code2 />
                {t('API docs')}
              </Button>
            </div>
          </div>
          <div className='mt-8'>
            <ProductInterface />
          </div>
        </div>
      </section>

      <section className='border-y border-[#dce5f1] bg-[#f4f8ff] text-[#172033] dark:border-white/10 dark:bg-[#102038] dark:text-white'>
        <div className='mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4'>
          {[
            [t('Compatible endpoints'), 'Responses · Chat · Messages'],
            [t('Transport'), 'HTTP · SSE'],
            [t('Key policy'), t('Model · IP · Expiry')],
            [t('Usage records'), 'Token · Cost · Request ID'],
          ].map(([label, value], index) => (
            <div
              key={label}
              className={`min-w-0 py-6 ${index % 2 === 0 ? 'border-r' : ''} border-[#dce5f1] px-3 first:pl-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0 dark:border-white/10`}
            >
              <div className='font-mono text-[10px] text-[#778398] uppercase dark:text-white/50'>
                {label}
              </div>
              <div className='mt-2 text-sm font-medium'>{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className='bg-[#edf5ff] px-4 py-20 text-[#172a46] sm:px-6 dark:bg-[#142b49] dark:text-white'>
        <div className='mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]'>
          <div>
            <p className='font-mono text-xs text-[#1863dc] uppercase dark:text-[#9ec2ff]'>
              {t('Platform capabilities')}
            </p>
            <h2 className='font-display mt-4 text-4xl leading-tight sm:text-5xl'>
              {t('Permissions, usage, and delivery in one console.')}
            </h2>
          </div>
          <div className='border-t border-[#bcd0ed] dark:border-white/20'>
            {[
              [
                KeyRound,
                t('Scoped credentials'),
                t(
                  'Create Claude-only, Codex-only, Grok-only, or combined keys with model, IP, quota, and expiry limits.'
                ),
              ],
              [
                CircleGauge,
                t('Visible consumption'),
                t(
                  'Inspect requests, tokens, latency, cost, errors, and Request IDs without storing prompts or response bodies.'
                ),
              ],
              [
                ShieldCheck,
                t('Isolated operations'),
                t(
                  'Separate the user console, model traffic, and administration by hostname and role.'
                ),
              ],
            ].map(([Icon, title, copy]) => {
              const FeatureIcon = Icon as typeof KeyRound
              return (
                <div
                  key={title as string}
                  className='grid gap-3 border-b border-[#bcd0ed] py-6 sm:grid-cols-[40px_180px_minmax(0,1fr)] sm:items-start dark:border-white/20'
                >
                  <FeatureIcon className='size-5 text-[#1863dc] dark:text-[#9ec2ff]' />
                  <h3 className='text-base font-medium'>{title as string}</h3>
                  <p className='text-sm leading-6 text-[#5d6b80] dark:text-white/65'>
                    {copy as string}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className='bg-background px-4 py-20 sm:px-6'>
        <div className='mx-auto max-w-7xl'>
          <div className='mb-10 max-w-2xl'>
            <p className='font-mono text-xs text-[#1863dc] uppercase'>
              {t('Client compatibility')}
            </p>
            <h2 className='font-display mt-4 text-4xl sm:text-5xl'>
              {t('Keep the clients your team already uses.')}
            </h2>
          </div>
          <div className='grid border-t md:grid-cols-3'>
            {[
              [
                'Codex CLI',
                t(
                  'Responses API configuration with HTTP/SSE and WebSockets disabled until verified billing is available.'
                ),
              ],
              [
                'Claude Code',
                t(
                  'Anthropic-compatible Messages endpoint with a Claude-enabled or combined key.'
                ),
              ],
              [
                'OpenAI SDKs',
                t(
                  'Standard bearer authentication for chat completions, responses, and model discovery.'
                ),
              ],
            ].map(([title, copy], index) => (
              <div
                key={title}
                className={`border-b py-7 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 ${index === 2 ? 'md:border-b' : ''}`}
              >
                <Check className='mb-5 size-5 text-[#1863dc]' />
                <h3 className='font-display text-xl'>{title}</h3>
                <p className='text-muted-foreground mt-3 text-sm leading-6'>
                  {copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='border-y border-[#d3e1f4] bg-[#eaf3ff] px-4 py-16 text-[#172a46] sm:px-6 dark:border-white/10 dark:bg-[#183557] dark:text-white'>
        <div className='mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row sm:items-center'>
          <div className='max-w-2xl'>
            <LockKeyhole className='mb-4 size-6 text-[#1863dc] dark:text-[#9ec2ff]' />
            <h2 className='font-display text-3xl sm:text-4xl'>
              {t(
                'Start with a verified balance and a key limited to exactly what it should access.'
              )}
            </h2>
          </div>
          <Button
            size='lg'
            className='h-11 px-4'
            render={<Link to={props.isAuthenticated ? '/keys' : '/sign-up'} />}
          >
            {props.isAuthenticated ? t('Manage API keys') : t('Create account')}
            <ArrowRight />
          </Button>
        </div>
      </section>
      <Footer />
    </>
  )
}
