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
  ArrowRight,
  Check,
  Code2,
  Copy,
  Gauge,
  Globe2,
  KeyRound,
  LockKeyhole,
  RadioTower,
  ScrollText,
  ShieldCheck,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { Footer } from '@/components/layout/components/footer'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { iterLoopConsoleUrl, iterLoopPublicUrl } from '@/lib/iterloop-host'

import { HomeCategoryStrip } from './home-category-strip'
import { HomeProductShelf } from './home-product-shelf'
import { HomeScrollStory } from './home-scroll-story'

const REVEAL_TRANSITION = {
  duration: 0.68,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
}

function Hero(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const initial = reduceMotion ? false : { opacity: 0, y: 26 }
  const animate = { opacity: 1, y: 0 }

  return (
    <>
      <div className='iterloop-announcement'>
        <span>
          {t(
            'Codex and Claude are verified. Grok official access is preparing.'
          )}
        </span>
        <a href={iterLoopPublicUrl('/pricing')}>
          {t('View models and pricing')} <ArrowRight aria-hidden='true' />
        </a>
      </div>
      <section className='iterloop-store-hero'>
        <div className='iterloop-store-hero-copy'>
          <motion.h1
            initial={initial}
            animate={animate}
            transition={REVEAL_TRANSITION}
          >
            IterLoop API
          </motion.h1>
          <motion.div
            initial={initial}
            animate={animate}
            transition={{
              ...REVEAL_TRANSITION,
              delay: reduceMotion ? 0 : 0.08,
            }}
          >
            <h2>{t('One key, connected to the models you need.')}</h2>
            <p>
              {t(
                'Pay for actual usage. Use verified Codex and Claude models through one controlled API surface.'
              )}
            </p>
            <div>
              <a href={iterLoopPublicUrl('/pricing')}>
                {t('View models and pricing')} <ArrowRight aria-hidden='true' />
              </a>
              <a href={iterLoopPublicUrl('/docs')}>
                {t('Read integration docs')} <ArrowRight aria-hidden='true' />
              </a>
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...REVEAL_TRANSITION, delay: reduceMotion ? 0 : 0.16 }}
        >
          <HomeCategoryStrip />
        </motion.div>
        <div className='iterloop-hero-actions'>
          <Button
            size='lg'
            render={
              <a
                href={iterLoopConsoleUrl(
                  props.isAuthenticated ? '/dashboard' : '/sign-up'
                )}
              />
            }
          >
            {props.isAuthenticated ? t('Open console') : t('Create account')}
            <ArrowRight />
          </Button>
          <Button
            size='lg'
            variant='outline'
            render={<a href={iterLoopPublicUrl('/docs')} />}
          >
            {t('API docs')}
          </Button>
        </div>
      </section>
    </>
  )
}

