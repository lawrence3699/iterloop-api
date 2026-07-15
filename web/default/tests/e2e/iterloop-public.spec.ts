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

const STATUS_FIXTURE = {
  system_name: 'IterLoop API',
  logo: '/logo.png',
  register_enabled: true,
  password_login_enabled: true,
  self_use_mode_enabled: false,
  version: 'visual-test',
}

const VIEWPORTS = [
  { name: '1728x900', width: 1728, height: 900 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '390x844', width: 390, height: 844 },
] as const

const QA_STYLES = `
  button[aria-label='Open Tanstack query devtools'],
  button[aria-label='Open TanStack Router Devtools'] {
    display: none !important;
  }
  * {
    caret-color: transparent !important;
  }
`

async function preparePage(
  page: Page,
  options: { language?: 'en' | 'zhCN'; theme?: 'dark' | 'light' } = {}
) {
  const language = options.language ?? 'zhCN'
  const theme = options.theme ?? 'light'

  await page.addInitScript(
    ({ initialLanguage, initialTheme }) => {
      if (!window.localStorage.getItem('i18nextLng')) {
        window.localStorage.setItem('i18nextLng', initialLanguage)
      }
      if (!document.cookie.includes('vite-ui-theme=')) {
        document.cookie = `vite-ui-theme=${initialTheme}; path=/; SameSite=Lax`
      }
    },
    { initialLanguage: language, initialTheme: theme }
  )
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    let payload: { success: boolean; data: unknown } = {
      success: true,
      data: null,
    }
    if (pathname === '/api/status') {
      payload = { success: true, data: STATUS_FIXTURE }
    } else if (pathname === '/api/setup') {
      payload = { success: true, data: { status: true } }
    } else if (pathname === '/api/home_page_content') {
      payload = { success: true, data: '' }
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  })
}

async function settlePage(page: Page) {
  await page.addStyleTag({ content: QA_STYLES })
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

async function openHome(
  page: Page,
  options: { language?: 'en' | 'zhCN'; theme?: 'dark' | 'light' } = {}
) {
  await preparePage(page, options)
  await page.goto('/')
  const heading =
    options.language === 'en'
      ? 'One key, connected to the models you need.'
      : '一个 Key，连接你需要的模型。'
  await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  await settlePage(page)
}

test.describe('IterLoop public visual baselines', () => {
  for (const viewport of VIEWPORTS) {
    test(`Chinese light homepage at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openHome(page)

      await expect(page).toHaveScreenshot(
        `home-zh-light-${viewport.name}.png`,
        { animations: 'disabled', caret: 'hide', fullPage: false }
      )
    })
  }

  for (const viewport of [VIEWPORTS[1], VIEWPORTS[3]]) {
    test(`English dark homepage at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openHome(page, { language: 'en', theme: 'dark' })
      await expect(page.locator('html')).toHaveClass(/dark/)

      await expect(page).toHaveScreenshot(`home-en-dark-${viewport.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false,
      })
    })
  }

  for (const viewport of [VIEWPORTS[1], VIEWPORTS[3]]) {
    test(`Chinese sign-in at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await preparePage(page)
      await page.goto('/sign-in')
      await expect(
        page.getByRole('heading', { name: '登录 IterLoop API' })
      ).toBeVisible()
      await settlePage(page)

      await expect(page).toHaveScreenshot(
        `sign-in-zh-light-${viewport.name}.png`,
        { animations: 'disabled', caret: 'hide', fullPage: false }
      )
    })
  }

  test('Chinese docs desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1])
    await preparePage(page)
    await page.goto('/docs')
    await expect(
      page.getByRole('heading', { name: '接入 Codex、Claude 与 Grok' })
    ).toBeVisible()
    await settlePage(page)

    await expect(page).toHaveScreenshot('docs-zh-light-1440x900.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
    })
  })
})

