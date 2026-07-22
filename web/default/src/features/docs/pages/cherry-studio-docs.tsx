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

const PROVIDER_TYPES = [
  ['OpenAI', 'https://api.iter-loop.com/v1', 'gpt-5.5'],
  ['Anthropic', 'https://api.iter-loop.com', 'claude-sonnet-5'],
] as const

const EXAMPLE_MODELS = `gpt-5.5
claude-sonnet-5`

export function CherryStudioDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='cherry-studio'
      title='Connect Cherry Studio to IterLoop'
      description='Add IterLoop as a custom provider in Cherry Studio using either the OpenAI-compatible or Anthropic-compatible protocol.'
    >
      <DocSection id='setup' title='Add IterLoop as a custom provider'>
        <div className='ti-steps'>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              1
            </span>
            <p className='ti-step-t'>{t('Open Model Services settings')}</p>
            <div className='ti-step-body'>
              <p>
                {t(
                  'Click the Settings (gear) icon in the left nav, then open the Model Services tab.'
                )}
              </p>
            </div>
          </div>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              2
            </span>
            <p className='ti-step-t'>{t('Add a provider')}</p>
            <div className='ti-step-body'>
              <p>
                {t(
                  'Click "+ Add" below the provider list. In the Add Provider dialog, name it "IterLoop" and pick a Provider type: OpenAI, Gemini, Anthropic, or Azure OpenAI. Choose OpenAI or Anthropic depending on which protocol your setup expects.'
                )}
              </p>
            </div>
          </div>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              3
            </span>
            <p className='ti-step-t'>{t('Enter the API key and address')}</p>
            <div className='ti-step-body'>
              <p>
                {t(
                  'Fill in the API Key and API address (Base URL) for the protocol you picked, then click "Check" to verify the connection.'
                )}
              </p>
            </div>
          </div>
          <div className='ti-step'>
            <span className='ti-step-n' aria-hidden='true'>
              4
            </span>
            <p className='ti-step-t'>{t('Add model ids')}</p>
            <div className='ti-step-body'>
              <p>
                {t(
                  'Under Model management, click "+ Add" to manually enter each model id you want to expose. There is no auto-discovery for custom providers.'
                )}
              </p>
              <CodeSample title='Model ids' value={EXAMPLE_MODELS} />
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection id='protocol' title='OpenAI vs. Anthropic protocol'>
        <p>
          {t(
            'Pick the Provider type that matches the base URL and example model id below.'
          )}
        </p>
        <div className='ti-table-wrap'>
          <table className='ti-table'>
            <thead>
              <tr>
                <th>{t('Provider type')}</th>
                <th>{t('API address (Base URL)')}</th>
                <th>{t('Example model id')}</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDER_TYPES.map(([type, baseUrl, model]) => (
                <tr key={type}>
                  <td>{t(type)}</td>
                  <td>
                    <code>{baseUrl}</code>
                  </td>
                  <td>
                    <code>{model}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {t(
            'The recommended format needs no trailing path, such as /chat/completions; Cherry Studio appends it automatically.'
          )}
        </p>
        <p>
          {t('Use an active key from Console → API Keys as the API Key value.')}
        </p>
      </DocSection>

      <DocNote>
        <p>
          {t(
            'Cherry Studio\'s separate Agent feature only lists custom providers typed as Anthropic (or CherryIN) in its model picker. If you add IterLoop as an OpenAI-typed provider, it will work in normal chat but will not appear in the Agent model picker.'
          )}
        </p>
      </DocNote>

      <DocsPager
        previous={{ label: 'VSCode + Cline', to: '/docs/cline' }}
        next={{ label: 'OpenClaw', to: '/docs/openclaw' }}
      />
    </DocsLayout>
  )
}
