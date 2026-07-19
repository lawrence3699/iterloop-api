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

import { Models } from '@/features/models'
import {
  MODELS_SECTION_IDS,
  MODELS_DEFAULT_SECTION,
} from '@/features/models/section-registry'
import { ROLE } from '@/lib/roles'
import {
  optionalNumber,
  optionalString,
  searchRecord,
  stringArray,
} from '@/lib/search-params'
import { useAuthStore } from '@/stores/auth-store'

const modelsSearchSchema = (
  value: unknown
): Partial<{
  page: number
  pageSize: number
  filter: string
  vendor: string[]
  status: string[]
  sync: string[]
  dPage: number
  dPageSize: number
  dFilter: string
  dStatus: string[]
}> => {
  const search = searchRecord(value)
  return {
    page: optionalNumber(search.page, 1),
    pageSize: optionalNumber(search.pageSize, 10),
    filter: optionalString(search.filter, ''),
    vendor: stringArray(search.vendor),
    status: stringArray(search.status),
    sync: stringArray(search.sync),
    dPage: optionalNumber(search.dPage, 1),
    dPageSize: optionalNumber(search.dPageSize, 10),
    dFilter: optionalString(search.dFilter, ''),
    dStatus: stringArray(search.dStatus),
  }
}

export const Route = createFileRoute('/_authenticated/models/$section')({
  beforeLoad: ({ params }) => {
    const { auth } = useAuthStore.getState()

    if (!auth.user || auth.user.role < ROLE.ADMIN) {
      throw redirect({
        to: '/403',
      })
    }

    const validSections = MODELS_SECTION_IDS as unknown as string[]
    if (!validSections.includes(params.section)) {
      throw redirect({
        to: '/models/$section',
        params: { section: MODELS_DEFAULT_SECTION },
      })
    }
  },
  validateSearch: modelsSearchSchema,
  component: Models,
})
