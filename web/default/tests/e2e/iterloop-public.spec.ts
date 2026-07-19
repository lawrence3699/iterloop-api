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
import { expect, test, type Page } from '@playwright/test'

import {
  DEMO_DATE,
  DEMO_PRICING_RESPONSE,
  DEMO_USER,
  getDemoApiPayload,
  type DemoLanguage,
} from './iterloop-demo-fixtures'

const VIEWPORTS = [
  { name: '1728x900', width: 1728, height: 900 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '390x844', width: 390, height: 844 },
] as const

const QA_STYLES = `
  button[aria-label='Open Tanstack query devtools'],
  button[aria-label='Open TanStack Router Devtools'] { display: none !important; }
  * { caret-color: transparent !important; }
`

async function preparePage(
  page: Page,
  options: {
    authenticated?: boolean
    language?: DemoLanguage
    theme?: 'dark' | 'light'
  } = {}
) {
  const language = options.language ?? 'zhCN'
  const theme = options.theme ?? 'light'
  await page.clock.setFixedTime(new Date(DEMO_DATE))
  await page.addInitScript(
    ({ authenticated, initialLanguage, initialTheme, user }) => {
      window.localStorage.setItem('i18nextLng', initialLanguage)
      document.cookie = `vite-ui-theme=${initialTheme}; path=/; SameSite=Lax`
      if (authenticated) {
        window.localStorage.setItem('user', JSON.stringify(user))
      } else {
        window.localStorage.removeItem('user')
      }
    },
    {
      authenticated: options.authenticated ?? false,
      initialLanguage: language,
      initialTheme: theme,
      user: DEMO_USER,
    }
  )
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    const responseBody =
      pathname === '/api/pricing'
        ? DEMO_PRICING_RESPONSE
        : { success: true, data: getDemoApiPayload(pathname, language) }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    })
  })
}

async function settlePage(page: Page) {
  await page.waitForFunction(
    () => document.documentElement.dataset.iterloopReady === 'true'
  )
  await page.addStyleTag({ content: QA_STYLES })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      [...document.images].map(
        (image) =>
          image.complete ||
          new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true })
            image.addEventListener('error', () => resolve(), { once: true })
          })
      )
    )
  })
}

async function openHome(
  page: Page,
  options: { language?: DemoLanguage; theme?: 'dark' | 'light' } = {}
) {
  await preparePage(page, options)
  await page.goto('/')
  const heading =
    options.language === 'en'
      ? 'Your coding agents. Connected in one click.'
      : '你的编码代理，一键连接。'
  await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  await settlePage(page)
}

test.describe('Download-first public experience', () => {
  for (const viewport of VIEWPORTS) {
    test(`Chinese light homepage at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openHome(page)
      await expect(page).toHaveScreenshot(
        `download-home-zh-light-${viewport.name}.png`,
        {
          animations: 'disabled',
          caret: 'hide',
          fullPage: false,
        }
      )
    })
  }

  test('English dark homepage', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1])
    await openHome(page, { language: 'en', theme: 'dark' })
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page).toHaveScreenshot('download-home-en-dark-1440x900.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
    })
  })

  test('shows only the 16 production models and no disabled providers', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS[1])
    await openHome(page, { language: 'en' })
    const pricing = page.getByRole('region', {
      name: 'Production model pricing',
    })
    await pricing.scrollIntoViewIfNeeded()
    await expect(pricing.locator('article')).toHaveCount(16)
    const text = await page.locator('body').innerText()
    expect(text).not.toMatch(/Google|DeepSeek|GLM|Grok/)
    expect(text).not.toContain('Codex and Claude are verified')
  })

  test('download channels are explicitly coming soon', async ({ page }) => {
    await openHome(page, { language: 'en' })
    await expect(
      page.getByRole('button', { name: /macOS.*Coming soon/ })
    ).toBeDisabled()
    await expect(
      page.getByRole('button', { name: /Windows.*Coming soon/ })
    ).toBeDisabled()
  })
})

test.describe('Documentation', () => {
  test('redirects /docs to Codex Desktop and opens the screenshot lightbox', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS[1])
    await preparePage(page, { language: 'en' })
    await page.goto('/docs')
    await expect(page).toHaveURL(/\/docs\/install-codex-desktop$/)
    await expect(
      page.getByRole('heading', { name: 'Connect Codex Desktop to IterLoop' })
    ).toBeVisible()
    await page.getByRole('button', { name: /Open screenshot/ }).click()
    await expect(
      page.getByRole('dialog', { name: 'IterLoop Desktop screenshot' })
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('API integration keeps Codex CLI and Claude Code without Grok content', async ({
    page,
  }) => {
    await preparePage(page, { language: 'en' })
    await page.goto('/docs/api-integration')
    await expect(
      page.getByRole('heading', { name: /Connect Codex CLI/ })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Claude Code', exact: true, level: 2 })
    ).toBeVisible()
    await expect(page.getByText('Grok', { exact: true })).toHaveCount(0)
  })

  for (const viewport of VIEWPORTS) {
    test(`Codex Desktop docs baseline at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await preparePage(page)
      await page.goto('/docs/install-codex-desktop')
      await expect(
        page.getByRole('heading', { name: '将 Codex Desktop 接入 IterLoop' })
      ).toBeVisible()
      await settlePage(page)
      await expect(page).toHaveScreenshot(
        `docs-desktop-zh-light-${viewport.name}.png`,
        {
          animations: 'disabled',
          caret: 'hide',
          fullPage: false,
        }
      )
    })
  }
})

