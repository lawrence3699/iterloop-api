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
import {
  ArrowRight,
  BarChart3,
  Fingerprint,
  Gauge,
  GitBranch,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

function Reveal(props: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={props.className}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{
        duration: reduceMotion ? 0 : 0.48,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {props.children}
    </motion.div>
  )
}

const LEADERBOARD = [
  ['GPT-5.5', '99.8', '+1.2%'],
  ['GPT-5.6 Sol', '99.7', '+0.8%'],
  ['Claude Fable 5', '99.7', '+1.5%'],
  ['Claude Sonnet 5', '99.6', '+0.6%'],
  ['Claude Opus 4.8', '99.5', '+0.9%'],
  ['GPT-5.4', '99.4', '+0.4%'],
] as const

export function ModelIntelligenceSections() {
  const { t } = useTranslation()
  return (
    <section className='iterloop-download-section iterloop-data-section'>
      <div className='iterloop-download-section-heading'>
        <div>
          <span>{t('Model Intelligence')}</span>
          <h2>{t('A clear view of the models that matter.')}</h2>
        </div>
        <p>{t('Versioned website data confirmed for this release.')}</p>
      </div>
      <div className='iterloop-data-grid'>
        <Reveal className='iterloop-leaderboard'>
          <header>
            <span>{t('Reliability leaderboard')}</span>
            <small>{t('Last 30 days')}</small>
          </header>
          <ol>
            {LEADERBOARD.map((item, index) => (
              <li key={item[0]}>
                <i>{String(index + 1).padStart(2, '0')}</i>
                <strong>{item[0]}</strong>
                <span>{item[1]}%</span>
                <small>{item[2]}</small>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal className='iterloop-trend-card'>
          <header>
            <span>{t('Request trend')}</span>
            <small>{t('Relative volume')}</small>
          </header>
          <svg
            viewBox='0 0 640 250'
            role='img'
            aria-label={t('Model request trend chart')}
          >
            <g className='grid'>
              <path d='M0 50H640M0 100H640M0 150H640M0 200H640' />
            </g>
            <path
              className='line line-1'
              d='M0 190C70 170 95 110 160 130S250 178 320 108 430 62 500 92 570 46 640 52'
            />
            <path
              className='line line-2'
              d='M0 210C80 190 110 164 170 174S270 130 340 147 448 116 520 127 590 84 640 96'
            />
            <path
              className='line line-3'
              d='M0 222C76 214 126 188 190 202S282 166 360 177 454 142 536 154 590 125 640 132'
            />
          </svg>
          <div className='iterloop-trend-legend'>
            {[
              'GPT-5.5',
              'Claude Fable 5',
              'Claude Opus 4.8',
              'GPT-5.4',
              'Claude Opus 4.7',
            ].map((model, index) => (
              <span key={model}>
                <i className={`tone-${index + 1}`} />
                {model}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function PerformanceBand() {
  const { t } = useTranslation()
  const metrics = [
    ['>99%', 'Cache hit'],
    ['99.6%', 'SLA'],
    ['On par', 'TTFT'],
    ['Hours', 'to new-model support'],
  ]
  return (
    <Reveal className='iterloop-performance-band'>
      {metrics.map(([value, label]) => (
        <div key={label}>
          <strong>{t(value)}</strong>
          <span>{t(label)}</span>
        </div>
      ))}
    </Reveal>
  )
}

export function ProductPrinciples() {
  const { t } = useTranslation()
  const principles = [
    [
      ReceiptText,
      'Pay as you go',
      'No subscription is required. Add balance and pay only for settled API usage.',
    ],
    [
      Fingerprint,
      'Model integrity',
      'Model names stay explicit, so the route you request remains understandable.',
    ],
    [
      LockKeyhole,
      'Privacy by design',
      'Analytics exclude prompts, responses, IP addresses, and administrator fields.',
    ],
    [
      BarChart3,
      'Spend tracking',
      'Filter usage and cost by API key and date, then compare model share over time.',
    ],
  ] as const
  return (
    <section className='iterloop-download-section'>
      <div className='iterloop-download-section-heading'>
        <div>
          <span>{t('Built for daily use')}</span>
          <h2>{t('Simple controls. Serious operational detail.')}</h2>
        </div>
        <p>
          {t(
            'Everything needed to connect, observe, and fund an IterLoop account.'
          )}
        </p>
      </div>
      <div className='iterloop-principles-grid'>
        {principles.map(([Icon, title, body]) => (
          <Reveal key={title} className='iterloop-principle-card'>
            <Icon aria-hidden='true' />
            <h3>{t(title)}</h3>
            <p>{t(body)}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function RoutingFlow() {
  const { t } = useTranslation()
  const steps = [
    [
      Gauge,
      'Your client',
      'Codex Desktop, Codex CLI, Claude Code, or an API integration',
    ],
    [
      ShieldCheck,
      'IterLoop policy',
      'Authentication, model access, quota, and privacy safeguards',
    ],
    [
      GitBranch,
      'Curated route',
      'The verified production channel selected for this release',
    ],
  ] as const
  return (
    <section className='iterloop-download-section iterloop-routing-flow'>
      <div className='iterloop-download-section-heading'>
        <div>
          <span>{t('Routing flow')}</span>
          <h2>{t('One request. Three clear stages.')}</h2>
        </div>
        <p>
          {t(
            'The console makes the path visible without exposing provider credentials.'
          )}
        </p>
      </div>
      <Reveal className='iterloop-routing-flow-track'>
        {steps.map(([Icon, title, body], index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <Icon aria-hidden='true' />
            <h3>{t(title)}</h3>
            <p>{t(body)}</p>
            {index < steps.length - 1 ? (
              <ArrowRight aria-hidden='true' />
            ) : null}
          </article>
        ))}
      </Reveal>
    </section>
  )
}

export function HomeFaq() {
  const { t } = useTranslation()
  const questions = [
    [
      'Do I need IterLoop Desktop?',
      'No. Desktop is the quickest setup path, while the manual Codex CLI, Claude Code, and API guides remain available.',
    ],
    [
      'Which models are shown?',
      'The live catalog is limited to the 16 OpenAI and Anthropic models enabled in production.',
    ],
    [
      'What does IterLoop store?',
      'Usage analytics contain token, model, request, and quota metadata. They do not return prompt or response content.',
    ],
    [
      'Can I use my existing SDK?',
      'Yes. Use the OpenAI-compatible or Anthropic-compatible Base URL shown in the API Keys tab.',
    ],
  ] as const
  return (
    <section className='iterloop-download-section iterloop-home-faq'>
      <div className='iterloop-download-section-heading'>
        <div>
          <span>FAQ</span>
          <h2>{t('Questions, answered plainly.')}</h2>
        </div>
      </div>
      <div>
        {questions.map(([question, answer]) => (
          <details key={question}>
            <summary>{t(question)}</summary>
            <p>{t(answer)}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
