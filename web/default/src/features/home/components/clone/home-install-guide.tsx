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
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { iterLoopPublicUrl } from '@/lib/iterloop-host'

// Install-config blocks captured 1:1 from the original homepage
// (design-reference/installTabs.ts). The highlighted API-key placeholder
// is rendered separately so it keeps the clone's red emphasis.
const CLAUDE_CODE_CONFIG_MAC = {
  before: `SHELL_RC="$HOME/.zshrc"; case "$SHELL" in *bash*) SHELL_RC="$HOME/.bashrc";; esac
cat >> "$SHELL_RC" <<'EOF'
export ANTHROPIC_BASE_URL=https://api.iter-loop.com
export ANTHROPIC_AUTH_TOKEN=`,
  keyPlaceholder: 'your IterLoop API Key',
  after: `
export ANTHROPIC_MODEL=claude-opus-4-8
export ANTHROPIC_DEFAULT_FABLE_MODEL=claude-fable-5
export ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-4-8
export ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-5
export ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-haiku-4-5
export CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-5
export CLAUDE_CODE_EFFORT_LEVEL=xhigh
EOF
source "$SHELL_RC"`,
}

const CLAUDE_CODE_CONFIG_WIN = {
  before: `setx ANTHROPIC_BASE_URL "https://api.iter-loop.com"
setx ANTHROPIC_AUTH_TOKEN "`,
  keyPlaceholder: 'your IterLoop API Key',
  after: `"
setx ANTHROPIC_MODEL "claude-opus-4-8"
setx ANTHROPIC_DEFAULT_SONNET_MODEL "claude-sonnet-5"
setx ANTHROPIC_DEFAULT_HAIKU_MODEL "claude-haiku-4-5"`,
}

const CODEX_CONFIG_MAC = {
  before: `export OPENAI_API_KEY="`,
  keyPlaceholder: 'your IterLoop API Key',
  after: `"

codex \\
  -c 'model_provider="iterloop"' \\
  -c 'model="gpt-5.4"' \\
  -c 'model_reasoning_effort="high"' \\
  -c 'model_providers.iterloop.name="IterLoop"' \\
  -c 'model_providers.iterloop.base_url="https://api.iter-loop.com/v1"' \\
  -c 'model_providers.iterloop.env_key="OPENAI_API_KEY"' \\
  -c 'model_providers.iterloop.wire_api="responses"'`,
}

const CODEX_CONFIG_WIN = {
  before: `setx OPENAI_API_KEY "`,
  keyPlaceholder: 'your IterLoop API Key',
  after: `"

codex -c model_provider="iterloop" -c model="gpt-5.4" ^
  -c model_providers.iterloop.name="IterLoop" ^
  -c model_providers.iterloop.base_url="https://api.iter-loop.com/v1" ^
  -c model_providers.iterloop.env_key="OPENAI_API_KEY" ^
  -c model_providers.iterloop.wire_api="responses"`,
}

const OPENCLAW_INSTALL_URL =
  'Read /skill.md and follow the instructions to install IterLoop'

type ConfigBlock = {
  before: string
  keyPlaceholder: string
  after: string
}

type DesktopTab = {
  kind: 'desktop'
  title: string
  description: string
  troubleLead: string
  guidePath: string
}

type CliTab = {
  kind: 'cli'
  title: string
  description: string
  configMac: ConfigBlock
  configWin: ConfigBlock
  steps: { title: string; desc: string }[]
  step1LinkText: string
  step1LinkPath: string
  step1Rest: string
}

type SkillTab = {
  kind: 'skill'
  title: string
  description: string
  steps: { title: string; desc: string }[]
}

type ProductTab = { name: string } & (DesktopTab | CliTab | SkillTab)

