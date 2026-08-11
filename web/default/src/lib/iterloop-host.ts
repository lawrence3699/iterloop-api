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
const ADMIN_PATH_PREFIXES = [
  '/channels',
  '/models',
  '/users',
  '/redemption-codes',
  '/subscriptions',
  '/system-info',
  '/system-settings',
  '/issuances',
]

const LOCAL_HOSTS = new Set(['', 'localhost', '127.0.0.1', '::1'])

export const ITERLOOP_PUBLIC_ORIGIN = (
  import.meta.env.VITE_ITERLOOP_PUBLIC_ORIGIN || 'https://iter-loop.com'
).replace(/\/$/, '')

export const ITERLOOP_CONSOLE_ORIGIN = (
  import.meta.env.VITE_ITERLOOP_CONSOLE_ORIGIN ||
  'https://console.iter-loop.com'
).replace(/\/$/, '')

export const ITERLOOP_ADMIN_ORIGIN = (
  import.meta.env.VITE_ITERLOOP_ADMIN_ORIGIN || 'https://admin.iter-loop.com'
).replace(/\/$/, '')

// Origin that serves model traffic (/v1/**). It must stay a build-time literal:
// the mainland entry point (console-cn.iter-loop.com) rewrites the API host in
// the response body, so deriving it from window.location would bypass that
// rewrite and hand mainland users an unreachable address.
export const ITERLOOP_API_ORIGIN = (
  import.meta.env.VITE_ITERLOOP_API_BASE_URL || 'https://api.iter-loop.com/v1'
)
  .replace(/\/v1\/?$/, '')
  .replace(/\/$/, '')

function currentHostname(hostname?: string): string {
  return (
    hostname ?? (typeof window === 'undefined' ? '' : window.location.hostname)
  ).toLowerCase()
}

export function isIterLoopLocalHost(hostname?: string): boolean {
  return LOCAL_HOSTS.has(currentHostname(hostname))
}

export function isIterLoopPublicHost(hostname?: string): boolean {
  const host = currentHostname(hostname)
  if (LOCAL_HOSTS.has(host)) return false
  return host === new URL(ITERLOOP_PUBLIC_ORIGIN).hostname.toLowerCase()
}

export function isIterLoopConsoleHost(hostname?: string): boolean {
  const host = currentHostname(hostname)
  if (LOCAL_HOSTS.has(host)) return true
  return host === new URL(ITERLOOP_CONSOLE_ORIGIN).hostname.toLowerCase()
}

export function iterLoopConsoleUrl(path = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (isIterLoopLocalHost() || isIterLoopConsoleHost()) return normalizedPath
  return `${ITERLOOP_CONSOLE_ORIGIN}${normalizedPath}`
}

export function iterLoopPublicUrl(path = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (isIterLoopLocalHost() || isIterLoopPublicHost()) return normalizedPath
  return `${ITERLOOP_PUBLIC_ORIGIN}${normalizedPath}`
}

export function iterLoopAdminUrl(path = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (isIterLoopLocalHost() || isIterLoopAdminHost()) return normalizedPath
  return `${ITERLOOP_ADMIN_ORIGIN}${normalizedPath}`
}

export function isIterLoopAdminPath(pathname: string): boolean {
  if (
    pathname === '/dashboard/users' ||
    pathname.startsWith('/dashboard/users/')
  ) {
    return true
  }
  return ADMIN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isIterLoopAdminHost(hostname?: string): boolean {
  const host = currentHostname(hostname)
  if (LOCAL_HOSTS.has(host)) {
    return true
  }
  const configured = (
    import.meta.env.VITE_ITERLOOP_ADMIN_HOST || 'admin.iter-loop.com'
  ).toLowerCase()
  return host === configured
}
