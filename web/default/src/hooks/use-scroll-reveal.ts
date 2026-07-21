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
import { useEffect, useLayoutEffect } from 'react'

/**
 * Scroll-reveal for `.motion-item` elements, ported 1:1 from the original
 * iter-loop.com behavior (design-reference/CloneEnhancer.tsx):
 *
 * - adds `js-motion-enabled` to <body> so clone.css can hide items pre-reveal
 *   (without JS the content stays visible),
 * - reveals each `.motion-item` by adding `.is-visible` when it intersects
 *   (rootMargin '0px 0px -8% 0px', threshold 0.06), unobserving after reveal,
 * - respects prefers-reduced-motion by revealing everything immediately.
 *
 * Call once per page that renders `.motion-item` elements. Pass a dependency
 * (e.g. a data-loaded flag) to re-scan when items mount later.
 */
export function useScrollReveal(rescanKey?: unknown) {
  // Reset reveal state before paint so above-the-fold items fade in on load.
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    const items = document.querySelectorAll<HTMLElement>('.motion-item')
    if (items.length === 0) return
    document.body.classList.add('js-motion-enabled')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    items.forEach((el) => el.classList.remove('is-visible'))
  }, [rescanKey])

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('.motion-item')
    if (items.length === 0) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    )
    items.forEach((el) => io.observe(el))

    return () => io.disconnect()
  }, [rescanKey])
}
