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

const AUTH_CURL = `curl https://api.iter-loop.com/v1/models \\
  -H "Authorization: Bearer sk-your-iterloop-key"`

const MODELS_RESPONSE = `{
  "success": true,
  "object": "list",
  "data": [
    {
      "id": "gpt-5.5",
      "object": "model",
      "created": 1700000000,
      "owned_by": "iterloop",
      "supported_endpoint_types": ["chat.completions", "responses"]
    },
    {
      "id": "claude-sonnet-5",
      "object": "model",
      "created": 1700000000,
      "owned_by": "iterloop",
      "supported_endpoint_types": ["messages"]
    }
  ]
}`

const ENDPOINTS = [
  ['Chat & Agents', 'GET', '/v1/models', 'Models visible to the current key'],
  ['Chat & Agents', 'GET', '/v1/models/:model', "Retrieve a single model's details"],
  ['Chat & Agents', 'POST', '/v1/messages', 'Anthropic-compatible Messages API'],
  ['Chat & Agents', 'POST', '/v1/chat/completions', 'OpenAI-compatible chat'],
  ['Chat & Agents', 'POST', '/v1/completions', 'OpenAI legacy completions'],
  ['Chat & Agents', 'POST', '/v1/responses', 'OpenAI Responses API and SSE'],
  ['Chat & Agents', 'POST', '/v1/responses/compact', 'Responses API with compact output'],
  ['Images', 'POST', '/v1/images/generations', 'Generate images from a text prompt'],
  ['Images', 'POST', '/v1/images/edits', 'Edit an existing image'],
  ['Audio', 'POST', '/v1/audio/transcriptions', 'Speech-to-text transcription'],
  ['Audio', 'POST', '/v1/audio/translations', 'Translate speech into English text'],
  ['Audio', 'POST', '/v1/audio/speech', 'Text-to-speech synthesis'],
  ['Embeddings & Rerank', 'POST', '/v1/embeddings', 'Generate text embeddings'],
  ['Embeddings & Rerank', 'POST', '/v1/rerank', 'Rerank documents by relevance'],
  ['Moderation', 'POST', '/v1/moderations', 'Classify content for policy violations'],
  ['Realtime', 'GET', '/v1/realtime', 'Realtime API over WebSocket'],
] as const

const REFERENCES = [
  ['/openapi.json', 'OpenAPI 3.1.0 document describing the live endpoint surface'],
  ['/.well-known/api-catalog', 'RFC 9264 linkset pointing to the OpenAPI document, pricing, and health check'],
  ['/healthz', 'Service health check'],
  ['/pricing.json', 'Machine-readable pricing data'],
] as const

export function OpenApisDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='open-apis'
      title='Open APIs'
      description='A reference for developers integrating directly with the IterLoop API, without a named client in between.'
    >
      <DocSection id='endpoints' title='Compatible endpoints'>
        <p>
          {t(
            'All endpoints are served under the base URL below. Paths match the OpenAI and Anthropic wire formats they are compatible with.'
          )}
        </p>
        <p>
          <code>https://api.iter-loop.com</code>
        </p>
        <div className='ti-table-wrap'>
          <table className='ti-table'>
            <thead>
              <tr>
                <th>{t('Category')}</th>
                <th>{t('Method')}</th>
                <th>{t('Path')}</th>
                <th>{t('Description')}</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map(([category, method, path, description]) => (
                <tr key={path}>
                  <td>{t(category)}</td>
                  <td>
                    <code>{method}</code>
                  </td>
                  <td>
                    <code>{path}</code>
                  </td>
                  <td>{t(description)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection id='auth' title='Authentication'>
        <p>
          {t(
            'Send your IterLoop key as a bearer token on every request, using a standard Authorization header.'
          )}
        </p>
        <CodeSample title='curl' value={AUTH_CURL} />
        <DocNote>
          <p>
            {t(
              'Compatibility note: the x-api-key and x-goog-api-key headers are also accepted for clients that default to those, and are internally normalized to the same bearer auth.'
            )}
          </p>
        </DocNote>
      </DocSection>

      <DocSection id='references' title='Machine-readable references'>
        <p>
          {t(
            'These endpoints describe the API itself and are useful for client generators, uptime checks, and pricing tools.'
          )}
        </p>
        <ul>
          {REFERENCES.map(([path, description]) => (
            <li key={path}>
              <code>{path}</code> — {t(description)}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id='models' title='Models'>
        <p>
          {t(
            'GET /v1/models returns the OpenAI-compatible list shape by default. Requesting it in Anthropic format instead returns data, first_id, has_more, and last_id.'
          )}
        </p>
        <CodeSample title='JSON' value={MODELS_RESPONSE} />
      </DocSection>

      <DocsPager
        previous={{ label: 'API Integration', to: '/docs/api-integration' }}
        next={{ label: 'Billing Questions', to: '/docs/billing-questions' }}
      />
    </DocsLayout>
  )
}
