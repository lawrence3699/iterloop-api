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
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import i18next from 'i18next'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import { installBuildMetadata } from '@/lib/build-metadata'
import { applyFaviconToDom } from '@/lib/dom-utils'
import { initializeFrontendCache } from '@/lib/frontend-cache'
import { useAuthStore } from '@/stores/auth-store'

import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
import { fullTranslationReady } from './i18n/config'
// Generated Routes
import { routeTree } from './routeTree.gen'

// Keep the public shell paintable while the full application stylesheet loads.
import './styles/critical.css'

// Clone design-system layer (tokens + .il-* utilities + motion) — loaded
// eagerly so the restyled public shell (header/footer) paints correctly.
import './styles/clone.css'

// Ensure VChart theme is initialized before any chart mounts (prevents white default theme flash)
// VChart theme is driven by our ThemeProvider (html.light/html.dark) via per-chart `theme` prop.
initializeFrontendCache()
installBuildMetadata()

function getHttpStatus(error: unknown) {
  if (typeof error !== 'object' || error === null) return undefined
  const response = (error as { response?: unknown }).response
  if (typeof response !== 'object' || response === null) return undefined
  const status = (response as { status?: unknown }).status
  return typeof status === 'number' ? status : undefined
}

function showErrorToast(message: string) {
  void import('sonner').then(({ toast }) => toast.error(message))
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return ![401, 403].includes(getHttpStatus(error) ?? 0)
      },
      // Keep focused tabs from silently re-running heavy pages like logs.
      refetchOnWindowFocus: false,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        void import('@/lib/handle-server-error').then(({ handleServerError }) =>
          handleServerError(error)
        )
        if (getHttpStatus(error) === 304) {
          showErrorToast(i18next.t('Content not modified!'))
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      const status = getHttpStatus(error)
      if (status !== undefined) {
        if (status === 401) {
          showErrorToast(i18next.t('Session expired!'))
          useAuthStore.getState().auth.reset()
          const redirect = `${router.history.location.href}`
          router.navigate({ to: '/sign-in', search: { redirect } })
        }
        if (status === 500) {
          showErrorToast(i18next.t('Internal Server Error!'))
          router.navigate({ to: '/500' })
        }
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.querySelector<HTMLElement>('#root')
if (!rootElement) {
  throw new Error('Missing application root element')
}
const appRootElement = rootElement
// Set document.title and favicon from cached status, then refresh from network
;(function initSystemBranding() {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    const apply = (name: string) => {
      document.title = name
      const metaTitle = document.querySelector(
        'meta[name="title"]'
      ) as HTMLMetaElement | null
      if (metaTitle) metaTitle.setAttribute('content', name)
    }
    // Cache-first
    try {
      const saved = localStorage.getItem('status')
      if (saved) {
        const s = JSON.parse(saved)
        if (s?.system_name) apply(s.system_name)
        if (s?.logo) applyFaviconToDom(s.logo)
      }
    } catch {
      /* empty */
    }
    // Background refresh
    window.setTimeout(() => {
      fetch('/api/status', { headers: { Accept: 'application/json' } })
        .then(async (response) => {
          if (!response.ok) throw new Error(String(response.status))
          const payload = (await response.json()) as {
            data?: Record<string, unknown>
          }
          return payload.data
        })
        .then((s) => {
          if (s?.system_name) {
            apply(s.system_name as string)
            try {
              localStorage.setItem('status', JSON.stringify(s))
            } catch {
              /* empty */
            }
          }
          if (s?.logo) applyFaviconToDom(s.logo as string)
        })
        .catch(() => {
          /* empty */
        })
    }, 0)
  } catch {
    /* empty */
  }
})()
function renderApp() {
  if (appRootElement.innerHTML) return

  ReactDOM.createRoot(appRootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}

const isInitialHome = window.location.pathname === '/'
const initialRouteReady = isInitialHome
  ? import('@/features/home')
  : Promise.resolve()

void initialRouteReady.catch((error: unknown) => {
  // The router retries the route import while keeping its normal error UI.
  // eslint-disable-next-line no-console
  console.error('Failed to preload the initial route:', error)
})

function markFullExperienceReady() {
  document.documentElement.dataset.iterloopReady = 'true'
}

if (isInitialHome) {
  renderApp()
  const fullStyleDelay = window.matchMedia('(prefers-reduced-motion: reduce)')
    .matches
    ? 0
    : 5000
  const fullStylesReady = new Promise<void>((resolve, reject) => {
    window.setTimeout(() => {
      void import('./styles/index.css').then(() => resolve(), reject)
    }, fullStyleDelay)
  })
  void Promise.all([fullStylesReady, fullTranslationReady]).then(
    markFullExperienceReady
  )
} else {
  void Promise.all([import('./styles/index.css'), fullTranslationReady])
    .then(() => {
      renderApp()
      markFullExperienceReady()
    })
    .catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize the full application:', error)
      renderApp()
    })
}
