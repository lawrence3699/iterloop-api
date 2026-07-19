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

import { Channels } from '@/features/channels'
import { ROLE } from '@/lib/roles'
import {
  optionalNumber,
  optionalString,
  searchRecord,
  stringArray,
} from '@/lib/search-params'
import { useAuthStore } from '@/stores/auth-store'

const channelsSearchSchema = (
  value: unknown
): Partial<{
  page: number
  pageSize: number
  filter: string
  status: string[]
  type: string[]
  group: string[]
  model: string
}> => {
  const search = searchRecord(value)
  return {
    page: optionalNumber(search.page, 1),
    pageSize: optionalNumber(search.pageSize),
    filter: optionalString(search.filter, ''),
    status: stringArray(search.status),
    type: stringArray(search.type),
    group: stringArray(search.group),
    model: optionalString(search.model, ''),
  }
}

export const Route = createFileRoute('/_authenticated/channels/')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()

    if (!auth.user || auth.user.role < ROLE.ADMIN) {
      throw redirect({
        to: '/403',
      })
    }
  },
  validateSearch: channelsSearchSchema,
  component: Channels,
})
