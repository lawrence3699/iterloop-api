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
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Footer } from '@/components/layout/components/footer'
import { Button } from '@/components/ui/button'
import { iterLoopConsoleUrl, iterLoopPublicUrl } from '@/lib/iterloop-host'

import { DownloadFirstHero } from './download-first-hero'
import {
  HomeFaq,
  ModelIntelligenceSections,
  PerformanceBand,
  ProductPrinciples,
  RoutingFlow,
} from './home-data-sections'
import { LivePricingGrid } from './live-pricing-grid'

export function IterLoopHome(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  const footerColumns = [
    {
      title: 'Product',
      links: [
        { text: 'Live pricing', href: iterLoopPublicUrl('/#pricing') },
        {
          text: 'API Keys',
          href: iterLoopConsoleUrl('/dashboard?tab=api-keys'),
        },
        { text: 'Usage', href: iterLoopConsoleUrl('/dashboard?tab=usage') },
      ],
    },
    {
      title: 'Documentation',
      links: [
        {
          text: 'Codex Desktop',
          href: iterLoopPublicUrl('/docs/install-codex-desktop'),
        },
        {
          text: 'API integration',
          href: iterLoopPublicUrl('/docs/api-integration'),
        },
        { text: 'Service status', href: 'https://api.iter-loop.com/healthz' },
      ],
    },
    {
      title: 'Account',
      links: [
        { text: 'Sign in', href: iterLoopConsoleUrl('/sign-in') },
        { text: 'Create account', href: iterLoopConsoleUrl('/sign-up') },
        { text: 'Open console', href: iterLoopConsoleUrl('/dashboard') },
      ],
    },
    {
      title: 'Open source',
      links: [
        {
          text: 'Running source',
          href: 'https://github.com/lawrence3699/iterloop-api',
        },
        {
          text: 'Upstream project',
          href: 'https://github.com/QuantumNous/new-api',
        },
        {
          text: 'License',
          href: 'https://github.com/lawrence3699/iterloop-api/blob/iterloop/phase-1/LICENSE',
        },
      ],
    },
  ]

  return (
    <div className='iterloop-download-home'>
      <DownloadFirstHero isAuthenticated={props.isAuthenticated} />
      <PerformanceBand />
      <LivePricingGrid />
      <ModelIntelligenceSections />
      <ProductPrinciples />
      <RoutingFlow />
      <HomeFaq />
      <section className='iterloop-download-cta'>
        <div>
          <span>{t('Start with the manual guide today.')}</span>
          <h2>{t('Desktop is coming soon. The API is ready now.')}</h2>
        </div>
        <Button
          size='lg'
          render={<a href={iterLoopPublicUrl('/docs/install-codex-desktop')} />}
        >
          {t('Open documentation')}
          <ArrowRight aria-hidden='true' />
        </Button>
      </section>
      <Footer
        name='IterLoop API'
        logo='/logo.png'
        columns={footerColumns}
        copyright={t('All rights reserved.')}
        className='iterloop-store-footer'
      />
    </div>
  )
}
