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
import { CircleHelp } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { iterLoopConsoleUrl } from '@/lib/iterloop-host'

/**
 * Clone pricing hero — red "PAY-AS-YOU-GO" kicker, giant display headline
 * and the "Transparent pricing" card with the Buy credits CTA, reproduced
 * 1:1 from the captured iter-loop.com pricing page.
 */
export function PricingHero() {
  const { t } = useTranslation()

  return (
    <section
      className='motion-item relative overflow-hidden py-12 md:py-16'
      style={{ '--stagger-delay': '0ms' } as CSSProperties}
    >
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#fff7f2_0%,#fff8f1_50%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#1b1716_0%,#171413_50%,#121212_100%)]' />
      <div className='pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(18,18,18,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(18,18,18,0.05)_1px,transparent_1px)] [background-size:42px_42px] opacity-70 dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]' />
      <div className='pointer-events-none absolute top-10 -left-24 h-56 w-56 rounded-full bg-[#d0240f]/24 blur-3xl' />
      <div className='pointer-events-none absolute -right-20 bottom-8 h-48 w-48 rounded-full bg-[#ff9931]/32 blur-3xl' />

      <div className='relative mx-auto grid w-full max-w-6xl gap-6 px-4 md:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-end'>
        <div className='space-y-6 text-left'>
          <div className='inline-flex items-center rounded-full border border-[var(--color-brand-solid)] bg-[var(--color-brand-solid)] px-2 py-1 text-xs font-medium text-[var(--color-brand-text)] transition-colors'>
            {t('PAY-AS-YOU-GO')}
          </div>
          <h1 className='text-[clamp(2.15rem,6vw,4.9rem)] leading-[0.95] font-bold tracking-[-0.02em] text-[var(--text-primary)]'>
            {t('Pay less for every token')}
          </h1>
          <p className='max-w-2xl text-base leading-7 text-[var(--text-secondary)] md:text-lg md:leading-8'>
            <Trans
              i18nKey='Pay only for what you use. Model rates start at just <highlight>10%</highlight> of the official price — discounts applied automatically, per model.'
              components={{
                highlight: (
                  <span className='font-serif text-xl font-semibold text-[#d0240f] italic dark:text-[#ffb49a]' />
                ),
              }}
            />
          </p>
        </div>

        <div className='il-card overflow-hidden rounded-2xl p-0'>
          <div className='space-y-3 p-4 md:p-5'>
            <p className='inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm whitespace-nowrap text-[var(--text-secondary)]'>
              ⚡{' '}
              {t(
                'Transparent pricing · No subscriptions · No monthly minimums'
              )}
            </p>
            <div className='rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 text-sm text-[var(--text-secondary)]'>
              <p className='inline-flex items-center gap-1.5 text-base font-semibold text-[var(--text-primary)]'>
                {t('Up to 90% off official prices')}
                <span className='group relative inline-flex'>
                  <CircleHelp
                    className='size-4 cursor-help text-[var(--text-tertiary)]'
                    aria-label={t('Pricing help')}
                  />
                  <span className='pointer-events-none absolute top-[calc(100%+8px)] right-0 z-20 w-72 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-xs leading-5 font-normal text-[var(--text-secondary)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100'>
                    {t(
                      'Discounts vary by model and may change with upstream costs. See the live pricing table for current rates.'
                    )}
                  </span>
                </span>
              </p>
              <p className='mt-1 text-xs text-[var(--text-tertiary)]'>
                {t('Applied automatically by model.')}
              </p>
            </div>
            <p className='rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-secondary)]'>
              {t('Credits never expire · Buy credits anytime')}
            </p>
          </div>
          <div className='border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-surface)_80%,transparent)] p-4 md:p-5'>
            <a
              href={iterLoopConsoleUrl('/console/topup')}
              className='il-stateful inline-flex h-10 w-full items-center justify-center rounded-md border border-[var(--color-brand-solid)] bg-[var(--color-brand-solid)] px-4 text-sm font-medium whitespace-nowrap text-[var(--color-brand-text)]'
            >
              {t('Buy credits')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
