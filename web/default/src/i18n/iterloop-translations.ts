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
export const iterLoopZhCN: Record<string, string> = {
  '0 means no expiry': '0 表示永不过期',
  '5-hour remaining': '5 小时剩余',
  'API docs': 'API 文档',
  'API Issuance': 'API 发放',
  'Access issued successfully': '访问权限发放成功',
  'Account amount': '账户金额',
  'Account balance amount': '账户余额金额',
  'Active accounts': '存活账号',
  'Amounts cannot be negative': '金额不能为负数',
  'Any IP': '任意 IP',
  'At least one Claude model is required': '至少需要一个 Claude 模型',
  'At least one Codex model is required': '至少需要一个 Codex 模型',
  'Claude group': 'Claude 分组',
  'Claude models': 'Claude 模型',
  'Claude only': '仅 Claude',
  'Client delivery preview': '客户交付预览',
  'Codex group': 'Codex 分组',
  'Codex models': 'Codex 模型',
  'Codex only': '仅 Codex',
  'Combined group': '混合分组',
  'Combined key': '混合 Key',
  'Comma separated': '使用英文逗号分隔',
  'Compatible endpoints': '兼容接口',
  'Connect Codex and Claude': '接入 Codex 与 Claude',
  'Copy API key': '复制 API Key',
  'Copy Base URL': '复制 Base URL',
  'Copy all': '复制全部',
  'Copy complete delivery': '复制完整交付信息',
  'Copy temporary password': '复制临时密码',
  'Create account': '创建账户',
  'Create an issuance profile first': '请先创建发放方案',
  'Create first profile': '创建第一个方案',
  'Create or select an issuance profile to preview delivery.':
    '创建或选择发放方案后可预览交付内容。',
  'Credentials ready': '凭据已就绪',
  'Delete issuance profile?': '删除发放方案？',
  'Direct request': '直接调用',
  'Disabled profiles remain in history but cannot issue new access.':
    '停用后的方案会保留历史记录，但不能继续发放。',
  'Display currency': '当前显示币种',
  'Edit issuance profile': '编辑发放方案',
  'Enter a valid email address': '请输入有效邮箱地址',
  'Error or unavailable': '错误或不可用',
  'Every key created by this issuance will be disabled. Granted balance is not removed.':
    '本次发放创建的所有 Key 都将被禁用，已发放的账户余额不会扣回。',
  'Expiry days': '有效期（天）',
  'Expiry must be between 0 and 3650 days': '有效期必须在 0 到 3650 天之间',
  'Failed to delete profile': '删除方案失败',
  'Failed to issue access': '发放失败',
  'Failed to refresh upstream quota': '刷新上游额度失败',
  'Failed to revoke issuance': '撤销发放失败',
  'Failed to save profile': '保存方案失败',
  'Governed Codex and Claude access.': '受控的 Codex 与 Claude API 访问。',
  'Granted balance': '发放余额',
  'Ignored when unlimited': '无限额度时忽略',
  'Internal note': '内部备注',
  'IP allowlist': 'IP 白名单',
  'IP or CIDR allowlist': 'IP 或 CIDR 白名单',
  'Issuance history': '发放历史',
  'Issuance mode': '发放模式',
  'Issuance profile': '发放方案',
  'Issuance profile deleted': '发放方案已删除',
  'Issuance profile saved': '发放方案已保存',
  'Issuance profiles': '发放方案',
  'Issuance request': '发放请求',
  'Issue API access': '发放 API 访问权限',
  'Issue access': '立即发放',
  'Issued keys revoked': '已撤销本次发放的 Key',
  'Key count': 'Key 数量',
  'Key count must be between 1 and 20': 'Key 数量必须在 1 到 20 之间',
  Keys: 'Key 数量',
  'Leave blank to use profile defaults': '留空则使用方案默认值',
  'Manage API keys': '管理 API Key',
  'New account created': '已创建新账户',
  'New issuance profile': '新建发放方案',
  'New profile': '新建方案',
  'Never expires': '永不过期',
  'No issuance history yet.': '暂无发放历史。',
  'No issuance profiles yet.': '暂无发放方案。',
  'No profile': '未选择方案',
  'Not included in delivery': '不会出现在交付信息中',
  'One per line or comma separated': '每行一个或使用英文逗号分隔',
  'Open console': '打开控制台',
  'Optional overrides': '本次覆盖设置',
  'Per-key amount': '单个 Key 金额',
  'Per-key quota': '单个 Key 额度',
  'Preview before issuing': '发放前预览',
  'Preview update': '预览更新',
  'Pricing ratios': '计费倍率',
  'Pricing ratios updated': '计费倍率已更新',
  'Codex ratio': 'Codex 倍率',
  'Claude ratio': 'Claude 倍率',
  'Confirm pricing update': '确认更新倍率',
  'Enter valid pricing ratios': '请输入有效的计费倍率',
  'Failed to update pricing ratios': '更新计费倍率失败',
  'Codex-only and Claude-only keys use their matching ratio. Combined keys choose the ratio from the requested model family.':
    'Codex 专用与 Claude 专用 Key 使用各自倍率；混合 Key 根据请求模型所属系列选择倍率。',
  'Confirming writes both values atomically and records the administrator request in the audit log.':
    '确认后将原子写入两个倍率，并在审计日志中记录管理员请求。',
  'Profile enabled': '启用方案',
  'Profile name': '方案名称',
  'Profile name is required': '请输入方案名称',
  'Profiles define the default balance, key scope, models, expiry, and network restrictions.':
    '方案用于定义默认余额、Key 权限、模型、有效期和网络限制。',
  'Profiles with issuance history cannot be deleted. Disable them instead.':
    '已有发放记录的方案不能删除，请改为停用。',
  Recipient: '收件人',
  'Recipient email': '收件人邮箱',
  'Refresh quota': '刷新额度',
  'Revoke issued keys?': '撤销本次发放的 Key？',
  Revoke: '撤销',
  'Save profile': '保存方案',
  'Select profile': '选择方案',
  'Split keys': '分离 Key',
  'The key is still constrained by models, expiry, and IP rules.':
    'Key 仍受模型、有效期和 IP 规则限制。',
  'The selected profile is disabled': '所选方案已停用',
  'The temporary password is returned once. Send it through a secure channel.':
    '临时密码只返回一次，请通过安全渠道发送。',
  'Token IDs': 'Token ID',
  'Unlimited key quota': 'Key 无限额度',
  'Upstream management is not configured': '尚未配置上游管理接口',
  'Upstream quota refreshed': '上游额度已刷新',
  'Use the key issued in your console. Model, IP, expiry, and quota permissions are enforced by that key.':
    '请使用控制台发放的 Key；模型、IP、有效期和额度权限均由该 Key 强制执行。',
  'View pricing': '查看价格',
  'View the running AGPL source': '查看当前运行版本的 AGPL 源码',
  'Weekly remaining': '周剩余',
  'below 30%': '低于 30%',
  disabled: '已停用',
  minimum: '最低',
  unlimited: '无限额度',
  'One governed API surface for Codex and Claude, with clear balances, scoped keys, auditable usage, and delivery-ready client configuration.':
    '通过一个受控 API 入口使用 Codex 与 Claude，并获得清晰余额、受限 Key、可审计用量和可直接交付的客户端配置。',
  'Add this provider to the Codex config file. WebSockets stay disabled until their billing path is verified.':
    '将此 Provider 添加到 Codex 配置文件。在 WebSocket 计费链路验证前保持关闭。',
  'Set these variables in the shell that launches Claude Code. Use a Claude-enabled or combined IterLoop key.':
    '在启动 Claude Code 的终端中设置这些变量，并使用支持 Claude 的专用或混合 IterLoop Key。',
  '90 days': '90 天',
  '183 active': '183 个存活账号',
  'Account balance': '账户余额',
  'Admin workspace': '管理工作区',
  'API issuance': 'API 发放',
  'API Keys': 'API Key',
  'Client compatibility': '客户端兼容',
  'Client delivery': '客户交付预览',
  'Combined standard': '混合标准方案',
  'Create Claude-only, Codex-only, or combined keys with model, IP, quota, and expiry limits.':
    '创建仅 Claude、仅 Codex 或混合 Key，并限制模型、IP、额度与有效期。',
  'Error accounts': '异常账号',
  Expires: '有效期',
  Issuance: 'API 发放',
  'Inspect requests, tokens, latency, cost, errors, and Request IDs without storing prompts or response bodies.':
    '查看请求、Token、延迟、费用、错误与 Request ID，同时不保存提示词和响应正文。',
  'Isolated operations': '隔离管理',
  'Keep the clients your team already uses.': '保留团队已经在使用的客户端。',
  'Key policy': 'Key 策略',
  'Model · IP · Expiry': '模型 · IP · 有效期',
  'Permissions, usage, and delivery in one console.':
    '权限、用量和交付，在同一个控制台完成。',
  'Platform capabilities': '平台能力',
  Ready: '已就绪',
  'Responses API configuration with HTTP/SSE and WebSockets disabled until verified billing is available.':
    '使用 Responses API 与 HTTP/SSE；在 WebSocket 计费验证完成前保持关闭。',
  'Anthropic-compatible Messages endpoint with a Claude-enabled or combined key.':
    '通过兼容 Anthropic Messages 的接口使用支持 Claude 的专用或混合 Key。',
  'Scoped credentials': '精细权限',
  'Separate the user console, model traffic, and administration by hostname and role.':
    '按域名和角色隔离用户控制台、模型流量与管理后台。',
  'Standard bearer authentication for chat completions, responses, and model discovery.':
    '通过标准 Bearer 认证使用 Chat Completions、Responses 与模型查询接口。',
  'Start with a verified balance and a key limited to exactly what it should access.':
    '从已确认的余额和权限恰到好处的 Key 开始。',
  Transport: '传输方式',
  'Unified OpenAI and Anthropic protocols': '统一的 OpenAI 与 Anthropic 协议',
  Upstream: '上游健康',
  'Upstream healthy': '上游运行正常',
  'Usage logs': '调用日志',
  'Usage records': '用量记录',
  'Visible consumption': '透明用量',
}
