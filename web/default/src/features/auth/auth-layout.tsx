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
import { Power } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeSwitch } from '@/components/theme-switch'

import './clone-auth.css'

type AuthLayoutProps = {
  children: React.ReactNode
  pageTitle?: React.ReactNode
  variant?: 'sign-in' | 'sign-up'
}

export function AuthLayout({
  children,
  pageTitle,
  variant = 'sign-in',
}: AuthLayoutProps) {
  const { t } = useTranslation()
  const isSignUp = variant === 'sign-up'

  return (
    <div className='il-auth-shell'>
      <div className='il-auth-canvas animate-page-enter'>
        <div className='il-auth-top'>
          <Link to='/' className='il-auth-wordmark' aria-label='IterLoop'>
            IterLoop
          </Link>

          <div className='il-auth-actions'>
            <LanguageSwitcher />
            <ThemeSwitch />
            <Link
              to='/'
              className='il-auth-power'
              aria-label={t('Back to home')}
            >
              <Power aria-hidden='true' />
            </Link>
          </div>
        </div>

        <main
          className={
            isSignUp
              ? 'il-auth-main il-auth-main--top'
              : 'il-auth-main il-auth-main--center'
          }
        >
          <div className='il-auth-content'>
            {pageTitle ? <p className='il-auth-hero'>{pageTitle}</p> : null}
            {children}
          </div>
        </main>

        <footer className='il-auth-bottom'>
          <span>{t('Encrypted connection')}</span>
          <Link to='/privacy-policy'>{t('Privacy Policy')}</Link>
          <Link to='/user-agreement'>{t('Terms of Use')}</Link>
          <Link to='/about'>{t('Running source')}</Link>
          <span className='il-auth-bottom-help'>
            {t('Need help?')}{' '}
            <Link to='/docs'>{t('View docs or contact support.')}</Link>
          </span>
        </footer>
      </div>
    </div>
  )
}
