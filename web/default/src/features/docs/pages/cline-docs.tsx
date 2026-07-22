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

const OPENAI_COMPATIBLE_FIELDS = `Base URL: https://api.iter-loop.com/v1
API Key: sk-your-iterloop-key
Model ID: gpt-5.5`

const ANTHROPIC_FIELDS = `Base URL: https://api.iter-loop.com
Anthropic API Key: sk-your-iterloop-key
Model ID: claude-sonnet-5`

export function ClineDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='cline'
      title='Connect VSCode + Cline to IterLoop'
      description='Point the Cline extension at IterLoop using either its OpenAI Compatible provider or its Anthropic provider with a custom base URL.'
    >
      <DocSection
        id='openai-compatible'
        title='Option A: OpenAI Compatible provider'
      >
        <p>
          {t(
            'Open Cline in VS Code, click the gear icon to open settings, then choose OpenAI Compatible from the API Provider dropdown.'
          )}
        </p>
        <div className='ti-steps'>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              1
            </span>
            <p className='ti-step-t'>{t('Select the provider')}</p>
            <div className='ti-step-body'>
              <p>
                {t('In the API Provider dropdown, select OpenAI Compatible.')}
              </p>
            </div>
          </div>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              2
            </span>
            <p className='ti-step-t'>{t('Fill in the connection fields')}</p>
            <div className='ti-step-body'>
              <p>
                {t(
                  'Set Base URL, API Key, and Model to the values below. Create or copy the key from Console → API Keys.'
                )}
              </p>
            </div>
          </div>
        </div>
        <CodeSample title='Cline settings' value={OPENAI_COMPATIBLE_FIELDS} />
      </DocSection>

      <DocSection
        id='anthropic'
        title='Option B: Anthropic provider with a custom base URL'
      >
        <p>
          {t(
            'Alternatively, choose Anthropic from the API Provider dropdown, enable the custom base URL option, and point it at IterLoop instead.'
          )}
        </p>
        <div className='ti-steps'>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              1
            </span>
            <p className='ti-step-t'>{t('Select the provider')}</p>
            <div className='ti-step-body'>
              <p>
                {t(
                  'In the API Provider dropdown, select Anthropic, then check Use custom base URL.'
                )}
              </p>
            </div>
          </div>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              2
            </span>
            <p className='ti-step-t'>{t('Fill in the connection fields')}</p>
            <div className='ti-step-body'>
              <p>
                {t('Set Base URL and Anthropic API Key to the values below.')}
              </p>
            </div>
          </div>
        </div>
        <CodeSample title='Cline settings' value={ANTHROPIC_FIELDS} />
      </DocSection>

      <DocSection id='troubleshooting' title='Troubleshooting'>
        <DocNote>
          <p>
            {t(
              'The most common error is Model Not Found, caused by mistyping the Model ID. Copy model ids exactly as shown in Console → Pricing or Console → API Keys.'
            )}
          </p>
        </DocNote>
        <p>
          {t(
            'These two modes are separate API Provider dropdown selections, not one shared custom-endpoint toggle, so double-check which provider you selected before filling in the fields.'
          )}
        </p>
        <p>
          {t("Per Cline's own documentation at")}{' '}
          <code>docs.cline.bot/provider-config/openai-compatible</code>{' '}
          {t('and')} <code>docs.cline.bot/provider-config/anthropic</code>.
        </p>
      </DocSection>

      <DocsPager
        previous={{ label: 'Codex CLI', to: '/docs/codex-cli' }}
        next={{ label: 'Cherry Studio', to: '/docs/cherry-studio' }}
      />
    </DocsLayout>
  )
}
