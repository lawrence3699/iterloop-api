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
export type AnalyticsTotals = {
  input_tokens: number
  output_tokens: number
  cached_tokens: number
  requests: number
  quota: number
}

export type AnalyticsTrendPoint = AnalyticsTotals & {
  timestamp: number
}

export type AnalyticsModelPoint = AnalyticsTotals & {
  model_name: string
}

export type AnalyticsTokenPoint = {
  token_id: number
  requests: number
  quota: number
}

export type SelfAnalytics = {
  totals: AnalyticsTotals
  trend: AnalyticsTrendPoint[]
  models: AnalyticsModelPoint[]
  by_token: AnalyticsTokenPoint[]
}

export type SelfAnalyticsResponse = {
  success: boolean
  message?: string
  data?: SelfAnalytics
}

export type AnalyticsFilters = {
  startDate: string
  endDate: string
  tokenId: string
}

export type ConsoleLayoutMode = 'flat' | 'bento'
