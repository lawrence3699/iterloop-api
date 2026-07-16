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
import useEmblaCarousel from 'embla-carousel-react'
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Globe2,
  KeyRound,
  RadioTower,
  ScrollText,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useEffect, useState, type WheelEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { HomeStoryMedia } from './home-story-media'

const CAPABILITIES = [
  {
    icon: KeyRound,
    title: 'Model-level permissions',
    body: 'Limit models, quota, expiry, and source IP without changing the client workflow.',
    tone: 'blue',
  },
  {
    icon: Gauge,
    title: 'Independent balances',
    body: 'Keep account and key usage visible without inventing subscription plans.',
    tone: 'green',
  },
  {
    icon: ShieldCheck,
    title: 'No prompt storage',
    body: 'Usage records keep operational metadata without request or response bodies.',
    tone: 'violet',
  },
  {
    icon: RadioTower,
    title: 'HTTP and SSE',
    body: 'Use stable non-streaming and streaming paths with verified usage accounting.',
    tone: 'orange',
  },
  {
    icon: Globe2,
    title: 'Chinese-first delivery',
    body: 'Generate clear client settings without leaking infrastructure terminology.',
    tone: 'cyan',
  },
  {
    icon: ScrollText,
    title: 'Metadata-only logging',
    body: 'Inspect tokens, latency, cost, status, and Request ID without storing prompt or response bodies.',
    tone: 'pink',
  },
]

export function HomeDifferenceShelf() {
  const { t } = useTranslation()
  const [viewportRef, embla] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  })
  const [canScrollPrevious, setCanScrollPrevious] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)

  const syncControls = useCallback(() => {
    if (!embla) return
    setCanScrollPrevious(embla.canScrollPrev())
    setCanScrollNext(embla.canScrollNext())
  }, [embla])

  useEffect(() => {
    if (!embla) return
    syncControls()
    embla.on('select', syncControls)
    embla.on('reInit', syncControls)
    return () => {
      embla.off('select', syncControls)
      embla.off('reInit', syncControls)
    }
  }, [embla, syncControls])

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (!embla || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      if (Math.abs(event.deltaX) < 8) return
      event.preventDefault()
      if (event.deltaX > 0) embla.scrollNext()
      else embla.scrollPrev()
    },
    [embla]
  )

  return (
    <section className='iterloop-home-section iterloop-difference-section'>
      <div className='iterloop-home-section-heading'>
        <h2>
          <span>{t('The IterLoop difference.')}</span>{' '}
          {t('Control without adding friction.')}
        </h2>
      </div>

      <div className='iterloop-difference-shell'>
        <div
          ref={viewportRef}
          className='iterloop-difference-viewport'
          onWheel={handleWheel}
        >
          <div className='iterloop-difference-track'>
            <div className='iterloop-difference-slide is-grid'>
              <div className='iterloop-difference-grid'>
                {CAPABILITIES.map((capability) => {
                  const Icon = capability.icon
                  return (
                    <article
                      key={capability.title}
                      className={`tone-${capability.tone}`}
                    >
                      <Icon aria-hidden='true' />
                      <h3>{t(capability.title)}</h3>
                      <p>{t(capability.body)}</p>
                    </article>
                  )
                })}
              </div>
            </div>

            <div className='iterloop-difference-slide is-feature'>
              <article className='iterloop-difference-feature tone-blue'>
                <div>
                  <span>{t('CONTROLLED ISSUE')}</span>
                  <h3>{t('Issue access without manual setup.')}</h3>
                  <p>
                    {t(
                      'Choose a profile, set quota and expiry, and deliver a sanitized client configuration in one flow.'
                    )}
                  </p>
                </div>
                <HomeStoryMedia scene='issuance' sizes='520px' />
              </article>
            </div>

            <div className='iterloop-difference-slide is-feature'>
              <article className='iterloop-difference-feature tone-light'>
                <div>
                  <span>{t('DIRECT DELIVERY')}</span>
                  <h3>{t('Configuration that is ready to use.')}</h3>
                  <p>
                    {t(
                      'Move from a verified model to Codex CLI, Claude Code, or an SDK with a few copied lines.'
                    )}
                  </p>
                </div>
                <HomeStoryMedia scene='config' sizes='520px' />
              </article>
            </div>
          </div>
        </div>
        <div className='iterloop-shelf-controls'>
          <button
            type='button'
            onClick={() => embla?.scrollPrev()}
            disabled={!canScrollPrevious}
            aria-label={t('Previous')}
          >
            <ChevronLeft />
          </button>
          <button
            type='button'
            onClick={() => embla?.scrollNext()}
            disabled={!canScrollNext}
            aria-label={t('Next')}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  )
}
