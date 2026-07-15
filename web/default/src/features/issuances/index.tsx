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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Edit3,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CopyButton } from '@/components/copy-button'
import { Dialog } from '@/components/dialog'
import { SectionPageLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  formatPercent,
  formatQuota,
  formatTimestampToDate,
  parseQuotaFromDollars,
  quotaUnitsToDollars,
} from '@/lib/format'
import { cn } from '@/lib/utils'

import {
  createIssuanceProfile,
  deleteIssuanceProfile,
  getIssuanceProfiles,
  getIssuances,
  getIterLoopPricingSettings,
  getUpstreamHealth,
  issueAccess,
  revokeIssuance,
  updateIssuanceProfile,
} from './api'
import { PricingDialog } from './components/pricing-dialog'
import { ProfileDialog } from './components/profile-dialog'
import type {
  IssueAccessResult,
  Issuance,
  IssuanceMode,
  IssuanceProfile,
  IssuanceProfilePayload,
  IssuedCredential,
  UpstreamHealth,
} from './types'

const PUBLIC_API_BASE =
  import.meta.env.VITE_ITERLOOP_API_BASE_URL || 'https://api.iter-loop.com/v1'
const CLAUDE_API_BASE = PUBLIC_API_BASE.replace(/\/v1\/?$/, '')

const MODE_LABELS: Record<IssuanceMode, string> = {
  codex: 'Codex only',
  claude: 'Claude only',
  grok: 'Grok only',
  combined: 'Combined key',
  split: 'Split keys',
}

function percent(value?: number) {
  return value == null ? '—' : formatPercent(value)
}

function parseTokenIds(raw: string): number[] {
  try {
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value.filter(Number.isFinite) : []
  } catch {
    return []
  }
}

function profileHasCodex(profile?: IssuanceProfile | null) {
  return Boolean(
    profile &&
    (profile.mode === 'codex' ||
      profile.mode === 'combined' ||
      profile.mode === 'split') &&
    profile.codex_models.trim()
  )
}

function profileHasClaude(profile?: IssuanceProfile | null) {
  return Boolean(
    profile &&
    (profile.mode === 'claude' ||
      profile.mode === 'combined' ||
      profile.mode === 'split') &&
    profile.claude_models.trim()
  )
}

function profileHasGrok(profile?: IssuanceProfile | null) {
  return Boolean(
    profile &&
    (profile.mode === 'grok' ||
      profile.mode === 'combined' ||
      profile.mode === 'split') &&
    profile.grok_models.trim()
  )
}

function isClaudeModel(model: string) {
  return model.toLowerCase().includes('claude')
}

function isGrokModel(model: string) {
  return model.toLowerCase().startsWith('grok-')
}

function credentialHasCodex(credential: IssuedCredential) {
  return credential.models.some(
    (model) => !isClaudeModel(model) && !isGrokModel(model)
  )
}

function credentialHasClaude(credential: IssuedCredential) {
  return credential.models.some(isClaudeModel)
}

function credentialHasGrok(credential: IssuedCredential) {
  return credential.models.some(isGrokModel)
}

function codexConfig(credential: IssuedCredential) {
  const model =
    credential.models.find(
      (item) => !isClaudeModel(item) && !isGrokModel(item)
    ) ||
    credential.models[0] ||
    'gpt-5.5'
  return [
    `model = "${model}"`,
    'model_provider = "iterloop"',
    'supports_websockets = false',
    '',
    '[model_providers.iterloop]',
    `base_url = "${PUBLIC_API_BASE}"`,
    `experimental_bearer_token = "${credential.api_key}"`,
    'name = "IterLoop API"',
    'wire_api = "responses"',
    'requires_openai_auth = true',
  ].join('\n')
}

function grokCodexConfig(credential: IssuedCredential) {
  const model = credential.models.find(isGrokModel) || 'grok-4.5'
  return [
    `model = "${model}"`,
    'model_provider = "iterloop-grok"',
    'supports_websockets = false',
    '',
    '[model_providers.iterloop-grok]',
    `base_url = "${PUBLIC_API_BASE}"`,
    `experimental_bearer_token = "${credential.api_key}"`,
    'name = "IterLoop Grok"',
    'wire_api = "responses"',
    'requires_openai_auth = true',
  ].join('\n')
}

function grokOpenAIConfig(credential: IssuedCredential) {
  const model = credential.models.find(isGrokModel) || 'grok-4.5'
  return [
    'from openai import OpenAI',
    '',
    'client = OpenAI(',
    `    base_url="${PUBLIC_API_BASE}",`,
    `    api_key="${credential.api_key}",`,
    ')',
    `response = client.responses.create(model="${model}", input="Hello")`,
    'print(response.output_text)',
  ].join('\n')
}

function claudeConfig(credential: IssuedCredential) {
  return [
    `export ANTHROPIC_BASE_URL="${CLAUDE_API_BASE}"`,
    `export ANTHROPIC_AUTH_TOKEN="${credential.api_key}"`,
    'export ANTHROPIC_API_KEY=""',
  ].join('\n')
}