const PRODUCT_TABS: ProductTab[] = [
  {
    name: 'Codex Desktop',
    kind: 'desktop',
    title: 'Connect IterLoop to Codex Desktop',
    description:
      'Download the IterLoop app to install Codex and connect IterLoop in one click.',
    troubleLead: 'Trouble downloading or using Codex?',
    guidePath: '/docs/install-codex-desktop',
  },
  {
    name: 'Claude Desktop',
    kind: 'desktop',
    title: 'Connect IterLoop to Claude Desktop',
    description:
      'Download the IterLoop app to install Claude and connect IterLoop in one click.',
    troubleLead: 'Trouble downloading or using Claude?',
    guidePath: '/docs/install-claude-desktop',
  },
  {
    name: 'Claude Code CLI',
    kind: 'cli',
    title: 'Connect IterLoop to Claude Code',
    description:
      "Copy the environment variables below into your terminal so Claude Code routes through IterLoop's Anthropic-compatible gateway.",
    configMac: CLAUDE_CODE_CONFIG_MAC,
    configWin: CLAUDE_CODE_CONFIG_WIN,
    step1LinkText: 'Install Claude Code',
    step1LinkPath: '/docs/install-claude-code',
    step1Rest:
      ', create a IterLoop account, issue an API Key, and top up your balance.',
    steps: [
      {
        title: 'Copy config, paste in terminal',
        desc: 'Copy the block above and run it in your terminal before launching Claude Code. Persist it however you like.',
      },
      {
        title: 'Launch Claude Code, auto-route',
        desc: 'Claude Code will route through IterLoop. Check the dashboard for usage.',
      },
    ],
  },
  {
    name: 'Codex CLI',
    kind: 'cli',
    title: 'Connect IterLoop to Codex',
    description:
      "Use IterLoop's OpenAI-compatible gateway so Codex runs through the same balance and model-routing system.",
    configMac: CODEX_CONFIG_MAC,
    configWin: CODEX_CONFIG_WIN,
    step1LinkText: 'Install Codex',
    step1LinkPath: '/docs/install-codex',
    step1Rest:
      ', create a IterLoop account, issue an API Key, and top up your balance.',
    steps: [
      {
        title: 'Copy config, paste in terminal',
        desc: 'Copy the block above and run it in your terminal before launching Codex. Persist it however you like.',
      },
      {
        title: 'Launch Codex, auto-route',
        desc: 'Codex will route through IterLoop. Check the dashboard for usage.',
      },
    ],
  },
  {
    name: 'OpenClaw',
    kind: 'skill',
    title: 'Connect IterLoop to your Openclaw',
    description:
      'Use the official install URL below. Once installed, Openclaw can route to top LLM providers through a single managed gateway.',
    steps: [
      {
        title: 'Share the install URL',
        desc: 'Send the official skill.md link to your Openclaw workspace.',
      },
      {
        title: 'Auto installation',
        desc: 'Openclaw installs and validates the IterLoop skill package automatically.',
      },
      {
        title: 'Confirm default gateway',
        desc: 'Open the confirmation link and set IterLoop as your default routing gateway.',
      },
    ],
  },
]

const DOC_TABS = [
  { name: 'CC-Switch', path: '/docs/install-cc-switch' },
  { name: 'WorkBuddy', path: '/docs/install-workbuddy' },
  { name: 'Other', path: '/docs' },
]

function AppleLogo() {
  return (
    <svg
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.51 4.09l-.02-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z' />
    </svg>
  )
}

function WindowsLogo() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M0 3.449 9.75 2.1v9.451H0V3.449ZM10.949 1.949 24 0v11.4H10.949V1.949ZM0 12.6h9.75v9.351L0 20.699V12.6ZM10.949 12.6H24V24l-13.051-1.95V12.6Z' />
    </svg>
  )
}

function DesktopPanel(props: { tab: DesktopTab }) {
  const { t } = useTranslation()
  return (
    <div className='hc-install-body has-preview'>
      <div className='hc-install-copy'>
        <h3 className='hc-install-title'>{t(props.tab.title)}</h3>
        <p className='hc-install-desc'>{t(props.tab.description)}</p>
        <div className='hc-install-dl-row'>
          <Link to='/download' className='hc-dl-btn hc-dl-primary il-stateful'>
            <AppleLogo />
            {t('Download for macOS')}
          </Link>
          <Link
            to='/download'
            className='hc-dl-btn hc-dl-secondary il-stateful'
          >
            <WindowsLogo />
            {t('Download for Windows')}
          </Link>
        </div>
        <p className='hc-install-help'>
          {t(props.tab.troubleLead)}{' '}
          <a className='hc-link' href={iterLoopPublicUrl(props.tab.guidePath)}>
            {t('see the setup guide')}
          </a>
        </p>
      </div>
      <div className='hc-install-preview' aria-hidden='true'>
        <div className='hc-install-preview-frame'>
          <img
            src='/media/clone/docs-images/iterloop-client-preview-en.png'
            alt=''
            loading='lazy'
          />
          <div className='hc-install-preview-ring' />
        </div>
      </div>
    </div>
  )
}

