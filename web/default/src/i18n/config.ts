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
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { convertDetectedLanguage, toIntlLocale } from './languages'

const localeLoaders = {
  en: () => import('./locales/en.json'),
  zhCN: () => import('./locales/zh.json'),
  fr: () => import('./locales/fr.json'),
  ru: () => import('./locales/ru.json'),
  ja: () => import('./locales/ja.json'),
  vi: () => import('./locales/vi.json'),
  zhTW: () => import('./locales/zh-TW.json'),
} as const

type SupportedLanguage = keyof typeof localeLoaders

const criticalZhCN: Record<string, string> = {
  'Your coding agents. Connected in one click.': '你的编码代理，一键连接。',
  'Configure Codex Desktop, Codex CLI, and Claude Code with one secure IterLoop account. See usage and cost without storing prompt or response content.':
    '用一个安全的 IterLoop 账户配置 Codex Desktop、Codex CLI 与 Claude Code；无需存储提示词或响应正文，也能查看用量和费用。',
  'Coming soon': '即将推出',
  'Open console': '打开控制台',
  'Create an account': '创建账户',
  'Read the setup guide': '阅读配置指南',
  'Secure credential storage': '安全凭据存储',
  'Windows and macOS': 'Windows 与 macOS',
  'Manual setup always available': '始终支持手动配置',
  'IterLoop Desktop connections dashboard': 'IterLoop Desktop 连接面板',
  Models: '模型',
  Pricing: '定价',
  Connect: '接入',
  Docs: '文档',
  Status: '状态',
  Search: '搜索',
  'Sign in': '登录',
  'Open menu': '打开菜单',
  'Close menu': '关闭菜单',
  Explore: '浏览',
  'Models and pricing': '模型与价格',
  'Quick links': '快速链接',
  Account: '账户',
  'API docs': 'API 文档',
  'Service status': '服务状态',
  'Main navigation': '主导航',
  'Mobile navigation': '移动端导航',
  'For your': '为你的',
  'The native LLM router': '原生 LLM 路由',
  'Official models': '官方模型',
  'up to 90% off': '低至一折',
  'OpenAI protocol': 'OpenAI 协议',
  'Anthropic protocol': 'Anthropic 协议',
  'Copy Router Base URL': '复制路由 Base URL',
  'Get API Key': '获取 API Key',
  'Download app': '下载应用',
  'No setup required': '无需配置',
}

const loadedLanguages = new Set<string>()
const loadingLanguages = new Map<string, Promise<void>>()

async function loadLanguageResources(language: string) {
  const normalizedLanguage = convertDetectedLanguage(language)
  if (loadedLanguages.has(normalizedLanguage)) return

  const existingRequest = loadingLanguages.get(normalizedLanguage)
  if (existingRequest) return existingRequest

  const loader = localeLoaders[normalizedLanguage as SupportedLanguage]
  if (!loader) return

  const request = (async () => {
    const module = await loader()
    i18n.addResourceBundle(
      normalizedLanguage,
      'translation',
      module.default.translation,
      true,
      true
    )

    if (normalizedLanguage === 'zhCN') {
      const { iterLoopZhCN } = await import('./iterloop-translations')
      i18n.addResourceBundle(
        normalizedLanguage,
        'translation',
        iterLoopZhCN,
        true,
        true
      )
    }

    loadedLanguages.add(normalizedLanguage)
  })()

  loadingLanguages.set(normalizedLanguage, request)
  try {
    await request
  } finally {
    loadingLanguages.delete(normalizedLanguage)
  }
}

const initialLanguage = (() => {
  try {
    return window.localStorage.getItem('i18nextLng') || 'zhCN'
  } catch {
    return 'zhCN'
  }
})()

function applyDocumentLanguage(language: string) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = toIntlLocale(language) ?? 'en'
}

export const i18nReady = i18n.use(initReactI18next).init({
  initAsync: false,
  lng: initialLanguage,
  fallbackLng: {
    zhCN: [],
    default: ['en'],
  },
  supportedLngs: ['en', 'zhCN', 'fr', 'ru', 'ja', 'vi', 'zhTW'],
  load: 'currentOnly',
  resources: {
    en: { translation: {} },
    zhCN: { translation: criticalZhCN },
  },
  nsSeparator: false, // Allow literal colons in keys (e.g., URLs, labels)
  debug: import.meta.env.DEV,
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
  detection: {
    order: ['localStorage'],
    caches: ['localStorage'],
    // Browsers report `zh-CN`/`zh-TW`/`zh`; map them onto our `zhCN`/`zhTW`
    // codes (non-Chinese codes pass through for normal supportedLngs matching).
    convertDetectedLanguage,
  },
  react: {
    bindI18nStore: 'added',
  },
})

i18n.on('languageChanged', (language) => {
  applyDocumentLanguage(language)
  try {
    window.localStorage.setItem('i18nextLng', language)
  } catch {
    /* empty */
  }
  void loadLanguageResources(language).catch((error: unknown) => {
    // Keep source-language keys available if a locale chunk cannot be loaded.
    // eslint-disable-next-line no-console
    console.error('Failed to load translations:', error)
  })
})
export const fullTranslationReady = i18nReady.then(async () => {
  const language = i18n.resolvedLanguage || initialLanguage
  applyDocumentLanguage(language)
  try {
    window.localStorage.setItem('i18nextLng', language)
  } catch {
    /* empty */
  }
  const shouldDefer =
    window.location.pathname === '/' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (shouldDefer) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 5000))
  }
  await loadLanguageResources(language).catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Failed to load translations:', error)
  })
})

export default i18n
