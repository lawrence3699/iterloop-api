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
export function searchRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

export function optionalString(value: unknown, fallback?: string) {
  return typeof value === 'string' ? value : fallback
}

export function optionalNumber(value: unknown, fallback?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function optionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

export function enumValue<const T extends string>(
  value: unknown,
  values: readonly T[],
  fallback?: T
) {
  return typeof value === 'string' && values.includes(value as T)
    ? (value as T)
    : fallback
}

export function stringArray<const T extends string = string>(
  value: unknown,
  values?: readonly T[]
): T[] {
  if (!Array.isArray(value)) return []
  const strings = value.filter(
    (item): item is string => typeof item === 'string'
  )
  return values
    ? strings.filter((item): item is T => values.includes(item as T))
    : (strings as T[])
}
