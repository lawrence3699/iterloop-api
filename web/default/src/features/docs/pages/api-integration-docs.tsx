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

import { Badge } from '@/components/ui/badge'

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

const CLAUDE_CONFIG = `export ANTHROPIC_BASE_URL="https://api.iter-loop.com"
export ANTHROPIC_AUTH_TOKEN="sk-your-iterloop-key"
export ANTHROPIC_API_KEY=""`

const CURL_EXAMPLE = `curl https://api.iter-loop.com/v1/responses \\
  -H "Authorization: Bearer sk-your-iterloop-key" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-5.5","input":"Say hello in one sentence."}'`

export function ApiIntegrationDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='api'
      eyebrow='Reference · API integration'
      title='Connect Codex CLI, Claude Code, and your API client'
      description='Use one scoped IterLoop key with the Responses, Chat Completions, or Anthropic Messages protocol.'
      sections={[
        { id: 'endpoints', label: 'Compatible endpoints' },
        { id: 'codex-cli', label: 'Codex CLI' },
        { id: 'claude-code', label: 'Claude Code' },
        { id: 'direct', label: 'Direct API request' },
      ]}
    >
      <DocSection id='endpoints' number='01' title='Compatible endpoints'>
        <div className='iterloop-doc-endpoints'>
          {[
            ['POST', '/v1/responses', 'Codex Responses API and SSE'],
            ['POST', '/v1/chat/completions', 'OpenAI-compatible chat'],
            ['POST', '/v1/messages', 'Anthropic-compatible Messages API'],
            ['GET', '/v1/models', 'Models visible to the current key'],
          ].map(([method, path, description]) => (
            <div key={path}>
              <Badge variant='outline'>{method}</Badge>
              <code>{path}</code>
              <span>{t(description)}</span>
            </div>
          ))}
        </div>
      </DocSection>
      <DocSection id='codex-cli' number='02' title='Codex CLI'>
        <p className='iterloop-doc-copy'>
          {t(
            'Add the IterLoop provider to your Codex config file. WebSockets stay disabled until their billing path is verified.'
          )}
        </p>
        <CodeSample title='config.toml' value={CODEX_CONFIG} />
      </DocSection>
      <DocSection id='claude-code' number='03' title='Claude Code'>
        <p className='iterloop-doc-copy'>
          {t(
            'Set these variables in the shell that launches Claude Code. Use a Claude-enabled or combined IterLoop key.'
          )}
        </p>
        <CodeSample title='shell' value={CLAUDE_CONFIG} />
      </DocSection>
      <DocSection id='direct' number='04' title='Direct API request'>
        <p className='iterloop-doc-copy'>
          {t(
            'Send a standard Responses API request with the same key. The model whitelist and quota remain enforced server-side.'
          )}
        </p>
        <CodeSample title='curl' value={CURL_EXAMPLE} />
      </DocSection>
      <DocsPager
        previous={{ label: 'Codex Desktop', to: '/docs/install-codex-desktop' }}
      />
    </DocsLayout>
  )
}
