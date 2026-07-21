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
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Footer } from '@/components/layout/components/footer'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { iterLoopConsoleUrl, iterLoopPublicUrl } from '@/lib/iterloop-host'

import { HomeHero } from './clone/home-hero'
import { HomeInstallGuide } from './clone/home-install-guide'
import { HomeLeaderboard } from './clone/home-leaderboard'
import { HomeLiveDiscounts } from './clone/home-live-discounts'
import { HomeLivePricing } from './clone/home-live-pricing'
import { HomePaylessBand } from './clone/home-payless-band'
import { HomeWhySection, HomeHowSection } from './clone/home-why-how'
import './clone/home-clone.css'

export function IterLoopHome(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  // Rescan reveal targets if the auth state flips after mount (header CTA
  // swap re-renders the page shell).
  useScrollReveal(props.isAuthenticated)

  // The pre-React shell (index.html) may still show the static hero while
  // this component mounts; the clone hero replaces it, so drop the shell.
  useEffect(() => {
    document.documentElement.classList.remove('iterloop-static-home')
    document.querySelector('#iterloop-static-hero')?.remove()
  }, [])

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
    <>
      <main className='hc-main'>
        <div className='animate-page-enter'>
          <div className='hc-container'>
            <HomeHero />
            <HomeLiveDiscounts />
            <HomePaylessBand staggerDelay='160ms' />
            <HomeInstallGuide />
            <HomeWhySection />
            <HomeHowSection />
            {/* The footer links to /#pricing; the clone section id is
                home-pricing-models, so provide both anchors. */}
            <div id='pricing' className='hc-pricing-anchor'>
              <HomeLivePricing />
            </div>
            <HomeLeaderboard />
            <HomePaylessBand staggerDelay='300ms' />
          </div>
        </div>
      </main>
      <Footer
        name='IterLoop API'
        logo='/media/clone/iterloop-logo-transparent.svg'
        columns={footerColumns}
        copyright={t('All rights reserved.')}
      />
    </>
  )
}
