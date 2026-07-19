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

import { Redemptions } from '@/features/redemption-codes'
import { REDEMPTION_FILTER_VALUES } from '@/features/redemption-codes/constants'
import { ROLE } from '@/lib/roles'
import {
  optionalNumber,
  optionalString,
  searchRecord,
  stringArray,
} from '@/lib/search-params'
import { useAuthStore } from '@/stores/auth-store'

const redemptionsSearchSchema = (
  value: unknown
): Partial<{
  page: number
  pageSize: number
  filter: string
  status: (typeof REDEMPTION_FILTER_VALUES)[number][]
}> => {
  const search = searchRecord(value)
  return {
    page: optionalNumber(search.page, 1),
    pageSize: optionalNumber(search.pageSize, 10),
    filter: optionalString(search.filter, ''),
    status: stringArray(search.status, REDEMPTION_FILTER_VALUES),
  }
}

export const Route = createFileRoute('/_authenticated/redemption-codes/')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()

    if (!auth.user || auth.user.role < ROLE.ADMIN) {
      throw redirect({
        to: '/403',
      })
    }
  },
  validateSearch: redemptionsSearchSchema,
  component: Redemptions,
})
