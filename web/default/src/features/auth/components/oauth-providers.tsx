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
import { Globe, Send, Shield } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  IconDiscord,
  IconGithub,
  IconLinuxDo,
  IconWeChat,
} from '@/assets/brand-icons'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import { useOAuthLogin } from '../hooks/use-oauth-login'
import type { SystemStatus } from '../types'

type OAuthProvidersProps = {
  status: SystemStatus | null
  disabled?: boolean
  className?: string
  onWeChatLogin?: () => void
  isWeChatLoading?: boolean
  separatorPosition?: 'before' | 'after'
  /** Render only the icon buttons (no wrapper/separator) so the caller
   *  can place them inside its own clone-style icon row. */
  bare?: boolean
}

type ProviderButton = {
  key: string
  label: string
  onClick: () => void
  icon?: ReactNode
  disabled?: boolean
  /** Featured providers render as a full-width labeled button instead of a
   *  small icon — used for Google, the primary social login. */
  featured?: boolean
}

export function OAuthProviders({
  status,
  disabled = false,
  className,
  onWeChatLogin,
  isWeChatLoading = false,
  separatorPosition = 'before',
  bare = false,
}: OAuthProvidersProps) {
  const { t } = useTranslation()
  const {
    isLoading,
    githubButtonText,
    githubButtonDisabled,
    handleGitHubLogin,
    handleDiscordLogin,
    handleOIDCLogin,
    handleLinuxDOLogin,
    handleTelegramLogin,
    handleCustomOAuthLogin,
  } = useOAuthLogin(status)

  const providerButtons: ProviderButton[] = []

  if (status?.wechat_login && onWeChatLogin) {
    providerButtons.push({
      key: 'wechat',
      label: t('Continue with WeChat'),
      onClick: onWeChatLogin,
      icon: <IconWeChat className='h-6 w-6' />,
      disabled: isWeChatLoading,
    })
  }

  if (status?.github_oauth) {
    providerButtons.push({
      key: 'github',
      label: githubButtonText || t('Continue with GitHub'),
      onClick: handleGitHubLogin,
      icon: <IconGithub className='h-6 w-6' />,
      disabled: githubButtonDisabled,
    })
  }

  if (status?.discord_oauth) {
    providerButtons.push({
      key: 'discord',
      label: t('Continue with Discord'),
      onClick: handleDiscordLogin,
      icon: <IconDiscord className='h-6 w-6' />,
    })
  }

  if (status?.oidc_enabled) {
    providerButtons.push({
      key: 'oidc',
      label: t('Continue with OIDC'),
      onClick: handleOIDCLogin,
      icon: <Shield className='h-6 w-6' aria-hidden='true' />,
    })
  }

  if (status?.linuxdo_oauth) {
    providerButtons.push({
      key: 'linuxdo',
      label: t('Continue with LinuxDO'),
      onClick: handleLinuxDOLogin,
      icon: <IconLinuxDo className='h-6 w-6' />,
    })
  }

  if (status?.telegram_oauth) {
    providerButtons.push({
      key: 'telegram',
      label: t('Continue with Telegram'),
      onClick: handleTelegramLogin,
      icon: <Send className='h-6 w-6' aria-hidden='true' />,
    })
  }

  // Custom OAuth providers. Google is the primary social login for the
  // site, so it renders as a prominent labeled button rather than a small
  // icon that users overlook.
  const customProviders = status?.custom_oauth_providers
  if (customProviders && customProviders.length > 0) {
    for (const provider of customProviders) {
      providerButtons.push({
        key: `custom-${provider.slug}`,
        label: t('Continue with {{name}}', { name: provider.name }),
        onClick: () => handleCustomOAuthLogin(provider),
        icon: provider.icon ? (
          getLobeIcon(provider.icon, 24)
        ) : (
          <Globe className='h-6 w-6' aria-hidden='true' />
        ),
        featured: provider.slug === 'google',
      })
    }
  }

  if (providerButtons.length === 0) return null

  const iconButtons = providerButtons.filter((b) => !b.featured)
  const featuredButtons = providerButtons.filter((b) => b.featured)

  const renderFeatured = featuredButtons.map(
    ({ key, label, onClick, icon, disabled: extraDisabled }) => (
      <button
        key={key}
        type='button'
        className='il-auth-featured-btn'
        disabled={disabled || isLoading || extraDisabled}
        onClick={onClick}
      >
        <span className='il-auth-featured-icon' aria-hidden='true'>
          {icon}
        </span>
        {label}
      </button>
    )
  )

  const renderIcons = iconButtons.map(
    ({ key, label, onClick, icon, disabled: extraDisabled }) => (
      <button
        key={key}
        type='button'
        className='il-auth-icon-btn'
        disabled={disabled || isLoading || extraDisabled}
        onClick={onClick}
        aria-label={label}
        title={label}
      >
        {icon}
      </button>
    )
  )

  if (bare) {
    return (
      <>
        {renderFeatured}
        {renderIcons}
      </>
    )
  }

  const separator = (
    <span className='il-auth-alt-sep'>{t('Or continue with')}</span>
  )

  return (
    <div className={cn('il-auth-alt', className)}>
      {separatorPosition === 'before' && separator}
      {renderFeatured.length > 0 && (
        <div className='il-auth-featured-row'>{renderFeatured}</div>
      )}
      {renderIcons.length > 0 && (
        <div className='il-auth-alt-row'>{renderIcons}</div>
      )}
      {separatorPosition === 'after' && separator}
    </div>
  )
}
