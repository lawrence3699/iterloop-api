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

import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useSystemConfig } from '@/hooks/use-system-config'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='relative flex min-h-svh flex-col bg-[#f2f7ff] text-[#172033] dark:bg-[#0f1c2e] dark:text-white'>
      <header className='border-b border-[#d6e2f3] bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-[#102038]/90'>
        <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6'>
          <Link
            to='/'
            className='flex items-center gap-2.5 transition-opacity hover:opacity-80'
          >
            <div className='relative h-8 w-8 shrink-0'>
              {loading ? (
                <Skeleton className='absolute inset-0 rounded-md' />
              ) : (
                <img
                  src={logo}
                  alt={t('Logo')}
                  className='h-8 w-8 rounded-md object-cover ring-1 ring-[#c7d7ee] dark:ring-white/20'
                />
              )}
            </div>
            {loading ? (
              <Skeleton className='h-5 w-24' />
            ) : (
              <h1 className='font-display text-base font-semibold'>
                {systemName}
              </h1>
            )}
          </Link>

          <nav className='hidden items-center gap-5 text-sm text-[#536177] sm:flex dark:text-white/65'>
            <Link to='/' className='hover:text-primary transition-colors'>
              {t('Home')}
            </Link>
            <Link
              to='/pricing'
              className='hover:text-primary transition-colors'
            >
              {t('Pricing')}
            </Link>
            <Link to='/docs' className='hover:text-primary transition-colors'>
              {t('API docs')}
            </Link>
          </nav>

          <div className='flex items-center gap-1'>
            <LanguageSwitcher />
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className='flex flex-1 items-center justify-center px-4 py-10 sm:px-8 sm:py-14'>
        <div className='w-full max-w-[460px]'>
          <Link
            to='/'
            className='mb-7 flex flex-col items-center text-center transition-opacity hover:opacity-85'
          >
            <div className='relative mb-3 h-11 w-11'>
              {loading ? (
                <Skeleton className='absolute inset-0 rounded-lg' />
              ) : (
                <img
                  src={logo}
                  alt={t('Logo')}
                  className='h-11 w-11 rounded-lg object-cover ring-1 ring-[#c7d7ee] dark:ring-white/20'
                />
              )}
            </div>
            <span className='font-display text-xl font-semibold'>
              {loading ? t('Loading...') : systemName}
            </span>
            <span className='mt-1 text-sm text-[#647188] dark:text-white/55'>
              {t('Governed Codex, Claude, and Grok access.')}
            </span>
          </Link>

          <section className='text-foreground bg-background w-full rounded-lg border border-[#cad8eb] p-6 shadow-[0_18px_50px_rgba(49,83,128,0.10)] sm:p-8 dark:border-white/15'>
            {children}
          </section>
        </div>
      </main>

      <div className='border-t border-[#d6e2f3] px-5 py-4 text-center font-mono text-[11px] text-[#6d7a8e] sm:px-8 dark:border-white/10 dark:text-white/45'>
        console.iter-loop.com
      </div>
    </div>
  )
}