test.describe('Five-tab authenticated console', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1])
    await preparePage(page, { authenticated: true, language: 'en' })
  })

  test('switches all five tabs without browser errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/dashboard')
    for (const tab of ['Billing', 'Routing', 'API Keys', 'Usage', 'Cost']) {
      await page.getByRole('link', { name: tab, exact: true }).click()
      await expect(
        page.getByRole('heading', { name: tab, exact: true, level: 1 })
      ).toBeVisible()
    }
    expect(errors).toEqual([])
  })

  test('redirects legacy URLs to the matching tabs', async ({ page }) => {
    for (const [path, tab] of [
      ['/wallet', 'billing'],
      ['/keys', 'api-keys'],
      ['/usage-logs/common', 'usage'],
      ['/dashboard/overview', 'billing'],
    ] as const) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`/dashboard\\?tab=${tab}$`))
    }
  })

  test('persists Flat and Bento layout choice', async ({ page }) => {
    await page.goto('/dashboard?tab=billing')
    await page.getByRole('button', { name: 'Flat' }).click()
    await expect(page.locator('.iterloop-dashboard')).toHaveClass(/is-flat/)
    await page.reload()
    await expect(page.locator('.iterloop-dashboard')).toHaveClass(/is-flat/)
    await page.getByRole('button', { name: 'Bento' }).click()
    await expect(page.locator('.iterloop-dashboard')).toHaveClass(/is-bento/)
  })

  test('Routing is read-only with Curated selected', async ({ page }) => {
    await page.goto('/dashboard?tab=routing')
    await expect(
      page.getByText('Curated Routing', { exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Current strategy' })
    ).toBeDisabled()
    await expect(
      page.getByRole('button', { name: 'Not available with one channel' })
    ).toHaveCount(2)
  })

  test('API Keys exposes protocol copy and key creation entry', async ({
    context,
    page,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/dashboard?tab=api-keys')
    await page.getByRole('button', { name: 'Anthropic' }).click()
    await expect(
      page.getByText('https://api.iter-loop.com', { exact: true })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Copy Base URL' }).click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('https://api.iter-loop.com')
    await page.getByRole('button', { name: 'Create API Key' }).click()
    await expect(
      page.getByText('Create API Key', { exact: true }).last()
    ).toBeVisible()
  })

  test('Usage and Cost filters query by date and key', async ({ page }) => {
    await page.goto('/dashboard?tab=usage')
    await expect(page.getByLabel('Filter by API Key')).toBeVisible()
    await page.getByLabel('Filter by API Key').selectOption('101')
    await page.getByLabel('Start date').fill('2026-07-01')
    await expect(page.getByText('Input tokens')).toBeVisible()
    await page.goto('/dashboard?tab=cost')
    await expect(page.getByText('Total cost')).toBeVisible()
    await expect(page.getByText('Model distribution')).toBeVisible()
  })

  test('avatar menu contains preferences and admin workspace', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await page
      .locator('.iterloop-console-header [data-slot="dropdown-menu-trigger"]')
      .click()
    await expect(
      page.getByText('Admin workspace', { exact: true })
    ).toBeVisible()
    await expect(page.getByText('Language', { exact: true })).toBeVisible()
    await expect(page.getByText('Theme', { exact: true })).toBeVisible()
  })

  for (const tab of [
    'billing',
    'routing',
    'api-keys',
    'usage',
    'cost',
  ] as const) {
    test(`${tab} console baseline`, async ({ page }) => {
      await page.goto(`/dashboard?tab=${tab}`)
      await settlePage(page)
      await expect(page).toHaveScreenshot(
        `console-${tab}-en-light-1440x900.png`,
        {
          animations: 'disabled',
          caret: 'hide',
          fullPage: false,
        }
      )
    })
  }

  test('mobile console has horizontal tabs and no overflow', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS[3])
    await page.goto('/dashboard?tab=usage')
    await expect(
      page.locator('.iterloop-console-navigation-mobile')
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth === window.innerWidth
      )
    ).toBe(true)
  })
})
