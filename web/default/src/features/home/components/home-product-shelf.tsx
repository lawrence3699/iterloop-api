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
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

import { HomeConsolePreview } from './home-console-preview'

type ProductCard = {
  id: string
  eyebrow: string
  title: string
  summary: string
  meta: string
  tone: 'dark' | 'light' | 'warm' | 'blue' | 'gray'
}

const PRODUCTS: ProductCard[] = [
  {
    id: 'codex',
    eyebrow: 'CODEX',
    title: 'gpt-5.5',
    summary: 'Built for long tasks, code changes, and agent workflows.',
    meta: 'Responses · 0.4x',
    tone: 'dark',
  },
  {
    id: 'console',
    eyebrow: 'ONE CONSOLE',
    title: 'IterLoop API',
    summary: 'Manage models, balances, keys, and requests in one workspace.',
    meta: 'api.iter-loop.com/v1',
    tone: 'light',
  },
  {
    id: 'claude',
    eyebrow: 'CLAUDE',
    title: 'Sonnet 4.6',
    summary: 'A focused Claude lane for analysis and high-quality text work.',
    meta: 'Messages · 0.7x',
    tone: 'warm',
  },
  {
    id: 'delivery',
    eyebrow: 'DIRECT DELIVERY',
    title: 'Client configuration',
    summary: 'Generate settings for Codex CLI, Claude Code, and your SDK.',
    meta: 'Copy and use',
    tone: 'blue',
  },
  {
    id: 'grok',
    eyebrow: 'GROK',
    title: 'Official channel',
    summary:
      'Shown only after the funded official channel passes verification.',
    meta: 'Preparing',
    tone: 'gray',
  },
]

const DELIVERY_CONFIGURATION = `model_provider = "iterloop"
base_url = "https://api.iter-loop.com/v1"
wire_api = "responses"`

function ProductVisual(props: { id: string }) {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard()

  if (props.id === 'codex') {
    return (
      <div className='iterloop-product-terminal'>
        <span>
          <i />
          <i />
          <i />
        </span>
        <code>$ codex --model gpt-5.5</code>
        <strong>response.completed</strong>
        <p>18,420 tokens · 1.8s</p>
        <div>
          <span />
        </div>
      </div>
    )
  }

  if (props.id === 'console') {
    return (
      <div className='iterloop-product-console'>
        <HomeConsolePreview scene='keys' />
      </div>
    )
  }

  if (props.id === 'claude') {
    return (
      <div className='iterloop-product-messages'>
        <div>
          <MessageSquare />
          <span>Claude Code</span>
        </div>
        <div>
          <Code2 />
          <span>Messages API</span>
        </div>
        <div>
          <Check />
          <span>message_stop</span>
        </div>
      </div>
    )
  }

  if (props.id === 'delivery') {
    return (
      <div className='iterloop-product-config'>
        <div className='is-back' />
        <div className='is-front'>
          <span>model_provider</span>
          <b>iterloop</b>
          <span>base_url</span>
          <b>api.iter-loop.com/v1</b>
          <span>wire_api</span>
          <b>responses</b>
          <button
            type='button'
            onClick={() => copyToClipboard(DELIVERY_CONFIGURATION)}
            aria-label={
              copiedText === DELIVERY_CONFIGURATION
                ? t('Copied')
                : t('Copy configuration')
            }
          >
            {copiedText === DELIVERY_CONFIGURATION ? <Check /> : <Copy />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='iterloop-product-grok'>
      <Sparkles aria-hidden='true' />
      <strong>Grok</strong>
      <span>{t('Preparing')}</span>
    </div>
  )
}

export function HomeProductShelf() {
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

  return (
    <section
      className='iterloop-home-section iterloop-product-section'
      id='models'
    >
      <div className='iterloop-home-section-heading'>
        <h2>
          <span>{t('Available now.')}</span>{' '}
          {t('Choose the model for the work in front of you.')}
        </h2>
      </div>
      <div className='iterloop-shelf-shell'>
        <div ref={viewportRef} className='iterloop-shelf-viewport'>
          <div className='iterloop-shelf-track'>
            {PRODUCTS.map((product) => (
              <div
                className='iterloop-shelf-slide'
                key={product.id}
                id={product.id}
              >
                <article
                  className={cn(
                    'iterloop-product-card',
                    `tone-${product.tone}`
                  )}
                >
                  <div className='iterloop-product-copy'>
                    <span>{t(product.eyebrow)}</span>
                    <h3>{t(product.title)}</h3>
                    <p>{t(product.summary)}</p>
                    <code>{t(product.meta)}</code>
                  </div>
                  <ProductVisual id={product.id} />
                </article>
              </div>
            ))}
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
