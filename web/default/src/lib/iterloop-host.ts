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
  const host = (
    hostname ?? (typeof window === 'undefined' ? '' : window.location.hostname)
  ).toLowerCase()
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return true
  }
  const configured = (
    import.meta.env.VITE_ITERLOOP_ADMIN_HOST || 'admin.iter-loop.com'
  ).toLowerCase()
  return host === configured
}
