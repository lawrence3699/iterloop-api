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
import { ArrowRight, Download, MonitorCog } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { iterLoopConsoleUrl, iterLoopPublicUrl } from '@/lib/iterloop-host'

const DOWNLOAD_CHANNELS = [
  { platform: 'macOS', status: 'coming-soon', url: null },
  { platform: 'Windows', status: 'coming-soon', url: null },
] as const

export function DownloadFirstHero(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  return (
    <section className='iterloop-download-hero'>
      <motion.div
        className='iterloop-download-hero-copy'
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.22,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <span>
          <MonitorCog aria-hidden='true' />
          IterLoop Desktop
        </span>
        <h1>{t('Your coding agents. Connected in one click.')}</h1>
        <p>
          {t(
            'Configure Codex Desktop, Codex CLI, and Claude Code with one secure IterLoop account. See usage and cost without storing prompt or response content.'
          )}
        </p>
        <div className='iterloop-download-actions'>
          {DOWNLOAD_CHANNELS.map((channel) => (
            <Button key={channel.platform} size='lg' disabled={!channel.url}>
              <Download aria-hidden='true' />
              {channel.platform}
              <small>{t('Coming soon')}</small>
            </Button>
          ))}
        </div>
        <div className='iterloop-download-secondary'>
          <a
            href={iterLoopConsoleUrl(
              props.isAuthenticated ? '/dashboard?tab=api-keys' : '/sign-up'
            )}
          >
            {props.isAuthenticated ? t('Open console') : t('Create an account')}
            <ArrowRight aria-hidden='true' />
          </a>
          <a href={iterLoopPublicUrl('/docs/install-codex-desktop')}>
            {t('Read the setup guide')}
          </a>
        </div>
        <div className='iterloop-download-meta'>
          <span>{t('Secure credential storage')}</span>
          <span>{t('Windows and macOS')}</span>
          <span>{t('Manual setup always available')}</span>
        </div>
      </motion.div>

      <motion.figure
        className='iterloop-desktop-preview'
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: reduceMotion ? 0 : 0.48,
          delay: reduceMotion ? 0 : 0.08,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <img
          src='/iterloop-desktop-preview.svg'
          alt={t('IterLoop Desktop connections dashboard')}
          width='1400'
          height='900'
          fetchPriority='high'
        />
      </motion.figure>
    </section>
  )
}
