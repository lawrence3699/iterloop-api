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
import { ArrowRight, Check } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { Footer } from '@/components/layout/components/footer'
import { Button } from '@/components/ui/button'
import { iterLoopConsoleUrl, iterLoopPublicUrl } from '@/lib/iterloop-host'

import { HomeCategoryStrip } from './home-category-strip'
import { HomeConnectionShelf } from './home-connection-shelf'
import { HomeDifferenceShelf } from './home-difference-shelf'
import { HomeHeroMedia } from './home-hero-media'
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
        <div className='iterloop-hero-stage'>
          <motion.div
            className='iterloop-store-hero-copy'
            initial={initial}
            animate={animate}
            transition={REVEAL_TRANSITION}
          >
            <span className='iterloop-hero-brand'>IterLoop API</span>
            <h1 aria-label={t('One key, connected to the models you need.')}>
              <span>{t('One key.')}</span>
              {t('Connected to the models you need.')}
            </h1>
            <p>
              {t(
                'Codex, Claude, and mainstream agents are ready after one configuration. Pay only for actual usage.'
              )}
            </p>
            <div className='iterloop-hero-cta'>
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
                {props.isAuthenticated ? t('Open console') : t('Try it now')}
                <ArrowRight />
              </Button>
              <a href={iterLoopPublicUrl('/pricing')}>
                {t('View models and pricing')} <ArrowRight aria-hidden='true' />
              </a>
            </div>
            <div className='iterloop-hero-proof'>
              <span>
                <Check aria-hidden='true' />
                {t('Codex verified')}
              </span>
              <span>
                <Check aria-hidden='true' />
                {t('Claude verified')}
              </span>
            </div>
          </motion.div>

          <motion.div
            className='iterloop-hero-media-wrap'
            initial={reduceMotion ? false : { opacity: 0, x: 34, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              ...REVEAL_TRANSITION,
              delay: reduceMotion ? 0 : 0.12,
            }}
          >
            <HomeHeroMedia />
          </motion.div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...REVEAL_TRANSITION, delay: reduceMotion ? 0 : 0.2 }}
          className='iterloop-hero-categories'
        >
          <p>{t('Works with the clients you already use.')}</p>
          <HomeCategoryStrip />
        </motion.div>
      </section>
    </>
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
      <HomeConnectionShelf />
      <HomeScrollStory />
      <HomeDifferenceShelf />
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
