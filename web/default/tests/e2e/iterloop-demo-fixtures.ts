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

export type DemoLanguage = 'en' | 'zhCN'

export const DEMO_DATE = '2026-07-15T04:00:00.000Z'
export const DEMO_NOW = 1_784_088_000

export const DEMO_USER = {
  id: 1,
  username: 'demo-admin',
  display_name: 'IterLoop Demo',
  email: 'demo@iter-loop.com',
  role: 100,
  status: 1,
  group: 'default',
  quota: 248_620_000,
  used_quota: 51_380_000,
  request_count: 1_284,
  permissions: { sidebar_settings: true },
}

const API_KEYS = [
  {
    id: 101,
    name: 'Production Codex',
    key: 'i••••••3f92',
    status: 1,
    remain_quota: 120_000_000,
    used_quota: 18_420_000,
    unlimited_quota: false,
    expired_time: -1,
    created_time: DEMO_NOW - 86_400 * 30,
    accessed_time: DEMO_NOW - 72,
    group: 'codex',
    cross_group_retry: false,
    model_limits_enabled: true,
    model_limits: 'gpt-5.5,gpt-5.4',
    allow_ips: '',
  },
  {
    id: 102,
    name: 'Claude research',
    key: 'i••••••a821',
    status: 1,
    remain_quota: 80_000_000,
    used_quota: 9_834_000,
    unlimited_quota: false,
    expired_time: DEMO_NOW + 86_400 * 60,
    created_time: DEMO_NOW - 86_400 * 18,
    accessed_time: DEMO_NOW - 140,
    group: 'claude',
    cross_group_retry: false,
    model_limits_enabled: true,
    model_limits: 'claude-sonnet-4-6',
    allow_ips: '',
  },
  {
    id: 103,
    name: 'Team sandbox',
    key: 'i••••••11c4',
    status: 1,
    remain_quota: 30_000_000,
    used_quota: 4_262_000,
    unlimited_quota: false,
    expired_time: DEMO_NOW + 86_400 * 12,
    created_time: DEMO_NOW - 86_400 * 4,
    accessed_time: DEMO_NOW - 312,
    group: 'default',
    cross_group_retry: true,
    model_limits_enabled: false,
    model_limits: '',
    allow_ips: '10.0.0.0/8',
  },
]

const USAGE_LOGS = [
  {
    id: 401,
    user_id: 1,
    created_at: DEMO_NOW - 32,
    type: 2,
    content: '',
    username: 'demo-admin',
    token_name: 'Production Codex',
    model_name: 'gpt-5.5',
    quota: 184_200,
    prompt_tokens: 14_320,
    completion_tokens: 4_100,
    use_time: 1.8,
    is_stream: true,
    channel: 12,
    channel_name: 'Codex official',
    token_id: 101,
    group: 'codex',
    ip: '203.0.113.24',
    other: JSON.stringify({ frt: 0.42, usage_billing_path: 'upstream' }),
    request_id: 'req_demo_7f92',
    upstream_request_id: 'up_demo_21a8',
  },
  {
    id: 402,
    user_id: 1,
    created_at: DEMO_NOW - 108,
    type: 2,
    content: '',
    username: 'demo-admin',
    token_name: 'Claude research',
    model_name: 'claude-sonnet-4-6',
    quota: 98_340,
    prompt_tokens: 7_600,
    completion_tokens: 2_234,
    use_time: 2.1,
    is_stream: true,
    channel: 18,
    channel_name: 'Claude official',
    token_id: 102,
    group: 'claude',
    ip: '203.0.113.24',
    other: JSON.stringify({ frt: 0.51, usage_billing_path: 'upstream' }),
    request_id: 'req_demo_17d3',
    upstream_request_id: 'up_demo_8c41',
  },
  {
    id: 403,
    user_id: 1,
    created_at: DEMO_NOW - 221,
    type: 2,
    content: '',
    username: 'demo-admin',
    token_name: 'Team sandbox',
    model_name: 'gpt-5.4',
    quota: 42_620,
    prompt_tokens: 3_180,
    completion_tokens: 1_082,
    use_time: 0.9,
    is_stream: false,
    channel: 12,
    channel_name: 'Codex official',
    token_id: 103,
    group: 'default',
    ip: '198.51.100.8',
    other: JSON.stringify({ frt: 0.31, usage_billing_path: 'upstream' }),
    request_id: 'req_demo_b441',
    upstream_request_id: 'up_demo_44d2',
  },
]

const QUOTA_DATA = Array.from({ length: 12 }, (_, index) => {
  let modelName = 'gpt-5.5'
  if (index % 3 === 0) modelName = 'claude-sonnet-4-6'
  else if (index % 2 === 0) modelName = 'gpt-5.4'

  return {
    created_at: DEMO_NOW - (11 - index) * 7_200,
    model_name: modelName,
    token_used: 18_000 + index * 1_900,
    count: 72 + index * 7,
    quota: 900_000 + index * 65_000,
  }
})

