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
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Monitor,
  Rocket,
  Sparkles,
  SquareTerminal,
  Target,
} from 'lucide-react'
import { useCallback, useEffect, useState, type WheelEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { HomeStoryMedia } from './home-story-media'

type ConnectionStep = {
  id: 'client' | 'switch' | 'use'
  number: string
  title: string
  body: string
  icon: typeof Target
  tone: 'blue' | 'light' | 'dark'
}

const STEPS: ConnectionStep[] = [
  {
    id: 'client',
    number: '01',
    title: 'Choose a client',
    body: 'Choose Claude Code, Claude Desktop, Codex, or Hermes as the client you want to connect.',
    icon: Target,
    tone: 'blue',
  },
  {
    id: 'switch',
    number: '02',
    title: 'Import with CC Switch',
    body: 'Choose one-click connection on the token row, select the client and model, then open CC Switch.',
    icon: ClipboardCheck,
    tone: 'light',
  },
  {
    id: 'use',
    number: '03',
    title: 'Start using it',
    body: 'Return to the client and send a message. A normal reply means the connection is ready.',
    icon: Rocket,
    tone: 'dark',
  },
]

function ClientPickerVisual() {
  const clients = [
    { name: 'Claude Code', icon: Bot },
    { name: 'Claude Desktop', icon: Monitor },
    { name: 'Codex', icon: SquareTerminal },
    { name: 'Hermes', icon: Sparkles },
  ]

  return (
    <div className='iterloop-connection-client-picker'>
      {clients.map((client, index) => {
        const Icon = client.icon
        return (
          <div key={client.name} className={index === 2 ? 'is-selected' : ''}>
            <Icon aria-hidden='true' />
            <span>{client.name}</span>
            {index === 2 && <Check aria-hidden='true' />}
          </div>
        )
      })}
    </div>
  )
}

function CcSwitchVisual() {
  const { t } = useTranslation()

  return (
    <div className='iterloop-connection-switch-visual'>
      <HomeStoryMedia scene='keys' sizes='470px' />
      <div>
        <span>CC Switch</span>
        <strong>{t('Import this key')}</strong>
        <dl>
          <div>
            <dt>{t('Client')}</dt>
            <dd>Codex</dd>
          </div>
          <div>
            <dt>{t('Model')}</dt>
            <dd>gpt-5.6-sol</dd>
          </div>
        </dl>
        <small>
          <Check aria-hidden='true' />
          {t('Ready to open')}
        </small>
      </div>
    </div>
  )
}

function ReadyVisual() {
  const { t } = useTranslation()

  return (
    <div className='iterloop-connection-ready-visual'>
      <div>
        <span>{t('You')}</span>
        <p>{t('Give me a short API example.')}</p>
      </div>
      <div>
        <span>Codex</span>
        <code>const client = new OpenAI({'{'}</code>
        <code>
          &nbsp;&nbsp;baseURL: &apos;https://api.iter-loop.com/v1&apos;
        </code>
        <code>{'}'})</code>
      </div>
      <strong>
        <Check aria-hidden='true' />
        {t('Reply received. Connection ready.')}
      </strong>
    </div>
  )
}

function ConnectionVisual(props: { id: ConnectionStep['id'] }) {
  if (props.id === 'client') return <ClientPickerVisual />
  if (props.id === 'switch') return <CcSwitchVisual />
  return <ReadyVisual />
}

export function HomeConnectionShelf() {
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
    <section
      className='iterloop-home-section iterloop-connection-section'
      id='integrations'
    >
      <div className='iterloop-home-section-heading'>
        <h2>
          <span>{t('Three steps, ready to use.')}</span>{' '}
          {t('From sign-up to first reply in under two minutes.')}
        </h2>
        <p>{t('Mainstream agents can be configured in one flow.')}</p>
      </div>

      <div
        className='iterloop-connection-shell'
        role='region'
        aria-label={t('Three-step connection guide')}
      >
        <div
          ref={viewportRef}
          className='iterloop-connection-viewport'
          onWheel={handleWheel}
        >
          <div className='iterloop-connection-track'>
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  className='iterloop-connection-slide'
                  key={step.id}
                  role='group'
                  aria-roledescription={t('Slide')}
                  aria-label={`${index + 1} / ${STEPS.length}`}
                >
                  <article className={`tone-${step.tone}`}>
                    <div className='iterloop-connection-copy'>
                      <div>
                        <span>{step.number}</span>
                        <Icon aria-hidden='true' />
                      </div>
                      <h3>{t(step.title)}</h3>
                      <p>{t(step.body)}</p>
                    </div>
                    <ConnectionVisual id={step.id} />
                  </article>
                </div>
              )
            })}
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
