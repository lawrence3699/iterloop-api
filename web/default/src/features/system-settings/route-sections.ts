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
// Keep route guards independent from the component registries. Importing a
// registry in a route's beforeLoad path pulls every admin editor into the
// public bootstrap bundle before the router can lazy-load the settings page.
export const SYSTEM_SETTINGS_ROUTE_SECTIONS = {
  auth: {
    defaultSection: 'basic-auth',
    sectionIds: [
      'basic-auth',
      'oauth',
      'passkey',
      'bot-protection',
      'custom-oauth',
    ],
  },
  billing: {
    defaultSection: 'quota',
    sectionIds: [
      'quota',
      'currency',
      'model-pricing',
      'group-pricing',
      'payment',
      'checkin',
    ],
  },
  content: {
    defaultSection: 'dashboard',
    sectionIds: [
      'dashboard',
      'announcements',
      'api-info',
      'faq',
      'uptime-kuma',
      'chat',
      'drawing',
    ],
  },
  models: {
    defaultSection: 'global',
    sectionIds: [
      'global',
      'routing-reliability',
      'gemini',
      'claude',
      'grok',
      'channel-affinity',
      'model-deployment',
    ],
  },
  operations: {
    defaultSection: 'behavior',
    sectionIds: [
      'behavior',
      'alerts',
      'email',
      'worker',
      'logs',
      'performance',
      'update-checker',
    ],
  },
  security: {
    defaultSection: 'rate-limit',
    sectionIds: ['rate-limit', 'sensitive-words', 'ssrf', 'token-limits'],
  },
  site: {
    defaultSection: 'system-info',
    sectionIds: [
      'system-info',
      'notice',
      'header-navigation',
      'sidebar-modules',
    ],
  },
} as const
