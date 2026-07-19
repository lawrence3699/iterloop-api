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
import { createFileRoute, redirect } from '@tanstack/react-router'

import { ModelDetails } from '@/features/pricing/components/model-details'
import { getFreshModuleAccess } from '@/lib/nav-modules'
import {
  enumValue,
  optionalBoolean,
  optionalString,
  searchRecord,
} from '@/lib/search-params'
import { useAuthStore } from '@/stores/auth-store'

function modelDetailsSearchSchema(value: unknown): Partial<{
  search: string
  sort: string
  vendor: string
  group: string
  quotaType: string
  endpointType: string
  tag: string
  tokenUnit: 'M' | 'K'
  view: 'card' | 'table'
  rechargePrice: boolean
}> {
  const search = searchRecord(value)
  return {
    search: optionalString(search.search),
    sort: optionalString(search.sort),
    vendor: optionalString(search.vendor),
    group: optionalString(search.group),
    quotaType: optionalString(search.quotaType),
    endpointType: optionalString(search.endpointType),
    tag: optionalString(search.tag),
    tokenUnit: enumValue(search.tokenUnit, ['M', 'K']),
    view: enumValue(search.view, ['card', 'table']),
    rechargePrice: optionalBoolean(search.rechargePrice),
  }
}

export const Route = createFileRoute('/pricing/$modelId/')({
  validateSearch: modelDetailsSearchSchema,
  beforeLoad: async ({ location }) => {
    const access = await getFreshModuleAccess('pricing')
    if (!access.enabled) {
      throw redirect({ to: '/' })
    }
    if (access.requireAuth) {
      const { auth } = useAuthStore.getState()
      if (!auth.user) {
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.href },
        })
      }
    }
  },
  component: ModelDetails,
})