function CliPanel(props: { tab: CliTab }) {
  const { t } = useTranslation()
  const [os, setOs] = useState<'mac' | 'win'>('mac')
  const { copyToClipboard } = useCopyToClipboard()
  const config = os === 'mac' ? props.tab.configMac : props.tab.configWin
  const fullConfig = config.before + config.keyPlaceholder + config.after

  return (
    <div className='hc-install-body'>
      <h3 className='hc-install-title'>{t(props.tab.title)}</h3>
      <p className='hc-install-desc'>{t(props.tab.description)}</p>
      <div className='hc-config-box'>
        <div className='hc-config-head'>
          <p className='hc-config-label'>{t('Install config')}</p>
          <div className='hc-os-toggle'>
            <button
              type='button'
              className={os === 'mac' ? 'is-on' : undefined}
              aria-pressed={os === 'mac'}
              onClick={() => setOs('mac')}
            >
              Mac/Linux
            </button>
            <button
              type='button'
              className={os === 'win' ? 'is-on' : undefined}
              aria-pressed={os === 'win'}
              onClick={() => setOs('win')}
            >
              Windows
            </button>
          </div>
        </div>
        <pre className='hc-config-pre'>
          <code>
            {config.before}
            <span className='hc-config-key'>{t(config.keyPlaceholder)}</span>
            {config.after}
          </code>
        </pre>
        <div className='hc-config-actions'>
          <button
            type='button'
            className='hc-copy-btn il-stateful'
            onClick={() => void copyToClipboard(fullConfig)}
          >
            {t('Copy config')}
          </button>
        </div>
      </div>
      <div className='hc-steps'>
        <div className='hc-step'>
          <p className='hc-step-eyebrow'>{t('Step 1')}</p>
          <p className='hc-step-title'>{t('Prerequisites')}</p>
          <p className='hc-step-desc'>
            <a
              className='hc-link'
              href={iterLoopPublicUrl(props.tab.step1LinkPath)}
            >
              {t(props.tab.step1LinkText)}
            </a>
            {t(props.tab.step1Rest)}
          </p>
        </div>
        {props.tab.steps.map((step, index) => (
          <div className='hc-step' key={step.title}>
            <p className='hc-step-eyebrow'>
              {t('Step {{number}}', { number: index + 2 })}
            </p>
            <p className='hc-step-title'>{t(step.title)}</p>
            <p className='hc-step-desc'>{t(step.desc)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillPanel(props: { tab: SkillTab }) {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()

  return (
    <div className='hc-install-body'>
      <h3 className='hc-install-title'>{t(props.tab.title)}</h3>
      <p className='hc-install-desc'>{t(props.tab.description)}</p>
      <div className='hc-config-box'>
        <div className='hc-config-head'>
          <p className='hc-config-label'>{t('Install URL')}</p>
        </div>
        <pre className='hc-config-pre'>
          <code>{OPENCLAW_INSTALL_URL}</code>
        </pre>
        <div className='hc-config-actions'>
          <button
            type='button'
            className='hc-copy-btn il-stateful'
            onClick={() => void copyToClipboard(OPENCLAW_INSTALL_URL)}
          >
            {t('Copy link')}
          </button>
        </div>
      </div>
      <div className='hc-steps'>
        {props.tab.steps.map((step, index) => (
          <div className='hc-step' key={step.title}>
            <p className='hc-step-eyebrow'>
              {t('Step {{number}}', { number: index + 1 })}
            </p>
            <p className='hc-step-title'>{t(step.title)}</p>
            <p className='hc-step-desc'>{t(step.desc)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HomeInstallGuide() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)
  const tab = PRODUCT_TABS[activeTab]

  return (
    <div id='install' className='hc-install-wrap'>
      <div
        className='hc-install-card'
        id='install-card'
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,254,251,0.92), rgba(255,254,251,0.58) 54%, rgba(255,254,251,0.18)), url('/media/clone/api-setup-bg.png')",
        }}
      >
        <div className='hc-install-stack'>
          <div className='hc-install-tabs-stack'>
            <div className='hc-install-tabs-row'>
              <div
                className='home-install-mode-tabs'
                role='tablist'
                aria-label={t('Setup mode')}
              >
                <button
                  type='button'
                  className='home-install-mode-tab il-stateful is-on'
                  role='tab'
                  aria-selected='true'
                >
                  {t('Quick start')}
                </button>
                <a
                  className='home-install-mode-tab il-stateful'
                  role='tab'
                  aria-selected='false'
                  href={iterLoopPublicUrl('/docs/api-integration')}
                >
                  {t('Manual API setup')}
                </a>
              </div>
            </div>
            <div
              className='home-install-product-tabs'
              role='tablist'
              aria-label={t('Client')}
            >
              {PRODUCT_TABS.map((productTab, index) => (
                <button
                  key={productTab.name}
                  type='button'
                  role='tab'
                  aria-selected={index === activeTab}
                  className={
                    index === activeTab
                      ? 'home-install-product-tab il-stateful is-on'
                      : 'home-install-product-tab il-stateful'
                  }
                  onClick={() => setActiveTab(index)}
                >
                  {productTab.name}
                </button>
              ))}
              {DOC_TABS.map((docTab) => (
                <a
                  key={docTab.name}
                  className='home-install-product-tab il-stateful'
                  href={iterLoopPublicUrl(docTab.path)}
                >
                  {docTab.name === 'Other' ? t('Other') : docTab.name}
                </a>
              ))}
            </div>
          </div>

          {tab.kind === 'desktop' && <DesktopPanel tab={tab} />}
          {tab.kind === 'cli' && <CliPanel tab={tab} />}
          {tab.kind === 'skill' && <SkillPanel tab={tab} />}
        </div>
      </div>
    </div>
  )
}
