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
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { getApiKeys } from '@/features/keys/api'

import { getSelfAnalytics } from '../api'
import type { AnalyticsFilters } from '../types'

function formatInputDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useConsoleAnalytics(defaultDays = 7) {
  const [filters, setFilters] = useState<AnalyticsFilters>(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (defaultDays - 1))
    return {
      startDate: formatInputDate(startDate),
      endDate: formatInputDate(endDate),
      tokenId: '',
    }
  })

  const timestamps = useMemo(() => {
    const start = new Date(`${filters.startDate}T00:00:00`)
    const end = new Date(`${filters.endDate}T23:59:59`)
    return {
      startTimestamp: Math.floor(start.getTime() / 1000),
      endTimestamp: Math.floor(end.getTime() / 1000),
    }
  }, [filters.endDate, filters.startDate])

  const analyticsQuery = useQuery({
    queryKey: ['self-analytics', timestamps, filters.tokenId],
    queryFn: async () => {
      const response = await getSelfAnalytics({
        ...timestamps,
        tokenId: filters.tokenId ? Number(filters.tokenId) : undefined,
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load analytics')
      }
      return response.data
    },
  })

  const apiKeysQuery = useQuery({
    queryKey: ['console-api-keys-filter'],
    queryFn: () => getApiKeys({ p: 1, size: 100 }),
  })

  return {
    filters,
    setFilters,
    analyticsQuery,
    apiKeys: apiKeysQuery.data?.data?.items ?? [],
    apiKeysLoading: apiKeysQuery.isLoading,
  }
}
