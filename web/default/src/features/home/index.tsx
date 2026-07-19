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
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout/components/public-layout'
import { useAuthStore } from '@/stores/auth-store'

import { IterLoopHome } from './components/iterloop-home'

const ConfigurableHome = lazy(async () => {
  const module = await import('./configurable-home')
  return { default: module.ConfigurableHome }
})

const isIterLoopBrandLocked =
  import.meta.env.VITE_ITERLOOP_BRAND_LOCK !== 'false'

export function Home() {
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore((state) => !!state.auth.user)

  if (isIterLoopBrandLocked) {
    return (
      <PublicLayout showMainContainer={false}>
        <IterLoopHome isAuthenticated={isAuthenticated} />
      </PublicLayout>
    )
  }

  return (
    <Suspense
      fallback={
        <PublicLayout showMainContainer={false}>
          <main className='flex min-h-screen items-center justify-center'>
            <div className='text-muted-foreground'>{t('Loading...')}</div>
          </main>
        </PublicLayout>
      }
    >
      <ConfigurableHome isAuthenticated={isAuthenticated} />
    </Suspense>
  )
}
