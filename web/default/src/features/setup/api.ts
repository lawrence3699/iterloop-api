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
import type { SetupFormValues, SetupResponse } from './types'

export async function getSetupStatus(): Promise<SetupResponse> {
  const response = await fetch(`/api/setup?t=${Date.now()}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Setup request failed: ${response.status}`)
  return response.json() as Promise<SetupResponse>
}

export async function submitSetup(
  payload: Record<string, unknown>
): Promise<SetupResponse> {
  const response = await fetch('/api/setup', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`Setup request failed: ${response.status}`)
  return response.json() as Promise<SetupResponse>
}

export function buildSetupPayload(
  values: SetupFormValues,
  rootInitialized: boolean
) {
  const { usageMode, ...rest } = values

  const basePayload = {
    SelfUseModeEnabled: usageMode === 'self',
    DemoSiteEnabled: usageMode === 'demo',
  }

  if (rootInitialized) {
    return basePayload
  }

  return {
    ...rest,
    ...basePayload,
  }
}
