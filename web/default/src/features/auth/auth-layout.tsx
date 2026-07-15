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
import { useTranslation } from 'react-i18next'

import { IterLoopMark } from '@/components/iterloop-mark'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeSwitch } from '@/components/theme-switch'

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
    <div className='iterloop-auth-shell'>
      <header className='iterloop-auth-global'>
        <div className='iterloop-auth-global-inner'>
          <Link to='/' className='iterloop-auth-brand' aria-label='IterLoop API'>
            <IterLoopMark compact />
          </Link>

          <nav aria-label={t('Main navigation')}>
            <Link to='/pricing'>{t('Pricing')}</Link>
            <Link to='/docs'>{t('API docs')}</Link>
            <Link to='/sign-in'>{t('Console')}</Link>
          </nav>

          <div className='iterloop-auth-actions'>
            <LanguageSwitcher />
            <ThemeSwitch />
          </div>
        </div>
      </header>

      {isSignUp ? (
        <div className='iterloop-account-local'>
          <div className='iterloop-account-local-inner'>
            <strong>IterLoop Account</strong>
            <nav>
              <Link to='/sign-in'>{t('Sign in')}</Link>
              <Link to='/sign-up'>{t('Create account')}</Link>
              <Link to='/docs'>{t('FAQ')}</Link>
            </nav>
          </div>
        </div>
      ) : null}

      <main
        className={
          isSignUp
            ? 'iterloop-auth-main iterloop-auth-main-signup'
            : 'iterloop-auth-main iterloop-auth-main-signin'
        }
      >
        {pageTitle ? <h1 className='iterloop-auth-page-title'>{pageTitle}</h1> : null}
        <div className='iterloop-auth-content'>{children}</div>
      </main>

      <div className='iterloop-auth-help'>
        <div>
          {t('Need help?')}{' '}
          <Link to='/docs'>{t('View docs or contact support.')}</Link>
        </div>
      </div>

      <footer className='iterloop-auth-footer'>
        <span>{t('Encrypted connection')}</span>
        <Link to='/privacy-policy'>{t('Privacy Policy')}</Link>
        <Link to='/user-agreement'>{t('Terms of Use')}</Link>
        <Link to='/about'>{t('Running source')}</Link>
      </footer>
    </div>
  )
}