test.describe('IterLoop public interactions', () => {
  test('desktop Mega Menu opens and Escape restores focus', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS[1])
    await openHome(page)

    const modelsButton = page.getByRole('button', { name: '模型' })
    await modelsButton.click()
    await expect(modelsButton).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.iterloop-mega-menu')).toHaveClass(/is-open/)
    await modelsButton.press('Escape')
    await expect(modelsButton).toHaveAttribute('aria-expanded', 'false')
    await expect(modelsButton).toBeFocused()
  })

  test('mobile menu opens without horizontal page overflow', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS[3])
    await openHome(page)

    const menuButton = page.getByRole('button', { name: '打开菜单' })
    await menuButton.click()
    await expect(page.locator('.iterloop-mobile-menu')).toHaveClass(/is-open/)
    await expect(
      page.getByRole('navigation', { name: '移动端导航' })
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.iterloop-mobile-menu')).not.toHaveClass(
      /is-open/
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth === window.innerWidth
      )
    ).toBe(true)
  })

  test('shelf arrows and copy feedback work', async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.setViewportSize(VIEWPORTS[1])
    await openHome(page)

    const previousButton = page.getByRole('button', { name: '上一项' })
    const nextButton = page.getByRole('button', { name: '下一项' })
    await expect(previousButton).toBeDisabled()
    await nextButton.click()
    await expect(previousButton).toBeEnabled()

    const deliveryCard = page
      .locator('.iterloop-product-card')
      .filter({ hasText: '客户端配置' })
    const copyButton = deliveryCard.locator('button')
    await expect(copyButton).toHaveAttribute('aria-label', '复制配置')
    await copyButton.click()
    await expect(copyButton).toHaveAttribute('aria-label', '已复制')
  })

  test('language and theme persist after reload', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1])
    await openHome(page)

    await page.getByRole('button', { name: '更改语言' }).click()
    await page.getByRole('menuitem', { name: 'English' }).click()
    await expect(
      page.getByRole('heading', {
        name: 'One key, connected to the models you need.',
      })
    ).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('heading', {
        name: 'One key, connected to the models you need.',
      })
    ).toBeVisible()

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.getByRole('menuitem', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('reduced motion renders all story scenes statically', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS[1])
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openHome(page)

    const story = page.locator('.iterloop-scroll-story')
    await expect
      .poll(() =>
        page.evaluate(
          () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
        )
      )
      .toBe(true)
    await expect(story).toHaveClass(/is-reduced/)
    await expect(story.locator('.iterloop-story-static article')).toHaveCount(3)
    await expect(story.locator('.iterloop-story-sticky')).toHaveCount(0)
  })
})

test.describe('IterLoop scroll storytelling', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('activates the expected copy at start, middle, and end', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS[1])
    await openHome(page)

    const story = page.locator('.iterloop-scroll-story')
    const copyOpacity = async () =>
      story
        .locator('.iterloop-story-copy')
        .evaluateAll((elements) =>
          elements.map((element) => Number(getComputedStyle(element).opacity))
        )
    const scrollToProgress = async (progress: number) => {
      await story.evaluate((element, nextProgress) => {
        const top = (element as HTMLElement).offsetTop
        const distance =
          (element as HTMLElement).offsetHeight - window.innerHeight
        window.scrollTo(0, top + distance * nextProgress)
      }, progress)
    }

    await scrollToProgress(0)
    await expect.poll(copyOpacity).toEqual([1, 0, 0])
    await scrollToProgress(0.5)
    await expect.poll(copyOpacity).toEqual([0, 1, 0])
    await scrollToProgress(0.88)
    await expect.poll(copyOpacity).toEqual([0, 0, 1])
  })
})

test.describe('IterLoop local performance guard', () => {
  test('homepage stays within the LCP and CLS acceptance targets', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS[1])
    await page.addInitScript(() => {
      const vitals = { cls: 0, lcp: 0 }
      ;(
        window as Window & {
          __iterloopVitals?: { cls: number; lcp: number }
        }
      ).__iterloopVitals = vitals

      if (
        PerformanceObserver.supportedEntryTypes.includes(
          'largest-contentful-paint'
        )
      ) {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const latest = entries.at(-1)
          if (latest) vitals.lcp = latest.startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })
      }

      if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              hadRecentInput: boolean
              value: number
            }
            if (!shift.hadRecentInput) vitals.cls += shift.value
          }
        }).observe({ type: 'layout-shift', buffered: true })
      }
    })
    await openHome(page)

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as Window & {
                __iterloopVitals?: { cls: number; lcp: number }
              }
            ).__iterloopVitals?.lcp ?? 0
        )
      )
      .toBeGreaterThan(0)

    const vitals = await page.evaluate(
      () =>
        (
          window as Window & {
            __iterloopVitals?: { cls: number; lcp: number }
          }
        ).__iterloopVitals
    )
    expect(vitals?.lcp).toBeLessThanOrEqual(2500)
    expect(vitals?.cls).toBeLessThanOrEqual(0.1)
  })
})
