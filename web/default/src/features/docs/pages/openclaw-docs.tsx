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

const OPENAI_PROVIDER = `{
  "providers": {
    "iterloop": {
      "baseUrl": "https://api.iter-loop.com/v1",
      "api": "openai-completions",
      "apiKey": "sk-your-iterloop-key"
    }
  }
}`

const ANTHROPIC_PROVIDER = `{
  "providers": {
    "iterloop-claude": {
      "baseUrl": "https://api.iter-loop.com",
      "api": "anthropic-messages",
      "apiKey": "sk-your-iterloop-key"
    }
  }
}`

export function OpenClawDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='openclaw'
      title='Connect OpenClaw to IterLoop'
      description='Register IterLoop as a custom model provider in OpenClaw, the open-source personal AI agent runtime.'
    >
      <DocSection id='overview' title='About OpenClaw'>
        <p>
          {t(
            'OpenClaw is an open-source personal AI assistant and agent runtime that runs locally as a CLI with a companion desktop app. It includes a coding-agent skill that can wrap external coding CLIs, and it lets you register custom OpenAI-compatible or Anthropic-compatible model providers.'
          )}
        </p>
      </DocSection>

      <DocSection id='provider' title='Add IterLoop as a custom provider'>
        <p>
          {t(
            'OpenClaw provider entries generally take a base URL and an API type. Use one of the two shapes below depending on whether you want OpenAI-compatible or Anthropic-compatible routing.'
          )}
        </p>
        <h3>{t('OpenAI-compatible (openai-completions)')}</h3>
        <CodeSample title='provider config' value={OPENAI_PROVIDER} />
        <h3>{t('Anthropic-compatible (anthropic-messages)')}</h3>
        <CodeSample title='provider config' value={ANTHROPIC_PROVIDER} />
        <DocNote>
          <p>
            {t(
              'The field names and file location above are the general shape reported for OpenClaw provider configuration, not a guarantee. OpenClaw is a newer, fast-moving project, so confirm the exact config file path and field names against the current docs at docs.openclaw.ai before relying on this example.'
            )}
          </p>
        </DocNote>
      </DocSection>

      <DocSection id='models' title='Choose a model'>
        <ul>
          <li>
            <strong>{t('OpenAI-compatible provider')}</strong>{' '}
            {t('Use a model id such as gpt-5.5.')}
          </li>
          <li>
            <strong>{t('Anthropic-compatible provider')}</strong>{' '}
            {t('Use a model id such as claude-sonnet-5.')}
          </li>
        </ul>
      </DocSection>

      <DocSection id='verify' title='Verify the connection'>
        <ul>
          <li>
            <strong>{t('Use an active key')}</strong>{' '}
            {t('Create or copy one from Console → API Keys.')}
          </li>
          <li>
            <strong>{t('Match the base URL to the API type')}</strong>{' '}
            {t(
              'Use the /v1 base URL with the OpenAI-compatible type, or the base URL without /v1 with the Anthropic-compatible type. Mixing the two will cause request errors.'
            )}
          </li>
          <li>
            <strong>{t('Reload OpenClaw')}</strong>{' '}
            {t(
              'Restart OpenClaw or reload its configuration after editing the provider entry.'
            )}
          </li>
        </ul>
      </DocSection>
      <DocsPager
        previous={{ label: 'Cherry Studio', to: '/docs/cherry-studio' }}
        next={{ label: 'API Integration', to: '/docs/api-integration' }}
      />
    </DocsLayout>
  )
}
