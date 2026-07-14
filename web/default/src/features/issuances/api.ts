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

import type {
  ApiResponse,
  IssueAccessPayload,
  IssueAccessResult,
  IterLoopPricingPreview,
  IterLoopPricingSettings,
  Issuance,
  IssuanceProfile,
  IssuanceProfilePayload,
  PageData,
  UpstreamHealth,
} from './types'

export async function getIssuanceProfiles(params?: {
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<ApiResponse<PageData<IssuanceProfile>>> {
  const query = new URLSearchParams({
    p: String(params?.page ?? 1),
    page_size: String(params?.pageSize ?? 100),
  })
  if (params?.keyword) query.set('keyword', params.keyword)
  const response = await api.get(`/api/issuance-profiles/?${query}`)
  return response.data
}

export async function createIssuanceProfile(
  payload: IssuanceProfilePayload
): Promise<ApiResponse<IssuanceProfile>> {
  const response = await api.post('/api/issuance-profiles/', payload)
  return response.data
}

export async function updateIssuanceProfile(
  id: number,
  payload: IssuanceProfilePayload
): Promise<ApiResponse<IssuanceProfile>> {
  const response = await api.put(`/api/issuance-profiles/${id}`, payload)
  return response.data
}

export async function deleteIssuanceProfile(
  id: number
): Promise<ApiResponse<null>> {
  const response = await api.delete(`/api/issuance-profiles/${id}`)
  return response.data
}

export async function getIssuances(params?: {
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<ApiResponse<PageData<Issuance>>> {
  const query = new URLSearchParams({
    p: String(params?.page ?? 1),
    page_size: String(params?.pageSize ?? 30),
  })
  if (params?.keyword) query.set('keyword', params.keyword)
  const response = await api.get(`/api/issuances/?${query}`)
  return response.data
}

export async function issueAccess(
  payload: IssueAccessPayload
): Promise<ApiResponse<IssueAccessResult>> {
  const response = await api.post('/api/issuances/', payload)
  return response.data
}

export async function revokeIssuance(
  id: number
): Promise<ApiResponse<Issuance>> {
  const response = await api.post(`/api/issuances/${id}/revoke`)
  return response.data
}

export async function getUpstreamHealth(
  refreshQuota = false
): Promise<ApiResponse<UpstreamHealth>> {
  const response = await api.get('/api/iterloop/upstream-health', {
    params: refreshQuota ? { refresh_quota: 1 } : undefined,
    disableDuplicate: refreshQuota,
  })
  return response.data
}

export async function getIterLoopPricingSettings(): Promise<
  ApiResponse<IterLoopPricingSettings>
> {
  const response = await api.get('/api/iterloop/pricing-settings')
  return response.data
}

export async function updateIterLoopPricingSettings(payload: {
  codex_ratio: number
  claude_ratio: number
  grok_ratio: number
  confirm: boolean
}): Promise<ApiResponse<IterLoopPricingPreview>> {
  const response = await api.put('/api/iterloop/pricing-settings', payload)
  return response.data
}
