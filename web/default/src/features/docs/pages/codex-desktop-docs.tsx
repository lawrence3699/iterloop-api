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
import { useTranslation } from 'react-i18next'

import {
  CodeSample,
  DocNote,
  DocSection,
  DocsLayout,
  DocsPager,
} from '../components/docs-layout'
import { ScreenshotLightbox } from '../components/screenshot-lightbox'

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

export function CodexDesktopDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='codex-desktop'
      title='Connect Codex Desktop to IterLoop'
      description='Use the upcoming IterLoop Desktop app for one-click configuration, or connect Codex manually on macOS and Windows today.'
    >
      <DocSection
        id='app'
        title='One-click setup with the IterLoop client (recommended)'
      >
        <p>
          {t(
            'IterLoop Desktop is the official IterLoop client. It can download Codex Desktop, connect it to IterLoop, and apply the model configuration for you, so the whole setup can be finished in a few minutes.'
          )}
        </p>
        <div className='doc-note doc-note-download'>
          <div className='note-body'>
            <strong>IterLoop Desktop</strong>
            <p>
              {t('Public downloads for macOS and Windows are coming soon.')}
            </p>
          </div>
          <button type='button' className='btn btn-ghost' disabled>
            {t('Coming soon')}
          </button>
        </div>
        <DocNote>
          <p>
            {t(
              'Tip: If your system shows a risk warning during installation, choose trust or continue.'
            )}
          </p>
        </DocNote>
        <div className='ti-steps'>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              1
            </span>
            <p className='ti-step-t'>{t('Sign in')}</p>
            <div className='ti-step-body'>
              <p>{t('Use the same IterLoop account as the web console.')}</p>
              <ScreenshotLightbox
                src='/media/clone/docs-images/install-codex-desktop-iterloop-switch-register.png'
                alt={t('IterLoop client sign-in and registration screen')}
              />
            </div>
          </div>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              2
            </span>
            <p className='ti-step-t'>{t('Select Codex Desktop')}</p>
            <div className='ti-step-body'>
              <p>
                {t(
                  'The app detects supported local tools and prepares the correct Base URL.'
                )}
              </p>
              <ScreenshotLightbox
                src='/media/clone/docs-images/install-codex-desktop-one-click.png'
                alt={t('One-click connect button in the IterLoop client')}
              />
            </div>
          </div>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              3
            </span>
            <p className='ti-step-t'>{t('Apply configuration')}</p>
            <div className='ti-step-body'>
              <p>
                {t(
                  'Confirm once; the credential is stored in the operating system secure store.'
                )}
              </p>
              <ScreenshotLightbox
                src='/media/clone/docs-images/install-codex-desktop-usage.png'
                alt={t('Codex Desktop after connecting to IterLoop')}
              />
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection id='manual' title='Manual configuration'>
        <h3>macOS</h3>
        <p>
          {t(
            'Create the Codex config directory, then open the configuration file.'
          )}{' '}
          <code>~/.codex/config.toml</code>
        </p>
        <CodeSample title='Terminal' value={MACOS_COMMAND} />
        <h3>Windows</h3>
        <p>
          {t(
            'Create the Codex config directory, then open the configuration file.'
          )}{' '}
          <code>%USERPROFILE%\.codex\config.toml</code>
        </p>
        <CodeSample title='PowerShell' value={WINDOWS_COMMAND} />
        <DocNote>
          <p>
            {t(
              'Paste the same provider block on either operating system. Replace only the API key value.'
            )}
          </p>
        </DocNote>
        <CodeSample title='config.toml' value={CODEX_CONFIG} />
      </DocSection>

      <DocSection id='verify' title='Verify the connection'>
        <ul>
          <li>
            <strong>{t('Use an active key')}</strong>{' '}
            {t('Create or copy one from Console → API Keys.')}
          </li>
          <li>
            <strong>{t('Keep Responses API enabled')}</strong>{' '}
            {t('The IterLoop Codex provider uses wire_api = responses.')}
          </li>
          <li>
            <strong>{t('Restart Codex')}</strong>{' '}
            {t(
              'Restart the client after changing config.toml so it reloads the provider.'
            )}
          </li>
        </ul>
      </DocSection>
      <DocsPager
        previous={{ label: 'CC Switch', to: '/docs/install-cc-switch' }}
        next={{ label: 'Claude Desktop', to: '/docs/claude-desktop' }}
      />
    </DocsLayout>
  )
}
