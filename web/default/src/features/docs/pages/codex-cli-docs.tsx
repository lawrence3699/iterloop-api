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

const MACOS_COMMAND = `mkdir -p ~/.codex
$EDITOR ~/.codex/config.toml`

const WINDOWS_COMMAND = `New-Item -ItemType Directory -Force "$env:USERPROFILE\\.codex"
notepad "$env:USERPROFILE\\.codex\\config.toml"`

const CODEX_CONFIG = `model = "gpt-5.5"
model_provider = "iterloop"
supports_websockets = false

[model_providers.iterloop]
base_url = "https://api.iter-loop.com/v1"
experimental_bearer_token = "sk-your-iterloop-key"
name = "IterLoop API"
wire_api = "responses"
requires_openai_auth = true`

const ENV_KEY_ALTERNATIVE = `[model_providers.iterloop]
base_url = "https://api.iter-loop.com/v1"
env_key = "ITERLOOP_API_KEY"
name = "IterLoop API"
wire_api = "responses"
requires_openai_auth = true`

export function CodexCliDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='codex-cli'
      title='Connect Codex CLI to IterLoop'
      description='Point the Codex command-line tool at IterLoop by editing one configuration file, on macOS or Windows.'
    >
      <DocSection id='macos' title='macOS'>
        <p>
          {t(
            'Create the Codex config directory, then open the configuration file.'
          )}{' '}
          <code>~/.codex/config.toml</code>
        </p>
        <CodeSample title='Terminal' value={MACOS_COMMAND} />
      </DocSection>

      <DocSection id='windows' title='Windows'>
        <p>
          {t(
            'Create the Codex config directory, then open the configuration file.'
          )}{' '}
          <code>%USERPROFILE%\.codex\config.toml</code>
        </p>
        <CodeSample title='PowerShell' value={WINDOWS_COMMAND} />
      </DocSection>

      <DocSection id='config' title='Add the IterLoop provider'>
        <p>
          {t(
            'Paste the same provider block on either operating system. Replace only the API key value.'
          )}
        </p>
        <CodeSample title='config.toml' value={CODEX_CONFIG} />
        <DocNote>
          <p>
            {t(
              'Prefer not to store the key in plaintext? Use env_key instead of experimental_bearer_token to read the key from an environment variable at launch.'
            )}
          </p>
        </DocNote>
        <CodeSample title='config.toml (env_key alternative)' value={ENV_KEY_ALTERNATIVE} />
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
        previous={{ label: 'Claude Code CLI', to: '/docs/claude-code' }}
        next={{ label: 'VSCode + Cline', to: '/docs/cline' }}
      />
    </DocsLayout>
  )
}