function CapabilityGrid() {
  const { t } = useTranslation()
  const capabilities = [
    {
      icon: KeyRound,
      title: 'Model-level permissions',
      body: 'Create focused or combined keys with model, quota, expiry, and IP controls.',
      span: 'is-wide',
    },
    {
      icon: Gauge,
      title: 'Independent balances',
      body: 'Keep account and key usage visible without inventing subscription plans.',
    },
    {
      icon: ShieldCheck,
      title: 'No prompt storage',
      body: 'Usage records keep operational metadata without request or response bodies.',
    },
    {
      icon: RadioTower,
      title: 'HTTP and SSE',
      body: 'Use stable non-streaming and streaming paths with verified usage accounting.',
    },
    {
      icon: Globe2,
      title: 'Chinese-first delivery',
      body: 'Generate clear client settings without leaking infrastructure terminology.',
      span: 'is-wide',
    },
  ]

  return (
    <section className='iterloop-home-section iterloop-capability-section'>
      <div className='iterloop-home-section-heading'>
        <h2>
          <span>{t('The IterLoop difference.')}</span>{' '}
          {t('Control without adding friction.')}
        </h2>
      </div>
      <div className='iterloop-capability-grid'>
        {capabilities.map((capability) => {
          const Icon = capability.icon
          return (
            <article key={capability.title} className={capability.span}>
              <Icon aria-hidden='true' />
              <h3>{t(capability.title)}</h3>
              <p>{t(capability.body)}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function IntegrationSection() {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard()
  const integrations = [
    {
      icon: Code2,
      title: 'Codex CLI',
      summary: 'Responses API with HTTP and SSE.',
      code: 'model_provider = "iterloop"',
    },
    {
      icon: ScrollText,
      title: 'Claude Code',
      summary: 'Anthropic-compatible Messages endpoint.',
      code: 'ANTHROPIC_BASE_URL=https://api.iter-loop.com',
    },
    {
      icon: LockKeyhole,
      title: 'OpenAI and Anthropic SDKs',
      summary: 'Keep familiar clients and replace only the API settings.',
      code: 'base_url="https://api.iter-loop.com/v1"',
    },
  ]

  return (
    <section
      className='iterloop-home-section iterloop-integration-section'
      id='integrations'
    >
      <div className='iterloop-home-section-heading'>
        <h2>
          <span>{t('Ways to connect.')}</span>{' '}
          {t('Keep the tools already in your workflow.')}
        </h2>
      </div>
      <div className='iterloop-integration-grid'>
        {integrations.map((integration) => {
          const Icon = integration.icon
          return (
            <article key={integration.title}>
              <div>
                <Icon aria-hidden='true' />
                <span>{t('Ready to copy')}</span>
              </div>
              <h3>{integration.title}</h3>
              <p>{t(integration.summary)}</p>
              <pre>{integration.code}</pre>
              <button
                type='button'
                onClick={() => copyToClipboard(integration.code)}
                aria-label={
                  copiedText === integration.code
                    ? t('Copied')
                    : t('Copy configuration')
                }
              >
                {copiedText === integration.code ? (
                  <Check aria-hidden='true' />
                ) : (
                  <Copy aria-hidden='true' />
                )}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function TrustBand() {
  const { t } = useTranslation()
  const items = [
    [t('API status'), t('Operational')],
    [t('Protocols'), 'Responses · Chat · Messages'],
    [t('Transport'), 'HTTP · SSE'],
    [t('Logging'), t('Metadata only')],
  ]

  return (
    <section className='iterloop-trust-band' aria-label={t('Platform status')}>
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>
            <i />
            {value}
          </strong>
        </div>
      ))}
    </section>
  )
}

export function IterLoopHome(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  const footerColumns = [
    {
      title: 'Product',
      links: [
        { text: 'Models and pricing', href: iterLoopPublicUrl('/pricing') },
        { text: 'API Keys', href: iterLoopConsoleUrl('/keys') },
        { text: 'Usage logs', href: iterLoopConsoleUrl('/usage-logs/common') },
      ],
    },
    {
      title: 'Resources',
      links: [
        { text: 'API docs', href: iterLoopPublicUrl('/docs') },
        { text: 'Service status', href: 'https://api.iter-loop.com/healthz' },
        {
          text: 'Public pricing data',
          href: 'https://api.iter-loop.com/pricing.json',
        },
      ],
    },
    {
      title: 'Account',
      links: [
        { text: 'Sign in', href: iterLoopConsoleUrl('/sign-in') },
        { text: 'Create account', href: iterLoopConsoleUrl('/sign-up') },
        { text: 'Open console', href: iterLoopConsoleUrl('/dashboard') },
      ],
    },
    {
      title: 'Open source',
      links: [
        {
          text: 'Running source',
          href: 'https://github.com/lawrence3699/iterloop-api',
        },
        {
          text: 'Upstream project',
          href: 'https://github.com/QuantumNous/new-api',
        },
        {
          text: 'License',
          href: 'https://github.com/lawrence3699/iterloop-api/blob/iterloop/phase-1/LICENSE',
        },
      ],
    },
  ]

  return (
    <div className='iterloop-store-home'>
      <Hero isAuthenticated={props.isAuthenticated} />
      <HomeProductShelf />
      <HomeScrollStory />
      <CapabilityGrid />
      <IntegrationSection />
      <TrustBand />
      <section className='iterloop-home-cta'>
        <div>
          <Check aria-hidden='true' />
          <h2>
            {t('Start with a verified model and a key that fits the job.')}
          </h2>
        </div>
        <Button
          size='lg'
          render={
            <a
              href={iterLoopConsoleUrl(
                props.isAuthenticated ? '/keys' : '/sign-up'
              )}
            />
          }
        >
          {props.isAuthenticated ? t('Manage API keys') : t('Create account')}
          <ArrowRight />
        </Button>
      </section>
      <Footer
        name='IterLoop API'
        logo='/logo.png'
        columns={footerColumns}
        copyright={t('All rights reserved.')}
        className='iterloop-store-footer'
      />
    </div>
  )
}
