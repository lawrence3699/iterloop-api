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
import { Download, Expand, KeyRound, Settings2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import {
  CodeSample,
  DocSection,
  DocsLayout,
  DocsPager,
} from '../components/docs-layout'

const CODEX_CONFIG = `model = "gpt-5.5"
model_provider = "iterloop"
supports_websockets = false

[model_providers.iterloop]
base_url = "https://api.iter-loop.com/v1"
experimental_bearer_token = "sk-your-iterloop-key"
name = "IterLoop API"
wire_api = "responses"
requires_openai_auth = true`

const MACOS_COMMAND = `mkdir -p ~/.codex
$EDITOR ~/.codex/config.toml`

const WINDOWS_COMMAND = `New-Item -ItemType Directory -Force "$env:USERPROFILE\\.codex"
notepad "$env:USERPROFILE\\.codex\\config.toml"`

function ScreenshotLightbox() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        window.requestAnimationFrame(() => triggerRef.current?.focus())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.requestAnimationFrame(() => closeRef.current?.focus())
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type='button'
        className='iterloop-doc-screenshot'
        onClick={() => setOpen(true)}
      >
        <img
          src='/iterloop-desktop-preview.svg'
          alt={t('IterLoop Desktop connections dashboard')}
          width='1400'
          height='900'
        />
        <span>
          <Expand aria-hidden='true' />
          {t('Open screenshot')}
        </span>
      </button>
      {open ? (
        <div
          className='iterloop-doc-lightbox'
          role='dialog'
          aria-modal='true'
          aria-label={t('IterLoop Desktop screenshot')}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setOpen(false)
              window.requestAnimationFrame(() => triggerRef.current?.focus())
            }
          }}
        >
          <button
            ref={closeRef}
            type='button'
            aria-label={t('Close')}
            onClick={() => {
              setOpen(false)
              window.requestAnimationFrame(() => triggerRef.current?.focus())
            }}
          >
            <X aria-hidden='true' />
          </button>
          <img
            src='/iterloop-desktop-preview.svg'
            alt={t('IterLoop Desktop connections dashboard')}
            width='1400'
            height='900'
          />
        </div>
      ) : null}
    </>
  )
}

export function CodexDesktopDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='desktop'
      eyebrow='Install · Codex Desktop'
      title='Connect Codex Desktop to IterLoop'
      description='Use the upcoming IterLoop Desktop app for one-click configuration, or connect Codex manually on macOS and Windows today.'
      sections={[
        { id: 'app', label: 'One-click app setup' },
        { id: 'manual', label: 'Manual configuration' },
        { id: 'verify', label: 'Verify the connection' },
      ]}
    >
      <DocSection id='app' number='01' title='One-click app setup'>
        <div className='iterloop-doc-callout'>
          <div>
            <Download aria-hidden='true' />
            <div>
              <strong>IterLoop Desktop</strong>
              <p>
                {t('Public downloads for macOS and Windows are coming soon.')}
              </p>
            </div>
          </div>
          <Button disabled>{t('Coming soon')}</Button>
        </div>
        <ol className='iterloop-doc-steps'>
          <li>
            <span>1</span>
            <div>
              <strong>{t('Sign in')}</strong>
              <p>{t('Use the same IterLoop account as the web console.')}</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>{t('Select Codex Desktop')}</strong>
              <p>
                {t(
                  'The app detects supported local tools and prepares the correct Base URL.'
                )}
              </p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>{t('Apply configuration')}</strong>
              <p>
                {t(
                  'Confirm once; the credential is stored in the operating system secure store.'
                )}
              </p>
            </div>
          </li>
        </ol>
        <ScreenshotLightbox />
      </DocSection>

      <DocSection id='manual' number='02' title='Manual configuration'>
        <div className='iterloop-doc-platform-grid'>
          <article>
            <span>macOS</span>
            <h3>~/.codex/config.toml</h3>
            <p>
              {t(
                'Create the Codex config directory, then open the configuration file.'
              )}
            </p>
            <CodeSample title='Terminal' value={MACOS_COMMAND} />
          </article>
          <article>
            <span>Windows</span>
            <h3>%USERPROFILE%\.codex\config.toml</h3>
            <p>
              {t(
                'Create the Codex config directory, then open the configuration file.'
              )}
            </p>
            <CodeSample title='PowerShell' value={WINDOWS_COMMAND} />
          </article>
        </div>
        <div className='iterloop-doc-config-block'>
          <div>
            <Settings2 aria-hidden='true' />
            <p>
              {t(
                'Paste the same provider block on either operating system. Replace only the API key value.'
              )}
            </p>
          </div>
          <CodeSample title='config.toml' value={CODEX_CONFIG} />
        </div>
      </DocSection>

      <DocSection id='verify' number='03' title='Verify the connection'>
        <div className='iterloop-doc-checklist'>
          <p>
            <KeyRound aria-hidden='true' />
            <span>
              <strong>{t('Use an active key')}</strong>
              {t('Create or copy one from Console → API Keys.')}
            </span>
          </p>
          <p>
            <Settings2 aria-hidden='true' />
            <span>
              <strong>{t('Keep Responses API enabled')}</strong>
              {t('The IterLoop Codex provider uses wire_api = responses.')}
            </span>
          </p>
          <p>
            <Download aria-hidden='true' />
            <span>
              <strong>{t('Restart Codex')}</strong>
              {t(
                'Restart the client after changing config.toml so it reloads the provider.'
              )}
            </span>
          </p>
        </div>
      </DocSection>
      <DocsPager
        next={{ label: 'API integration', to: '/docs/api-integration' }}
      />
    </DocsLayout>
  )
}
