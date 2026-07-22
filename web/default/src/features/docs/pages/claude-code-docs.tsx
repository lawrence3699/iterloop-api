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

const CLAUDE_ENV_SETUP = `export ANTHROPIC_BASE_URL="https://api.iter-loop.com"
export ANTHROPIC_AUTH_TOKEN="sk-your-iterloop-key"
export ANTHROPIC_API_KEY=""`

const MACOS_PERSIST = `cat >> ~/.zshrc <<'EOF'
export ANTHROPIC_BASE_URL="https://api.iter-loop.com"
export ANTHROPIC_AUTH_TOKEN="sk-your-iterloop-key"
export ANTHROPIC_API_KEY=""
EOF
source ~/.zshrc`

const WINDOWS_SETX = `setx ANTHROPIC_BASE_URL "https://api.iter-loop.com"
setx ANTHROPIC_AUTH_TOKEN "sk-your-iterloop-key"
setx ANTHROPIC_API_KEY ""`

const WINDOWS_PROFILE = `Add-Content $PROFILE @'
$env:ANTHROPIC_BASE_URL = "https://api.iter-loop.com"
$env:ANTHROPIC_AUTH_TOKEN = "sk-your-iterloop-key"
$env:ANTHROPIC_API_KEY = ""
'@`

const MODEL_OVERRIDE = `export ANTHROPIC_MODEL="claude-sonnet-5"`

export function ClaudeCodeDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='claude-code'
      title='Connect Claude Code CLI to IterLoop'
      description='Point Claude Code at the IterLoop Anthropic-compatible endpoint with three environment variables.'
    >
      <DocSection id='setup' title='Set the environment variables'>
        <p>
          {t(
            'Set these three variables in the shell that launches Claude Code, then start (or restart) it as usual.'
          )}
        </p>
        <CodeSample title='shell' value={CLAUDE_ENV_SETUP} />
        <DocNote>
          <p>
            {t(
              'Use ANTHROPIC_AUTH_TOKEN, not ANTHROPIC_API_KEY, for the IterLoop key. This is the standard pattern for third-party Anthropic-compatible gateways: it avoids the two variables colliding, since Claude Code otherwise prefers a set ANTHROPIC_API_KEY. Setting ANTHROPIC_API_KEY to an empty string keeps it out of the way.'
            )}
          </p>
        </DocNote>
      </DocSection>

      <DocSection id='persist' title='Persist across sessions'>
        <h3>macOS / Linux</h3>
        <p>
          {t(
            'Append the same three exports to your shell profile so every new terminal picks them up.'
          )}{' '}
          <code>~/.zshrc</code> {t('on the default macOS shell, or')}{' '}
          <code>~/.bashrc</code> {t('on bash.')}
        </p>
        <CodeSample title='Terminal' value={MACOS_PERSIST} />
        <h3>Windows</h3>
        <p>
          {t(
            'Use setx to persist the variables for future terminal sessions, then open a new terminal window (setx does not affect the current one).'
          )}
        </p>
        <CodeSample title='Command Prompt' value={WINDOWS_SETX} />
        <p>
          {t(
            'Or add them to your PowerShell profile so they load whenever PowerShell starts.'
          )}
        </p>
        <CodeSample title='PowerShell' value={WINDOWS_PROFILE} />
      </DocSection>

      <DocSection id='model' title='Optional: pin a specific model'>
        <p>
          {t(
            "Claude Code's default model ids already match IterLoop's catalog, so this step is optional. Set ANTHROPIC_MODEL only if you want to force a specific IterLoop model, such as claude-sonnet-5 or claude-fable-5."
          )}
        </p>
        <CodeSample title='shell' value={MODEL_OVERRIDE} />
      </DocSection>

      <DocSection id='verify' title='Verify the connection'>
        <ul>
          <li>
            <strong>{t('Use an active key')}</strong>{' '}
            {t('Create or copy one from Console → API Keys.')}
          </li>
          <li>
            <strong>{t('Check ANTHROPIC_API_KEY is empty')}</strong>{' '}
            {t(
              'A stray value there can take priority over ANTHROPIC_AUTH_TOKEN.'
            )}
          </li>
          <li>
            <strong>{t('Restart Claude Code')}</strong>{' '}
            {t(
              'Restart the CLI after changing environment variables so it picks up the new values.'
            )}
          </li>
        </ul>
      </DocSection>
      <DocsPager
        previous={{ label: 'Claude Desktop', to: '/docs/claude-desktop' }}
        next={{ label: 'Codex CLI', to: '/docs/codex-cli' }}
      />
    </DocsLayout>
  )
}
