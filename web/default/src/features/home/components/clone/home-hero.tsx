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
import { ArrowRight, Check, ChevronDown, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { iterLoopConsoleUrl } from '@/lib/iterloop-host'

import { ClaudeCodeMark, CodexMark } from './clone-icons'

const PROTOCOLS = [
  { label: 'OpenAI protocol', url: 'https://api.iter-loop.com/v1' },
  { label: 'Anthropic protocol', url: 'https://api.iter-loop.com' },
] as const

function EndpointBar() {
  const { t } = useTranslation()
  const [protocolIndex, setProtocolIndex] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { copiedText, copyToClipboard } = useCopyToClipboard()

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  const protocol = PROTOCOLS[protocolIndex]
  const baseUrl = 'https://api.iter-loop.com'
  const suffix = protocol.url.slice(baseUrl.length)
  const copied = copiedText === protocol.url

  return (
    <div className='hc-endpoint-bar'>
      <div className='hc-endpoint-select-wrap' ref={menuRef}>
        <button
          type='button'
          aria-haspopup='listbox'
          aria-expanded={menuOpen}
          className='hc-endpoint-select il-stateful'
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>{t(protocol.label)}</span>
          <ChevronDown aria-hidden='true' />
        </button>
        {menuOpen && (
          <div className='hc-endpoint-menu' role='listbox'>
            {PROTOCOLS.map((option, index) => (
              <button
                key={option.label}
                type='button'
                role='option'
                aria-selected={index === protocolIndex}
                className='hc-endpoint-option'
                onClick={() => {
                  setProtocolIndex(index)
                  setMenuOpen(false)
                }}
              >
                <span>{t(option.label)}</span>
                {index === protocolIndex && (
                  <Check size={14} aria-hidden='true' />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type='button'
        className='hc-endpoint-copy il-stateful'
        aria-label={t('Copy Router Base URL')}
        onClick={() => void copyToClipboard(protocol.url)}
      >
        <span className='hc-endpoint-url'>
          {baseUrl}
          {suffix && <span className='hc-endpoint-url-suffix'>{suffix}</span>}
        </span>
        <span className='hc-endpoint-copy-icon'>
          {copied ? <Check aria-hidden='true' /> : <Copy aria-hidden='true' />}
        </span>
      </button>
    </div>
  )
}

export function HomeHero() {
  const { t } = useTranslation()

  return (
    <section className='hc-hero motion-item' style={{ '--stagger-delay': '0ms' } as React.CSSProperties}>
      <div className='hc-hero-layer hc-hero-bg' aria-hidden='true' />
      <div
        className='hc-hero-layer hc-hero-art'
        style={{ backgroundImage: "url('/media/clone/hero-art-bg.png')" }}
        aria-hidden='true'
      />
      <div className='hc-hero-layer hc-hero-band' aria-hidden='true' />
      <div className='hc-hero-layer hc-hero-grid' aria-hidden='true' />
      <div className='hc-hero-layer hc-hero-glows' aria-hidden='true'>
        <div className='hc-hero-glow-claude' />
        <div className='hc-hero-glow-codex' />
      </div>

      <div className='hc-hero-inner'>
        <div className='hc-hero-content'>
          <div
            className='home-hero-part hc-hero-part-center'
            style={{ '--hero-delay': '0ms' } as React.CSSProperties}
          >
            <span className='home-hero-eyebrow'>
              <span className='home-hero-eyebrow-dot' aria-hidden='true' />
              {t('Official models')}
              <span className='home-hero-eyebrow-sep' aria-hidden='true'>
                ·
              </span>
              {t('up to 90% off')}
            </span>
          </div>

          <h1 className='hc-hero-title'>
            <span
              className='home-hero-part hc-hero-title-row'
              style={{ '--hero-delay': '70ms' } as React.CSSProperties}
            >
              <span className='home-hero-ink'>{t('For your')}</span>
              <span className='hc-hero-products'>
                <span className='home-hero-product'>
                  <span className='home-hero-logo-tile'>
                    <ClaudeCodeMark className='hc-hero-tile-svg' />
                  </span>
                  <span className='hc-hero-claude-text'>Claude Code</span>
                </span>
                <span className='home-hero-product'>
                  <span className='home-hero-logo-tile'>
                    <CodexMark className='hc-hero-tile-svg' />
                  </span>
                  <span className='home-hero-codex-text'>Codex</span>
                </span>
              </span>
            </span>
            <span className='hc-hero-core'>
              <span
                className='home-hero-part home-hero-ink'
                style={
                  {
                    '--hero-delay': '140ms',
                    display: 'block',
                  } as React.CSSProperties
                }
              >
                {t('The native LLM router')}
              </span>
            </span>
          </h1>

          <div
            className='home-hero-part hc-endpoint-wrap'
            style={{ '--hero-delay': '210ms' } as React.CSSProperties}
          >
            <EndpointBar />
          </div>

          <div
            className='home-hero-part hc-hero-ctas'
            style={{ '--hero-delay': '280ms' } as React.CSSProperties}
          >
            <a
              href={iterLoopConsoleUrl('/sign-up')}
              className='il-btn-primary il-stateful hc-hero-cta-primary'
            >
              {t('Get API Key')}
              <ArrowRight className='hc-hero-cta-arrow' aria-hidden='true' />
            </a>
            <div className='hc-hero-download-wrap'>
              <div className='hc-nosetup-badge'>{t('No setup required')}</div>
              <Link to='/download' className='il-btn-outline il-stateful'>
                {t('Download app')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
