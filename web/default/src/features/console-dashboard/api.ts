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
import { api } from '@/lib/api'

import type { SelfAnalyticsResponse } from './types'

export async function getSelfAnalytics(params: {
  startTimestamp: number
  endTimestamp: number
  tokenId?: number
}): Promise<SelfAnalyticsResponse> {
  const search = new URLSearchParams({
    start_timestamp: String(params.startTimestamp),
    end_timestamp: String(params.endTimestamp),
  })
  if (params.tokenId) search.set('token_id', String(params.tokenId))
  const response = await api.get(
    `/api/data/self/analytics?${search.toString()}`
  )
  return response.data
}
