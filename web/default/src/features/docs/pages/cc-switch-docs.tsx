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

const CLAUDE_MANUAL = `Endpoint      https://api.iter-loop.com
API Key       sk-your-iterloop-key
Haiku model   claude-haiku-4-5-20251001
Sonnet model  claude-sonnet-4-6
Opus model    claude-opus-5`

const CODEX_MANUAL = `Endpoint      https://api.iter-loop.com/v1
API Key       sk-your-iterloop-key
Model         gpt-5.6-sol`

const IMPORT_LINK = `ccswitch://v1/import?resource=provider&app=claude&name=IterLoop
  &endpoint=https%3A%2F%2Fapi.iter-loop.com&apiKey=sk-your-iterloop-key
  &haikuModel=claude-haiku-4-5-20251001&sonnetModel=claude-sonnet-4-6
  &opusModel=claude-opus-5&enabled=true`

export function CcSwitchDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='cc-switch'
      title='One-click setup with CC Switch'
      description='Send an IterLoop key straight from the console into Claude Code or Codex — CC Switch writes the client config for you.'
    >
      <DocSection id='install' title='Install CC Switch'>
        <p>
          {t(
            'CC Switch is a free third-party desktop app that manages provider configurations for Claude Code, Codex and similar clients. Download it for macOS, Windows or Linux from'
          )}{' '}
          <a href='https://ccswitch.io' target='_blank' rel='noreferrer'>
            ccswitch.io
          </a>
          {t(', install it, and leave it running.')}
        </p>
        <DocNote>
          <p>
            {t(
              'CC Switch is not built by IterLoop. Install it only from its official site.'
            )}
          </p>
        </DocNote>
      </DocSection>

      <DocSection id='import' title='Import your key from the console'>
        <ul>
          <li>
            <strong>{t('Open Console → API Keys')}</strong>{' '}
            {t('Create a key first if you do not have one yet.')}
          </li>
          <li>
            <strong>{t('Click One-click setup on the key row')}</strong>{' '}
            {t(
              'It is also available under the ⋯ menu as "Import to CC Switch".'
            )}
          </li>
          <li>
            <strong>{t('Pick the client')}</strong>{' '}
            {t(
              'Claude Code uses the Anthropic endpoint; Codex uses the OpenAI-compatible one. That is the whole form — model fields sit under Advanced options and can be left alone.'
            )}
          </li>
          <li>
            <strong>{t('Confirm in CC Switch')}</strong>{' '}
            {t(
              'CC Switch opens and shows what it is about to import, including the endpoint and a masked key. Nothing is saved until you confirm.'
            )}
          </li>
          <li>
            <strong>{t('Enable the provider')}</strong>{' '}
            {t(
              'Select the imported IterLoop provider in CC Switch and enable it. CC Switch writes the settings into the client’s own config file.'
            )}
          </li>
        </ul>
      </DocSection>

      <DocSection id='manual' title='Adding it by hand'>
        <p>
          {t(
            'If you would rather add the provider yourself, these are exactly the values the one-click flow sends.'
          )}
        </p>
        <h3>Claude Code</h3>
        <CodeSample title='CC Switch' value={CLAUDE_MANUAL} />
        <DocNote>
          <p>
            {t(
              'No primary model is set on purpose. With it left empty, /model inside Claude Code reaches every Claude model your key allows; the three role models only map Claude Code’s haiku/sonnet/opus tiers onto our catalog.'
            )}
          </p>
          <p>
            {t(
              'The Anthropic endpoint is the bare domain — do not add /v1. Only the OpenAI-compatible endpoint used by Codex carries the /v1 suffix.'
            )}
          </p>
        </DocNote>
        <h3>Codex</h3>
        <CodeSample title='CC Switch' value={CODEX_MANUAL} />
        <DocNote>
          <p>
            {t(
              'Codex keeps a single model in its config file, so one default is written. Run codex -m <model> to use any of the others on your key.'
            )}
          </p>
        </DocNote>
      </DocSection>

      <DocSection id='troubleshooting' title='If nothing happens'>
        <ul>
          <li>
            <strong>{t('CC Switch is not installed')}</strong>{' '}
            {t(
              'The button hands the link to your operating system. With no app registered for it, the click does nothing — install CC Switch and try again.'
            )}
          </li>
          <li>
            <strong>{t('The browser blocked the link')}</strong>{' '}
            {t(
              'Use "Copy import link" in the dialog and paste the link into CC Switch, or into your browser address bar.'
            )}
          </li>
          <li>
            <strong>{t('Requests come back 401')}</strong>{' '}
            {t(
              'The key was disabled, deleted, or is out of quota. Check it under Console → API Keys.'
            )}
          </li>
        </ul>
        <p>{t('A copied import link looks like this:')}</p>
        <CodeSample title='deeplink' value={IMPORT_LINK} />
      </DocSection>

      <DocsPager
        next={{ label: 'Codex Desktop', to: '/docs/install-codex-desktop' }}
      />
    </DocsLayout>
  )
}
