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

const THIRD_PARTY_INFERENCE = `Base URL: https://api.iter-loop.com
Auth token: sk-your-iterloop-key`

export function ClaudeDesktopDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='claude-desktop'
      title='Connect Claude Desktop to IterLoop'
      description='Claude Desktop has two different surfaces, and only one of them can point at IterLoop today. Check which one you have before you start.'
    >
      <DocSection id='which-surface' title='Which surface are you using?'>
        <p>
          {t(
            'Claude Desktop is primarily a chat client tied to your Anthropic or Claude.ai account, with no custom endpoint option. Some newer builds also embed a coding-agent surface with its own developer settings, and that surface can be pointed at a third-party gateway like IterLoop.'
          )}
        </p>
        <ul>
          <li>
            <strong>{t('Standard chat window')}</strong>{' '}
            {t(
              'The conversation you sign into with your Claude account. This cannot be redirected to IterLoop.'
            )}
          </li>
          <li>
            <strong>{t('Embedded coding-agent view')}</strong>{' '}
            {t(
              'A Developer Mode surface found in some Claude Desktop builds, used for agentic coding sessions. This is the one IterLoop can plug into.'
            )}
          </li>
        </ul>
      </DocSection>

      <DocSection id='standard-chat' title='Standard chat: not supported'>
        <p>
          {t(
            'The ordinary Claude Desktop chat pane authenticates through OAuth against your Anthropic or Claude.ai account. There is no Base URL or API key field anywhere in that flow, so it cannot be redirected to IterLoop or any other endpoint.'
          )}
        </p>
        <DocNote>
          <p>
            {t(
              'If you just want to point a Claude-compatible client at IterLoop reliably today, use the Claude Code CLI guide in this sidebar instead. It accepts a custom base URL and API key directly.'
            )}
          </p>
        </DocNote>
      </DocSection>

      <DocSection
        id='developer-mode'
        title='Embedded coding-agent view: Configure Third-Party Inference'
      >
        <p>
          {t(
            'If your Claude Desktop build includes the coding-agent surface, it can route those agent requests through IterLoop.'
          )}
        </p>
        <div className='ti-steps'>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              1
            </span>
            <p className='ti-step-t'>{t('Enable Developer Mode')}</p>
            <div className='ti-step-body'>
              <p>
                {t('Open Help → Troubleshooting → Enable Developer Mode.')}
              </p>
            </div>
          </div>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              2
            </span>
            <p className='ti-step-t'>
              {t('Open Configure Third-Party Inference')}
            </p>
            <div className='ti-step-body'>
              <p>
                {t(
                  'A new Developer menu appears. Open Developer → Configure Third-Party Inference.'
                )}
              </p>
            </div>
          </div>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              3
            </span>
            <p className='ti-step-t'>{t('Enter the IterLoop gateway')}</p>
            <div className='ti-step-body'>
              <p>
                {t(
                  'Set the Base URL and paste an API key from Console → API Keys as the credential.'
                )}
              </p>
              <CodeSample
                title='Third-Party Inference'
                value={THIRD_PARTY_INFERENCE}
              />
            </div>
          </div>
        </div>
        <DocNote>
          <p>
            {t(
              'This feature may not be present in every Claude Desktop build or version. If you cannot find Developer Mode or Configure Third-Party Inference, your build likely does not include the embedded coding-agent surface yet, not that anything is misconfigured.'
            )}
          </p>
        </DocNote>
      </DocSection>

      <DocSection id='notes' title='Notes'>
        <ul>
          <li>
            <strong>{t('Scope of effect')}</strong>{' '}
            {t(
              'Configure Third-Party Inference only routes requests made inside the embedded coding-agent surface. It does not change the standalone chat conversation.'
            )}
          </li>
          <li>
            <strong>{t('Managed installs')}</strong>{' '}
            {t(
              'If your organization distributes and manages your Claude Desktop, its configuration takes precedence over this setting.'
            )}
          </li>
        </ul>
      </DocSection>
      <DocsPager
        previous={{ label: 'Codex Desktop', to: '/docs/install-codex-desktop' }}
        next={{ label: 'Claude Code CLI', to: '/docs/claude-code' }}
      />
    </DocsLayout>
  )
}