function deliveryText(result: IssueAccessResult) {
  const lines = [
    'IterLoop API access',
    `Email: ${result.issuance.email}`,
    `Base URL: ${PUBLIC_API_BASE}`,
  ]
  if (result.temporary_password) {
    lines.push(`Temporary password: ${result.temporary_password}`)
  }
  for (const credential of result.credentials) {
    lines.push('', credential.name)
    lines.push(`API Key: ${credential.api_key}`)
    lines.push(`Group: ${credential.group}`)
    lines.push(`Models: ${credential.models.join(', ')}`)
    lines.push(
      `Expires: ${credential.expires_at === -1 ? 'Never' : formatTimestampToDate(credential.expires_at)}`
    )
    if (credentialHasCodex(credential)) {
      lines.push('', 'Codex config:', codexConfig(credential))
    }
    if (credentialHasClaude(credential)) {
      lines.push('', 'Claude Code shell config:', claudeConfig(credential))
    }
    if (credentialHasGrok(credential)) {
      lines.push('', 'Grok OpenAI SDK:', grokOpenAIConfig(credential))
      lines.push('', 'Grok via Codex Responses:', grokCodexConfig(credential))
    }
  }
  return lines.join('\n')
}

export function Issuances() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedProfileId, setSelectedProfileId] = useState(0)
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [balanceOverride, setBalanceOverride] = useState('')
  const [keyOverride, setKeyOverride] = useState('')
  const [expiryOverride, setExpiryOverride] = useState('')
  const [issueResult, setIssueResult] = useState<IssueAccessResult | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<IssuanceProfile | null>(
    null
  )
  const [savingProfile, setSavingProfile] = useState(false)
  const [deletingProfile, setDeletingProfile] =
    useState<IssuanceProfile | null>(null)
  const [revokingIssuance, setRevokingIssuance] = useState<Issuance | null>(
    null
  )
  const [destructiveBusy, setDestructiveBusy] = useState(false)
  const [refreshingQuota, setRefreshingQuota] = useState(false)

  const openNewProfile = () => {
    setEditingProfile(null)
    setProfileDialogOpen(true)
  }

  const profilesQuery = useQuery({
    queryKey: ['iterloop', 'issuance-profiles'],
    queryFn: () => getIssuanceProfiles(),
  })
  const historyQuery = useQuery({
    queryKey: ['iterloop', 'issuances'],
    queryFn: () => getIssuances(),
  })
  const healthQuery = useQuery({
    queryKey: ['iterloop', 'upstream-health'],
    queryFn: () => getUpstreamHealth(false),
    staleTime: 60_000,
  })
  const pricingQuery = useQuery({
    queryKey: ['iterloop', 'pricing-settings'],
    queryFn: () => getIterLoopPricingSettings(),
  })

  const profiles = profilesQuery.data?.data?.items ?? []
  const history = historyQuery.data?.data?.items ?? []
  const selectedProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ??
    profiles.find((profile) => profile.enabled) ??
    profiles[0] ??
    null
  const health = healthQuery.data?.data
  let keyQuotaHint: string | undefined
  if (selectedProfile) {
    keyQuotaHint = selectedProfile.unlimited_quota
      ? t('Unlimited')
      : formatQuota(selectedProfile.key_quota)
  }
  let expiryHint: string | undefined
  if (selectedProfile) {
    expiryHint =
      selectedProfile.expire_days === 0
        ? t('Never')
        : String(selectedProfile.expire_days)
  }
  let selectedCodexGroup = '—'
  if (selectedProfile && profileHasCodex(selectedProfile)) {
    selectedCodexGroup =
      selectedProfile.mode === 'combined'
        ? selectedProfile.combined_group
        : selectedProfile.codex_group
  }
  let selectedClaudeGroup = '—'
  if (selectedProfile && profileHasClaude(selectedProfile)) {
    selectedClaudeGroup =
      selectedProfile.mode === 'combined'
        ? selectedProfile.combined_group
        : selectedProfile.claude_group
  }
  let selectedGrokGroup = '—'
  if (selectedProfile && profileHasGrok(selectedProfile)) {
    selectedGrokGroup =
      selectedProfile.mode === 'combined'
        ? selectedProfile.combined_group
        : selectedProfile.grok_group
  }

  let profileSelector: React.ReactNode
  if (profilesQuery.isLoading) {
    profileSelector = (
      <div className='text-muted-foreground flex h-8 items-center gap-2 text-sm'>
        <Loader2 className='size-4 animate-spin' />
        {t('Loading...')}
      </div>
    )
  } else if (profiles.length > 0) {
    profileSelector = (
      <Select
        value={selectedProfile ? String(selectedProfile.id) : ''}
        onValueChange={(value) => {
          setSelectedProfileId(Number(value))
          setIssueResult(null)
        }}
      >
        <SelectTrigger id='issuance-profile-selector' className='w-full'>
          <SelectValue>
            {selectedProfile?.name || t('Select profile')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {profiles.map((profile) => (
              <SelectItem
                key={profile.id}
                value={String(profile.id)}
                disabled={!profile.enabled}
              >
                <span className='flex w-full items-center justify-between gap-4'>
                  <span>{profile.name}</span>
                  <span className='text-muted-foreground text-xs'>
                    {t(MODE_LABELS[profile.mode])}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  } else {
    profileSelector = (
      <Button
        id='issuance-profile-selector'
        variant='outline'
        onClick={openNewProfile}
      >
        <Plus />
        {t('Create first profile')}
      </Button>
    )
  }

  const previewCredentials = useMemo<IssuedCredential[]>(() => {
    if (issueResult) return issueResult.credentials
    if (!selectedProfile) return []
    const expiresAt =
      selectedProfile.expire_days > 0
        ? Math.floor(Date.now() / 1000) + selectedProfile.expire_days * 86400
        : -1
    const createPreview = (
      name: string,
      models: string,
      group: string
    ): IssuedCredential => ({
      token_id: 0,
      name,
      api_key: 'sk-iterloop-••••••••••••',
      group,
      models: models
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      expires_at: expiresAt,
      unlimited: selectedProfile.unlimited_quota,
      quota: selectedProfile.key_quota,
    })
    if (selectedProfile.mode === 'codex') {
      return [
        createPreview(
          `${selectedProfile.name} Codex`,
          selectedProfile.codex_models,
          selectedProfile.codex_group
        ),
      ]
    }
    if (selectedProfile.mode === 'claude') {
      return [
        createPreview(
          `${selectedProfile.name} Claude`,
          selectedProfile.claude_models,
          selectedProfile.claude_group
        ),
      ]
    }
    if (selectedProfile.mode === 'grok') {
      return [
        createPreview(
          `${selectedProfile.name} Grok`,
          selectedProfile.grok_models,
          selectedProfile.grok_group
        ),
      ]
    }
    if (selectedProfile.mode === 'combined') {
      return [
        createPreview(
          `${selectedProfile.name} Combined`,
          `${selectedProfile.codex_models},${selectedProfile.claude_models},${selectedProfile.grok_models}`,
          selectedProfile.combined_group
        ),
      ]
    }
    const splitCredentials: IssuedCredential[] = []
    if (selectedProfile.codex_models.trim()) {
      splitCredentials.push(
        createPreview(
          `${selectedProfile.name} Codex`,
          selectedProfile.codex_models,
          selectedProfile.codex_group
        )
      )
    }
    if (selectedProfile.claude_models.trim()) {
      splitCredentials.push(
        createPreview(
          `${selectedProfile.name} Claude`,
          selectedProfile.claude_models,
          selectedProfile.claude_group
        )
      )
    }
    if (selectedProfile.grok_models.trim()) {
      splitCredentials.push(
        createPreview(
          `${selectedProfile.name} Grok`,
          selectedProfile.grok_models,
          selectedProfile.grok_group
        )
      )
    }
    return splitCredentials
  }, [issueResult, selectedProfile])

  const handleIssue = async () => {
    if (!selectedProfile) {
      toast.error(t('Create an issuance profile first'))
      return
    }
    if (!selectedProfile.enabled) {
      toast.error(t('The selected profile is disabled'))
      return
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error(t('Enter a valid email address'))
      return
    }
    setIssuing(true)
    try {
      const response = await issueAccess({
        profile_id: selectedProfile.id,
        email: email.trim(),
        note: note.trim(),
        ...(balanceOverride !== ''
          ? { balance_quota: parseQuotaFromDollars(Number(balanceOverride)) }
          : {}),
        ...(keyOverride !== ''
          ? { key_quota: parseQuotaFromDollars(Number(keyOverride)) }
          : {}),
        ...(expiryOverride !== ''
          ? { expire_days: Number(expiryOverride) }
          : {}),
      })
      if (!response.success || !response.data) {
        toast.error(response.message || t('Failed to issue access'))
        return
      }
      setIssueResult(response.data)
      toast.success(t('Access issued successfully'))
      await queryClient.invalidateQueries({
        queryKey: ['iterloop', 'issuances'],
      })
    } finally {
      setIssuing(false)
    }
  }

  const handleSaveProfile = async (payload: IssuanceProfilePayload) => {
    setSavingProfile(true)
    try {
      const response = editingProfile
        ? await updateIssuanceProfile(editingProfile.id, payload)
        : await createIssuanceProfile(payload)
      if (!response.success || !response.data) {
        toast.error(response.message || t('Failed to save profile'))
        return
      }
      toast.success(t('Issuance profile saved'))
      setProfileDialogOpen(false)
      setEditingProfile(null)
      setSelectedProfileId(response.data.id)
      await queryClient.invalidateQueries({
        queryKey: ['iterloop', 'issuance-profiles'],
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (!deletingProfile) return
    setDestructiveBusy(true)
    try {
      const response = await deleteIssuanceProfile(deletingProfile.id)
      if (!response.success) {
        toast.error(response.message || t('Failed to delete profile'))
        return
      }
      toast.success(t('Issuance profile deleted'))
      setDeletingProfile(null)
      await queryClient.invalidateQueries({
        queryKey: ['iterloop', 'issuance-profiles'],
      })
    } finally {
      setDestructiveBusy(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokingIssuance) return
    setDestructiveBusy(true)
    try {
      const response = await revokeIssuance(revokingIssuance.id)
      if (!response.success) {
        toast.error(response.message || t('Failed to revoke issuance'))
        return
      }
      toast.success(t('Issued keys revoked'))
      setRevokingIssuance(null)
      await queryClient.invalidateQueries({
        queryKey: ['iterloop', 'issuances'],
      })
    } finally {
      setDestructiveBusy(false)
    }
  }

  const refreshQuota = async () => {
    setRefreshingQuota(true)
    try {
      const response = await getUpstreamHealth(true)
      if (!response.success || !response.data) {
        toast.error(response.message || t('Failed to refresh upstream quota'))
        return
      }
      queryClient.setQueryData(['iterloop', 'upstream-health'], response)
      toast.success(t('Upstream quota refreshed'))
    } finally {
      setRefreshingQuota(false)
    }
  }

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('API Issuance')}</SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <Button variant='outline' onClick={() => setPricingDialogOpen(true)}>
            <SlidersHorizontal />
            {t('Pricing ratios')}
          </Button>
          <Button
            variant='outline'
            onClick={refreshQuota}
            disabled={refreshingQuota}
          >
            <RefreshCw className={refreshingQuota ? 'animate-spin' : ''} />
            {t('Refresh quota')}
          </Button>
          <Button onClick={openNewProfile}>
            <Plus />
            {t('New profile')}
          </Button>
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <div className='mx-auto grid max-w-[1600px] gap-5'>
            <UpstreamStrip health={health} loading={healthQuery.isLoading} />

            <div className='grid min-w-0 border xl:grid-cols-[440px_minmax(0,1fr)]'>
              <section className='min-w-0 border-b p-4 sm:p-5 xl:border-r xl:border-b-0'>
                <div className='mb-5 flex items-start justify-between gap-4'>
                  <div>
                    <div className='iterloop-section-label'>
                      {t('Issuance request')}
                    </div>
                    <h2 className='font-display mt-1 text-xl'>
                      {t('Issue API access')}
                    </h2>
                  </div>
                  {selectedProfile ? (
                    <Badge
                      variant={
                        selectedProfile.enabled ? 'secondary' : 'outline'
                      }
                    >
                      {t(MODE_LABELS[selectedProfile.mode])}
                    </Badge>
                  ) : null}
                </div>

                <div className='grid gap-4'>
                  <Field
                    id='issuance-profile-selector'
                    label={t('Issuance profile')}
                  >
                    {profileSelector}
                  </Field>

                  <Field
                    id='issuance-recipient-email'
                    label={t('Recipient email')}
                  >
                    <Input
                      id='issuance-recipient-email'
                      type='email'
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setIssueResult(null)
                      }}
                      placeholder='client@example.com'
                      autoComplete='off'
                    />
                  </Field>

                  <Field
                    id='issuance-note'
                    label={t('Internal note')}
                    hint={t('Not included in delivery')}
                  >
                    <Textarea
                      id='issuance-note'
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      maxLength={255}
                      rows={2}
                    />
                  </Field>

                  <div className='border-y py-4'>
                    <div className='mb-3 flex items-center justify-between gap-3'>
                      <span className='text-sm font-medium'>
                        {t('Optional overrides')}
                      </span>
                      <span className='text-muted-foreground text-[10px]'>
                        {t('Leave blank to use profile defaults')}
                      </span>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-3'>
                      <Field
                        id='issuance-balance-override'
                        label={t('Account amount')}
                        hint={
                          selectedProfile
                            ? formatQuota(selectedProfile.balance_quota)
                            : undefined
                        }
                      >
                        <Input
                          id='issuance-balance-override'
                          type='number'
                          min='0'
                          step='0.01'
                          value={balanceOverride}
                          onChange={(event) =>
                            setBalanceOverride(event.target.value)
                          }
                          placeholder={
                            selectedProfile
                              ? String(
                                  quotaUnitsToDollars(
                                    selectedProfile.balance_quota
                                  )
                                )
                              : '0'
                          }
                        />
                      </Field>
                      <Field
                        id='issuance-key-quota-override'
                        label={t('Per-key amount')}
                        hint={keyQuotaHint}
                      >
                        <Input
                          id='issuance-key-quota-override'
                          type='number'
                          min='0'
                          step='0.01'
                          disabled={selectedProfile?.unlimited_quota}
                          value={keyOverride}
                          onChange={(event) =>
                            setKeyOverride(event.target.value)
                          }
                          placeholder={
                            selectedProfile
                              ? String(
                                  quotaUnitsToDollars(selectedProfile.key_quota)
                                )
                              : '0'
                          }
                        />
                      </Field>
                      <Field
                        id='issuance-expiry-override'
                        label={t('Expiry days')}
                        hint={expiryHint}
                      >
                        <Input
                          id='issuance-expiry-override'
                          type='number'
                          min='0'
                          max='3650'
                          value={expiryOverride}
                          onChange={(event) =>
                            setExpiryOverride(event.target.value)
                          }
                          placeholder={String(
                            selectedProfile?.expire_days ?? 0
                          )}
                        />
                      </Field>
                    </div>
                  </div>

                  {selectedProfile ? (
                    <div className='grid grid-cols-2 gap-x-5 gap-y-3 text-xs'>
                      <SummaryLine
                        label={t('Keys')}
                        value={String(selectedProfile.key_count)}
                      />
                      <SummaryLine
                        label={t('IP allowlist')}
                        value={selectedProfile.allow_ips || t('Any IP')}
                      />
                      <SummaryLine
                        label={t('Codex group')}
                        value={selectedCodexGroup}
                      />
                      <SummaryLine
                        label={t('Claude group')}
                        value={selectedClaudeGroup}
                      />
                      <SummaryLine
                        label={t('Grok group')}
                        value={selectedGrokGroup}
                      />
                    </div>
                  ) : null}

                  <Button
                    size='lg'
                    className='mt-1 h-11 w-full'
                    onClick={handleIssue}
                    disabled={issuing || !selectedProfile?.enabled}
                  >
                    {issuing ? <Loader2 className='animate-spin' /> : <Send />}
                    {t('Issue access')}
                  </Button>
                </div>
              </section>

              <DeliveryPreview
                profile={selectedProfile}
                result={issueResult}
                credentials={previewCredentials}
              />
            </div>

            <Tabs defaultValue='profiles' className='min-w-0'>
              <div className='flex flex-wrap items-center justify-between gap-3 border-b pb-3'>
                <TabsList>
                  <TabsTrigger value='profiles'>
                    {t('Issuance profiles')} ({profiles.length})
                  </TabsTrigger>
                  <TabsTrigger value='history'>
                    {t('Issuance history')} (
                    {historyQuery.data?.data?.total ?? history.length})
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    profilesQuery.refetch()
                    historyQuery.refetch()
                  }}
                >
                  <RefreshCw />
                  {t('Refresh')}
                </Button>
              </div>
              <TabsContent value='profiles' className='mt-3'>
                <ProfilesTable
                  profiles={profiles}
                  loading={profilesQuery.isLoading}
                  onEdit={(profile) => {
                    setEditingProfile(profile)
                    setProfileDialogOpen(true)
                  }}
                  onDelete={setDeletingProfile}
                />
              </TabsContent>
              <TabsContent value='history' className='mt-3'>
                <HistoryTable
                  history={history}
                  loading={historyQuery.isLoading}
                  onRevoke={setRevokingIssuance}
                />
              </TabsContent>
            </Tabs>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <ProfileDialog
        open={profileDialogOpen}
        profile={editingProfile}
        saving={savingProfile}
        onOpenChange={(open) => {
          setProfileDialogOpen(open)
          if (!open) setEditingProfile(null)
        }}
        onSave={handleSaveProfile}
      />

      <PricingDialog
        open={pricingDialogOpen}
        settings={pricingQuery.data?.data}
        onOpenChange={setPricingDialogOpen}
        onApplied={async () => {
          await pricingQuery.refetch()
        }}
      />

      <Dialog
        open={Boolean(deletingProfile)}
        onOpenChange={(open) => !open && setDeletingProfile(null)}
        title={t('Delete issuance profile?')}
        description={t(
          'Profiles with issuance history cannot be deleted. Disable them instead.'
        )}
        contentClassName='sm:max-w-md'
        footer={
          <>
            <Button variant='outline' onClick={() => setDeletingProfile(null)}>
              {t('Cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteProfile}
              disabled={destructiveBusy}
            >
              {destructiveBusy ? (
                <Loader2 className='animate-spin' />
              ) : (
                <Trash2 />
              )}
              {t('Delete')}
            </Button>
          </>
        }
      >
        <p className='text-sm'>{deletingProfile?.name}</p>
      </Dialog>

      <Dialog
        open={Boolean(revokingIssuance)}
        onOpenChange={(open) => !open && setRevokingIssuance(null)}
        title={t('Revoke issued keys?')}
        description={t(
          'Every key created by this issuance will be disabled. Granted balance is not removed.'
        )}
        contentClassName='sm:max-w-md'
        footer={
          <>
            <Button variant='outline' onClick={() => setRevokingIssuance(null)}>
              {t('Cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleRevoke}
              disabled={destructiveBusy}
            >
              {destructiveBusy ? (
                <Loader2 className='animate-spin' />
              ) : (
                <XCircle />
              )}
              {t('Revoke')}
            </Button>
          </>
        }
      >
        <p className='font-mono text-sm'>{revokingIssuance?.email}</p>
      </Dialog>
    </>
  )
}

function Field(props: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className='grid min-w-0 gap-1.5'>
      <div className='flex items-baseline justify-between gap-2'>
        <Label htmlFor={props.id} className='text-xs'>
          {props.label}
        </Label>
        {props.hint ? (
          <span className='text-muted-foreground max-w-[60%] truncate text-[10px]'>
            {props.hint}
          </span>
        ) : null}
      </div>
      {props.children}
    </div>
  )
}

function SummaryLine(props: { label: string; value: string }) {
  return (
    <div className='min-w-0 border-b pb-2'>
      <div className='text-muted-foreground font-mono text-[10px] uppercase'>
        {props.label}
      </div>
      <div className='mt-1 truncate font-mono'>{props.value}</div>
    </div>
  )
}

function UpstreamStrip(props: { health?: UpstreamHealth; loading: boolean }) {
  const { t } = useTranslation()
  const health = props.health
  const errors =
    (health?.accounts.error ?? 0) + (health?.accounts.unavailable ?? 0)
  const metrics = [
    {
      label: t('Active accounts'),
      value: props.loading ? '—' : String(health?.accounts.active ?? 0),
      detail: `${health?.accounts.codex ?? 0} Codex · ${health?.accounts.claude ?? 0} Claude · ${health?.accounts.xai ?? 0} xAI`,
      icon: CheckCircle2,
    },
    {
      label: t('Error or unavailable'),
      value: props.loading ? '—' : String(errors),
      detail: `${health?.accounts.disabled ?? 0} ${t('disabled')}`,
      icon: AlertTriangle,
    },
    {
      label: t('xAI active'),
      value: props.loading ? '—' : String(health?.accounts.xai_active ?? 0),
      detail: `${health?.accounts.xai ?? 0} ${t('xAI OAuth accounts')}`,
      icon: CheckCircle2,
    },
    {
      label: t('xAI spending limit'),
      value: props.loading
        ? '—'
        : String(health?.accounts.xai_spending_limit ?? 0),
      detail: `${health?.accounts.xai_failed ?? 0} ${t('xAI failed')}`,
      icon: XCircle,
    },
    {
      label: t('5-hour remaining'),
      value: percent(health?.quota?.five_hour_average_remaining),
      detail: `${t('minimum')} ${percent(health?.quota?.five_hour_minimum_remaining)}`,
      icon: Clock3,
    },
    {
      label: t('Weekly remaining'),
      value: percent(health?.quota?.weekly_average_remaining),
      detail: `${health?.quota?.below_thirty ?? 0} ${t('below 30%')}`,
      icon: ShieldCheck,
    },
  ]

  return (
    <section className='overflow-hidden border bg-[#17477f] text-white'>
      {!health?.configured && !props.loading ? (
        <div className='border-b border-white/15 px-4 py-2.5 text-xs text-white/65'>
          {t('Upstream management is not configured')}
        </div>
      ) : null}
      <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6'>
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.label}
              className={cn(
                'min-w-0 p-4 sm:p-5',
                index % 2 === 0 && 'border-r border-white/15',
                index < 4 && 'border-b border-white/15',
                index % 3 !== 2 && 'md:border-r md:border-white/15',
                index % 3 === 2 && 'md:border-r-0',
                index < 3 && 'md:border-b md:border-white/15',
                index >= 3 && 'md:border-b-0',
                'xl:border-b-0',
                index !== metrics.length - 1 &&
                  'xl:border-r xl:border-white/15',
                index === metrics.length - 1 && 'xl:border-r-0'
              )}
            >
              <div className='flex items-center justify-between gap-3'>
                <span className='font-mono text-[10px] text-white/55 uppercase'>
                  {metric.label}
                </span>
                <Icon className='size-4 text-[#ffad9b]' />
              </div>
              <div className='mt-2 font-mono text-2xl'>{metric.value}</div>
              <div className='mt-1 truncate text-xs text-white/55'>
                {metric.detail}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function DeliveryPreview(props: {
  profile: IssuanceProfile | null
  result: IssueAccessResult | null
  credentials: IssuedCredential[]
}) {
  const { t } = useTranslation()
  const accountEmail = props.result?.issuance.email || 'client@example.com'

  return (
    <section className='iterloop-tech-panel min-w-0 rounded-none border-0 p-4 sm:p-5'>
      <div className='flex flex-wrap items-start justify-between gap-3 border-b border-white/15 pb-4'>
        <div>
          <div className='font-mono text-[10px] text-white/45 uppercase'>
            {t('Client delivery preview')}
          </div>
          <h2 className='font-display mt-1 text-xl'>
            {props.result
              ? t('Credentials ready')
              : t('Preview before issuing')}
          </h2>
        </div>
        {props.result ? (
          <CopyButton
            value={deliveryText(props.result)}
            variant='outline'
            size='default'
            className='border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white'
            tooltip={t('Copy complete delivery')}
          >
            {t('Copy all')}
          </CopyButton>
        ) : (
          <Badge className='border-white/15 bg-white/10 text-white'>
            {props.profile
              ? t(MODE_LABELS[props.profile.mode])
              : t('No profile')}
          </Badge>
        )}
      </div>

      {props.result?.temporary_password ? (
        <div className='my-4 border border-[#ff7759]/45 bg-[#ff7759]/10 p-3'>
          <div className='flex items-start gap-3'>
            <UserPlus className='mt-0.5 size-4 shrink-0 text-[#ffad9b]' />
            <div className='min-w-0 flex-1'>
              <div className='text-sm font-medium'>
                {t('New account created')}
              </div>
              <p className='mt-1 text-xs leading-5 text-white/55'>
                {t(
                  'The temporary password is returned once. Send it through a secure channel.'
                )}
              </p>
              <div className='mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-2 font-mono text-xs'>
                <span className='break-all'>
                  {props.result.temporary_password}
                </span>
                <CopyButton
                  value={props.result.temporary_password}
                  className='text-white hover:bg-white/10 hover:text-white'
                  tooltip={t('Copy temporary password')}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className='grid grid-cols-2 border-b border-white/15 py-4 text-xs sm:grid-cols-3'>
        <PreviewMeta
          label='BASE URL'
          value={PUBLIC_API_BASE}
          className='col-span-2 sm:col-span-1'
        />
        <PreviewMeta label='EMAIL' value={accountEmail} />
        <PreviewMeta
          label='STATUS'
          value={props.result ? 'ISSUED' : 'PREVIEW'}
          valueClassName={props.result ? 'text-[#8fdbbc]' : 'text-[#ffad9b]'}
        />
      </div>

      <div className='divide-y divide-white/15'>
        {props.credentials.length === 0 ? (
          <div className='py-10 text-center text-sm text-white/45'>
            {t('Create or select an issuance profile to preview delivery.')}
          </div>
        ) : (
          props.credentials.map((credential) => (
            <div
              key={`${credential.token_id}-${credential.name}-${credential.group}`}
              className='py-5'
            >
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <KeyRound className='size-4 text-[#9ec2ff]' />
                    <h3 className='truncate text-sm font-medium'>
                      {credential.name}
                    </h3>
                  </div>
                  <div className='mt-1 font-mono text-[10px] text-white/45'>
                    {credential.group} ·{' '}
                    {credential.unlimited
                      ? t('unlimited')
                      : formatQuota(credential.quota)}
                  </div>
                </div>
                {props.result ? (
                  <CopyButton
                    value={credential.api_key}
                    className='text-white hover:bg-white/10 hover:text-white'
                    tooltip={t('Copy API key')}
                  />
                ) : null}
              </div>
              <div className='mt-3 flex min-w-0 items-center justify-between gap-3 border-y border-white/10 py-2 font-mono text-xs'>
                <span className='min-w-0 truncate'>{credential.api_key}</span>
                <span className='shrink-0 text-[10px] text-white/45'>
                  {credential.expires_at === -1
                    ? t('Never expires')
                    : formatTimestampToDate(credential.expires_at)}
                </span>
              </div>
              <div className='mt-3 flex flex-wrap gap-1.5'>
                {credential.models.map((model) => (
                  <span
                    key={model}
                    className='border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-white/65'
                  >
                    {model}
                  </span>
                ))}
              </div>
              <div className='mt-4 grid gap-3 xl:grid-cols-2'>
                {credentialHasCodex(credential) ? (
                  <ConfigBlock
                    title='Codex config'
                    value={codexConfig(credential)}
                  />
                ) : null}
                {credentialHasClaude(credential) ? (
                  <ConfigBlock
                    title='Claude Code'
                    value={claudeConfig(credential)}
                  />
                ) : null}
                {credentialHasGrok(credential) ? (
                  <ConfigBlock
                    title='Grok OpenAI SDK'
                    value={grokOpenAIConfig(credential)}
                  />
                ) : null}
                {credentialHasGrok(credential) ? (
                  <ConfigBlock
                    title='Grok via Codex Responses'
                    value={grokCodexConfig(credential)}
                  />
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function PreviewMeta(props: {
  label: string
  value: string
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={cn('min-w-0 pr-4 pb-3 sm:pb-0', props.className)}>
      <div className='font-mono text-[10px] text-white/45'>{props.label}</div>
      <div
        className={cn('mt-1 truncate font-mono text-xs', props.valueClassName)}
      >
        {props.value}
      </div>
    </div>
  )
}

function ConfigBlock(props: { title: string; value: string }) {
  return (
    <div className='min-w-0 border border-white/10 bg-black/15'>
      <div className='flex items-center justify-between border-b border-white/10 px-3 py-2'>
        <span className='font-mono text-[10px] text-white/45 uppercase'>
          {props.title}
        </span>
        <CopyButton
          value={props.value}
          className='size-6 text-white/65 hover:bg-white/10 hover:text-white'
          iconClassName='size-3'
          tooltip={`Copy ${props.title}`}
        />
      </div>
      <pre className='max-h-56 overflow-auto p-3 font-mono text-[10px] leading-5 text-white/70'>
        {props.value}
      </pre>
    </div>
  )
}

function ProfilesTable(props: {
  profiles: IssuanceProfile[]
  loading: boolean
  onEdit: (profile: IssuanceProfile) => void
  onDelete: (profile: IssuanceProfile) => void
}) {
  const { t } = useTranslation()
  if (props.loading) return <LoadingRows />
  if (props.profiles.length === 0) {
    return <EmptyLine text={t('No issuance profiles yet.')} />
  }
  return (
    <div className='iterloop-rule-table overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Name')}</TableHead>
            <TableHead>{t('Mode')}</TableHead>
            <TableHead>{t('Balance')}</TableHead>
            <TableHead>{t('Per-key quota')}</TableHead>
            <TableHead>{t('Keys')}</TableHead>
            <TableHead>{t('Expiry')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead className='w-24 text-right'>{t('Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell className='min-w-52'>
                <div className='font-medium'>{profile.name}</div>
                <div className='text-muted-foreground mt-0.5 line-clamp-1 text-xs'>
                  {profile.description || '—'}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant='outline'>{t(MODE_LABELS[profile.mode])}</Badge>
              </TableCell>
              <TableCell className='font-mono text-xs'>
                {formatQuota(profile.balance_quota)}
              </TableCell>
              <TableCell className='font-mono text-xs'>
                {profile.unlimited_quota
                  ? t('Unlimited')
                  : formatQuota(profile.key_quota)}
              </TableCell>
              <TableCell className='font-mono text-xs'>
                {profile.key_count}
              </TableCell>
              <TableCell className='font-mono text-xs'>
                {profile.expire_days === 0
                  ? t('Never')
                  : `${profile.expire_days}d`}
              </TableCell>
              <TableCell>
                <span className='flex items-center gap-2 text-xs'>
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      profile.enabled ? 'bg-success' : 'bg-muted-foreground'
                    )}
                  />
                  {profile.enabled ? t('Enabled') : t('Disabled')}
                </span>
              </TableCell>
              <TableCell>
                <div className='flex justify-end gap-1'>
                  <IconAction
                    label={t('Edit')}
                    onClick={() => props.onEdit(profile)}
                  >
                    <Edit3 />
                  </IconAction>
                  <IconAction
                    label={t('Delete')}
                    destructive
                    onClick={() => props.onDelete(profile)}
                  >
                    <Trash2 />
                  </IconAction>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function HistoryTable(props: {
  history: Issuance[]
  loading: boolean
  onRevoke: (issuance: Issuance) => void
}) {
  const { t } = useTranslation()
  if (props.loading) return <LoadingRows />
  if (props.history.length === 0) {
    return <EmptyLine text={t('No issuance history yet.')} />
  }
  return (
    <div className='iterloop-rule-table overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Recipient')}</TableHead>
            <TableHead>{t('Granted balance')}</TableHead>
            <TableHead>{t('Token IDs')}</TableHead>
            <TableHead>{t('Note')}</TableHead>
            <TableHead>{t('Created')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead className='w-20 text-right'>{t('Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.history.map((issuance) => (
            <TableRow key={issuance.id}>
              <TableCell className='min-w-48'>
                <div className='font-mono text-xs'>{issuance.email}</div>
                <div className='text-muted-foreground mt-0.5 text-[10px]'>
                  user #{issuance.user_id} · issuance #{issuance.id}
                </div>
              </TableCell>
              <TableCell className='font-mono text-xs'>
                {formatQuota(issuance.balance_granted)}
              </TableCell>
              <TableCell>
                <div className='flex flex-wrap gap-1'>
                  {parseTokenIds(issuance.token_ids).map((id) => (
                    <span
                      key={id}
                      className='bg-muted px-1.5 py-0.5 font-mono text-[10px]'
                    >
                      #{id}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className='max-w-64 truncate text-xs'>
                {issuance.note || '—'}
              </TableCell>
              <TableCell className='font-mono text-xs'>
                {formatTimestampToDate(issuance.created_time)}
              </TableCell>
              <TableCell>
                <span className='flex items-center gap-2 text-xs'>
                  {issuance.status === 'active' ? (
                    <CheckCircle2 className='text-success size-4' />
                  ) : (
                    <XCircle className='text-muted-foreground size-4' />
                  )}
                  {issuance.status === 'active' ? t('Active') : t('Revoked')}
                </span>
              </TableCell>
              <TableCell>
                <div className='flex justify-end'>
                  {issuance.status === 'active' ? (
                    <IconAction
                      label={t('Revoke')}
                      destructive
                      onClick={() => props.onRevoke(issuance)}
                    >
                      <XCircle />
                    </IconAction>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function IconAction(props: {
  label: string
  destructive?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const button = (
    <Button
      variant={props.destructive ? 'destructive' : 'ghost'}
      size='icon-sm'
      onClick={props.onClick}
      aria-label={props.label}
    >
      {props.children}
    </Button>
  )
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{props.label}</TooltipContent>
    </Tooltip>
  )
}

function LoadingRows() {
  return (
    <div className='flex h-32 items-center justify-center border'>
      <Loader2 className='text-muted-foreground size-5 animate-spin' />
    </div>
  )
}

function EmptyLine(props: { text: string }) {
  return (
    <div className='text-muted-foreground flex h-32 items-center justify-center border text-sm'>
      {props.text}
    </div>
  )
}
