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

import { ITERLOOP_BRAND_LOCKED } from '@/components/iterloop-mark'

import type { TopNavLink } from '../types'
import { IterLoopPublicHeader } from './iterloop-public-header'

const ConfigurablePublicHeader = lazy(async () => {
  const module = await import('./configurable-public-header')
  return { default: module.LegacyPublicHeader }
})

export interface PublicHeaderProps {
  navLinks?: TopNavLink[]
  mobileLinks?: TopNavLink[]
  navContent?: React.ReactNode
  showThemeSwitch?: boolean
  showLanguageSwitcher?: boolean
  logo?: React.ReactNode
  siteName?: string
  homeUrl?: string
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  showNavigation?: boolean
  showAuthButtons?: boolean
  showNotifications?: boolean
  className?: string
}

export function PublicHeader(props: PublicHeaderProps) {
  if (ITERLOOP_BRAND_LOCKED) {
    return (
      <IterLoopPublicHeader
        showThemeSwitch={props.showThemeSwitch}
        showLanguageSwitcher={props.showLanguageSwitcher}
        showAuthButtons={props.showAuthButtons}
        className={props.className}
      />
    )
  }

  return (
    <Suspense fallback={null}>
      <ConfigurablePublicHeader {...props} />
    </Suspense>
  )
}