function getProfiles(language: DemoLanguage) {
  const isChinese = language === 'zhCN'
  return [
    {
      id: 1,
      name: isChinese ? 'Codex 开发者' : 'Codex Developer',
      description: isChinese
        ? '适合日常代码与代理任务'
        : 'For daily coding and agent work',
      mode: 'codex',
      balance_quota: 50_000_000,
      key_quota: 50_000_000,
      unlimited_quota: false,
      key_count: 1,
      expire_days: 30,
      codex_models: 'gpt-5.5,gpt-5.4',
      claude_models: '',
      grok_models: '',
      codex_group: 'codex',
      claude_group: '',
      grok_group: '',
      combined_group: '',
      allow_ips: '',
      enabled: true,
      created_time: DEMO_NOW - 86_400 * 90,
      updated_time: DEMO_NOW - 86_400,
      created_by: 1,
    },
    {
      id: 2,
      name: isChinese ? '研究组合' : 'Research Bundle',
      description: isChinese
        ? 'Codex 与 Claude 双通道'
        : 'Codex and Claude channels',
      mode: 'split',
      balance_quota: 100_000_000,
      key_quota: 50_000_000,
      unlimited_quota: false,
      key_count: 2,
      expire_days: 60,
      codex_models: 'gpt-5.5',
      claude_models: 'claude-sonnet-4-6',
      grok_models: '',
      codex_group: 'codex',
      claude_group: 'claude',
      grok_group: '',
      combined_group: '',
      allow_ips: '',
      enabled: true,
      created_time: DEMO_NOW - 86_400 * 45,
      updated_time: DEMO_NOW - 3_600,
      created_by: 1,
    },
  ]
}

const ISSUANCES = [
  {
    id: 71,
    profile_id: 1,
    user_id: 21,
    email: 'dev•••@example.com',
    status: 'active',
    balance_granted: 50_000_000,
    token_ids: '301',
    note: 'July developer seat',
    created_by: 1,
    created_time: DEMO_NOW - 86_400 * 3,
    revoked_time: 0,
  },
  {
    id: 72,
    profile_id: 2,
    user_id: 22,
    email: 'lab•••@example.com',
    status: 'active',
    balance_granted: 100_000_000,
    token_ids: '302,303',
    note: 'Research workspace',
    created_by: 1,
    created_time: DEMO_NOW - 86_400,
    revoked_time: 0,
  },
]

export function getDemoApiPayload(
  pathname: string,
  language: DemoLanguage = 'zhCN'
): unknown {
  if (pathname === '/api/status') {
    return {
      system_name: 'IterLoop API',
      logo: '/logo.png',
      register_enabled: true,
      password_login_enabled: true,
      self_use_mode_enabled: false,
      version: 'visual-test',
    }
  }
  if (pathname === '/api/setup') return { status: true }
  if (pathname === '/api/user/self') return DEMO_USER
  if (pathname === '/api/user/models') {
    return ['gpt-5.5', 'gpt-5.4', 'claude-sonnet-4-6']
  }
  if (pathname === '/api/user/self/groups') {
    return {
      default: { desc: 'Default', ratio: 1 },
      codex: { desc: 'Codex', ratio: 0.4 },
      claude: { desc: 'Claude', ratio: 0.7 },
    }
  }
  if (pathname === '/api/token/') {
    return { items: API_KEYS, total: API_KEYS.length, page: 1, page_size: 10 }
  }
  if (pathname === '/api/data/self') return QUOTA_DATA
  if (pathname === '/api/perf-metrics/summary') {
    return {
      models: [
        {
          model_name: 'gpt-5.5',
          avg_latency_ms: 1_830,
          success_rate: 99.8,
          avg_tps: 76.4,
          recent_success_rates: [99.4, 99.8, 100],
          request_count: 821,
        },
        {
          model_name: 'claude-sonnet-4-6',
          avg_latency_ms: 2_120,
          success_rate: 99.5,
          avg_tps: 63.8,
          recent_success_rates: [99.2, 99.5, 99.8],
          request_count: 337,
        },
      ],
    }
  }
  if (pathname === '/api/uptime/status') {
    return [
      {
        categoryName: 'Model API',
        monitors: [
          { name: 'Codex', uptime: 0.9998, status: 2 },
          { name: 'Claude', uptime: 0.9995, status: 2 },
        ],
      },
    ]
  }
  if (pathname === '/api/log') {
    return {
      items: USAGE_LOGS,
      total: USAGE_LOGS.length,
      page: 1,
      page_size: 20,
    }
  }
  if (pathname === '/api/log/stat') {
    return { quota: 325_160, rpm: 18, tpm: 32_516 }
  }
  if (pathname === '/api/issuance-profiles/') {
    const profiles = getProfiles(language)
    return {
      page: 1,
      page_size: 100,
      total: profiles.length,
      items: profiles,
    }
  }
  if (pathname === '/api/issuances/') {
    return {
      page: 1,
      page_size: 30,
      total: ISSUANCES.length,
      items: ISSUANCES,
    }
  }
  if (pathname === '/api/iterloop/upstream-health') {
    return {
      configured: true,
      accounts: {
        total: 6,
        active: 5,
        disabled: 0,
        error: 0,
        unavailable: 1,
        codex: 3,
        claude: 2,
        xai: 1,
        xai_active: 0,
        xai_failed: 0,
        xai_spending_limit: 0,
      },
      quota: {
        queried: 5,
        failed: 0,
        below_thirty: 1,
        exhausted: 0,
        five_hour_average_remaining: 72,
        weekly_average_remaining: 81,
      },
      updated_at: DEMO_NOW,
    }
  }
  if (pathname === '/api/iterloop/pricing-settings') {
    return {
      enabled: true,
      codex_ratio: 0.4,
      claude_ratio: 0.7,
      grok_ratio: 1,
      combined_mode: 'split',
    }
  }
  if (pathname === '/api/user/topup/info') {
    return {
      enable_online_topup: false,
      enable_stripe_topup: false,
      pay_methods: [],
      min_topup: 10,
      stripe_min_topup: 10,
      amount_options: [10, 25, 50, 100],
      discount: {},
      enable_redemption: true,
      payment_compliance_confirmed: true,
    }
  }
  if (pathname === '/api/user/topup' || pathname === '/api/user/topup/self') {
    return { items: [], total: 0 }
  }
  if (pathname === '/api/user/aff') return 'ITERLOOP-DEMO'
  if (pathname === '/api/notice' || pathname === '/api/home_page_content') {
    return ''
  }
  return null
}
