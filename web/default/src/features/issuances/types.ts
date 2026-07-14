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
export type IssuanceMode = 'codex' | 'claude' | 'grok' | 'combined' | 'split'
export type IssuanceStatus = 'active' | 'revoked'

export interface IssuanceProfile {
  id: number
  name: string
  description: string
  mode: IssuanceMode
  balance_quota: number
  key_quota: number
  unlimited_quota: boolean
  key_count: number
  expire_days: number
  codex_models: string
  claude_models: string
  grok_models: string
  codex_group: string
  claude_group: string
  grok_group: string
  combined_group: string
  allow_ips: string
  enabled: boolean
  created_time: number
  updated_time: number
  created_by: number
}

export type IssuanceProfilePayload = Omit<
  IssuanceProfile,
  'id' | 'created_time' | 'updated_time' | 'created_by'
>

export interface Issuance {
  id: number
  profile_id: number
  user_id: number
  email: string
  status: IssuanceStatus
  balance_granted: number
  token_ids: string
  note: string
  created_by: number
  created_time: number
  revoked_time: number
}

export interface IssuedCredential {
  token_id: number
  name: string
  api_key: string
  group: string
  models: string[]
  expires_at: number
  unlimited: boolean
  quota: number
}

export interface IssuedUser {
  id: number
  username: string
  email: string
  quota: number
}

export interface IssueAccessResult {
  issuance: Issuance
  user: IssuedUser
  credentials: IssuedCredential[]
  account_created: boolean
  temporary_password?: string
}

export interface IssueAccessPayload {
  profile_id: number
  email: string
  note: string
  balance_quota?: number
  key_quota?: number
  expire_days?: number
}

export interface UpstreamAccountSummary {
  total: number
  active: number
  disabled: number
  error: number
  unavailable: number
  codex: number
  claude: number
  xai: number
  xai_active: number
  xai_failed: number
  xai_spending_limit: number
}

export interface UpstreamQuotaSummary {
  queried: number
  failed: number
  below_thirty: number
  exhausted: number
  five_hour_average_remaining?: number
  weekly_average_remaining?: number
  five_hour_minimum_remaining?: number
  weekly_minimum_remaining?: number
}

export interface UpstreamHealth {
  configured: boolean
  accounts: UpstreamAccountSummary
  quota?: UpstreamQuotaSummary
  updated_at: number
  message?: string
}

export interface IterLoopPricingSettings {
  enabled: boolean
  codex_ratio: number
  claude_ratio: number
  grok_ratio: number
  combined_mode: string
}

export interface IterLoopPricingPreview {
  applied: boolean
  current: IterLoopPricingSettings
  preview: IterLoopPricingSettings
}

export interface PageData<T> {
  page: number
  page_size: number
  total: number
  items: T[]
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}
