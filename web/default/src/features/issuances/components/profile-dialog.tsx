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
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Dialog } from '@/components/dialog'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { parseQuotaFromDollars, quotaUnitsToDollars } from '@/lib/format'

import type {
  IssuanceMode,
  IssuanceProfile,
  IssuanceProfilePayload,
} from '../types'

type ProfileFormState = {
  name: string
  description: string
  mode: IssuanceMode
  balanceAmount: string
  keyAmount: string
  unlimitedQuota: boolean
  keyCount: string
  expireDays: string
  codexModels: string
  claudeModels: string
  codexGroup: string
  claudeGroup: string
  combinedGroup: string
  allowIps: string
  enabled: boolean
}

const MODE_LABELS: Record<IssuanceMode, string> = {
  codex: 'Codex only',
  claude: 'Claude only',
  combined: 'Combined key',
  split: 'Split keys',
}

function initialForm(profile?: IssuanceProfile | null): ProfileFormState {
  if (profile) {
    return {
      name: profile.name,
      description: profile.description,
      mode: profile.mode,
      balanceAmount: String(quotaUnitsToDollars(profile.balance_quota)),
      keyAmount: String(quotaUnitsToDollars(profile.key_quota)),
      unlimitedQuota: profile.unlimited_quota,
      keyCount: String(profile.key_count),
      expireDays: String(profile.expire_days),
      codexModels: profile.codex_models,
      claudeModels: profile.claude_models,
      codexGroup: profile.codex_group,
      claudeGroup: profile.claude_group,
      combinedGroup: profile.combined_group,
      allowIps: profile.allow_ips,
      enabled: profile.enabled,
    }
  }
  return {
    name: 'Standard access',
    description: '',
    mode: 'combined',
    balanceAmount: '0',
    keyAmount: '0',
    unlimitedQuota: false,
    keyCount: '1',
    expireDays: '30',
    codexModels: 'gpt-5.5',
    claudeModels: 'claude-sonnet-4-6',
    codexGroup: 'codex-standard',
    claudeGroup: 'claude-standard',
    combinedGroup: 'combined-standard',
    allowIps: '',
    enabled: true,
  }
}

function hasCodex(mode: IssuanceMode) {
  return mode === 'codex' || mode === 'combined' || mode === 'split'
}

function hasClaude(mode: IssuanceMode) {
  return mode === 'claude' || mode === 'combined' || mode === 'split'
}

export function ProfileDialog(props: {
  open: boolean
  profile?: IssuanceProfile | null
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: IssuanceProfilePayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<ProfileFormState>(() =>
    initialForm(props.profile)
  )

  useEffect(() => {
    if (props.open) setForm(initialForm(props.profile))
  }, [props.open, props.profile])

  const update = <K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K]
  ) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async () => {
    const keyCount = Number(form.keyCount)
    const expireDays = Number(form.expireDays)
    const balanceAmount = Number(form.balanceAmount)
    const keyAmount = Number(form.keyAmount)
    if (!form.name.trim()) {
      toast.error(t('Profile name is required'))
      return
    }
    if (!Number.isInteger(keyCount) || keyCount < 1 || keyCount > 20) {
      toast.error(t('Key count must be between 1 and 20'))
      return
    }
    if (!Number.isInteger(expireDays) || expireDays < 0 || expireDays > 3650) {
      toast.error(t('Expiry must be between 0 and 3650 days'))
      return
    }
    if (balanceAmount < 0 || keyAmount < 0) {
      toast.error(t('Amounts cannot be negative'))
      return
    }
    if (hasCodex(form.mode) && !form.codexModels.trim()) {
      toast.error(t('At least one Codex model is required'))
      return
    }
    if (hasClaude(form.mode) && !form.claudeModels.trim()) {
      toast.error(t('At least one Claude model is required'))
      return
    }

    await props.onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      mode: form.mode,
      balance_quota: parseQuotaFromDollars(balanceAmount),
      key_quota: parseQuotaFromDollars(keyAmount),
      unlimited_quota: form.unlimitedQuota,
      key_count: keyCount,
      expire_days: expireDays,
      codex_models: form.codexModels.trim(),
      claude_models: form.claudeModels.trim(),
      codex_group: form.codexGroup.trim(),
      claude_group: form.claudeGroup.trim(),
      combined_group: form.combinedGroup.trim(),
      allow_ips: form.allowIps.trim(),
      enabled: form.enabled,
    })
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={
        props.profile ? t('Edit issuance profile') : t('New issuance profile')
      }
      description={t(
        'Profiles define the default balance, key scope, models, expiry, and network restrictions.'
      )}
      contentClassName='sm:max-w-3xl'
      contentHeight='min(66vh, 660px)'
      footer={
        <>
          <Button
            variant='outline'
            onClick={() => props.onOpenChange(false)}
            disabled={props.saving}
          >
            {t('Cancel')}
          </Button>
          <Button onClick={submit} disabled={props.saving}>
            {props.saving ? <Loader2 className='animate-spin' /> : null}
            {t('Save profile')}
          </Button>
        </>
      }
    >
      <div className='grid gap-5'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field id='issuance-profile-name' label={t('Profile name')}>
            <Input
              id='issuance-profile-name'
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              maxLength={64}
            />
          </Field>
          <Field id='issuance-profile-mode' label={t('Issuance mode')}>
            <Select
              value={form.mode}
              onValueChange={(value) => update('mode', value as IssuanceMode)}
            >
              <SelectTrigger id='issuance-profile-mode' className='w-full'>
                <SelectValue>{t(MODE_LABELS[form.mode])}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(Object.keys(MODE_LABELS) as IssuanceMode[]).map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {t(MODE_LABELS[mode])}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field id='issuance-profile-description' label={t('Description')}>
          <Textarea
            id='issuance-profile-description'
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            maxLength={255}
            rows={2}
          />
        </Field>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Field
            id='issuance-profile-balance'
            label={t('Account balance amount')}
            hint={t('Display currency')}
          >
            <Input
              id='issuance-profile-balance'
              type='number'
              min='0'
              step='0.01'
              value={form.balanceAmount}
              onChange={(event) => update('balanceAmount', event.target.value)}
            />
          </Field>
          <Field
            id='issuance-profile-key-quota'
            label={t('Per-key amount')}
            hint={t('Ignored when unlimited')}
          >
            <Input
              id='issuance-profile-key-quota'
              type='number'
              min='0'
              step='0.01'
              disabled={form.unlimitedQuota}
              value={form.keyAmount}
              onChange={(event) => update('keyAmount', event.target.value)}
            />
          </Field>
          <Field id='issuance-profile-key-count' label={t('Key count')}>
            <Input
              id='issuance-profile-key-count'
              type='number'
              min='1'
              max='20'
              value={form.keyCount}
              onChange={(event) => update('keyCount', event.target.value)}
            />
          </Field>
          <Field
            id='issuance-profile-expiry-days'
            label={t('Expiry days')}
            hint={t('0 means no expiry')}
          >
            <Input
              id='issuance-profile-expiry-days'
              type='number'
              min='0'
              max='3650'
              value={form.expireDays}
              onChange={(event) => update('expireDays', event.target.value)}
            />
          </Field>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          {hasCodex(form.mode) ? (
            <Field
              id='issuance-profile-codex-models'
              label={t('Codex models')}
              hint={t('Comma separated')}
            >
              <Textarea
                id='issuance-profile-codex-models'
                className='font-mono text-xs'
                value={form.codexModels}
                onChange={(event) => update('codexModels', event.target.value)}
                rows={3}
              />
            </Field>
          ) : null}
          {hasClaude(form.mode) ? (
            <Field
              id='issuance-profile-claude-models'
              label={t('Claude models')}
              hint={t('Comma separated')}
            >
              <Textarea
                id='issuance-profile-claude-models'
                className='font-mono text-xs'
                value={form.claudeModels}
                onChange={(event) => update('claudeModels', event.target.value)}
                rows={3}
              />
            </Field>
          ) : null}
        </div>

        <div className='grid gap-4 sm:grid-cols-3'>
          {hasCodex(form.mode) && form.mode !== 'combined' ? (
            <Field id='issuance-profile-codex-group' label={t('Codex group')}>
              <Input
                id='issuance-profile-codex-group'
                className='font-mono text-xs'
                value={form.codexGroup}
                onChange={(event) => update('codexGroup', event.target.value)}
              />
            </Field>
          ) : null}
          {hasClaude(form.mode) && form.mode !== 'combined' ? (
            <Field id='issuance-profile-claude-group' label={t('Claude group')}>
              <Input
                id='issuance-profile-claude-group'
                className='font-mono text-xs'
                value={form.claudeGroup}
                onChange={(event) => update('claudeGroup', event.target.value)}
              />
            </Field>
          ) : null}
          {form.mode === 'combined' ? (
            <Field
              id='issuance-profile-combined-group'
              label={t('Combined group')}
            >
              <Input
                id='issuance-profile-combined-group'
                className='font-mono text-xs'
                value={form.combinedGroup}
                onChange={(event) =>
                  update('combinedGroup', event.target.value)
                }
              />
            </Field>
          ) : null}
          <Field
            id='issuance-profile-allow-ips'
            label={t('IP or CIDR allowlist')}
            hint={t('One per line or comma separated')}
          >
            <Input
              id='issuance-profile-allow-ips'
              className='font-mono text-xs'
              value={form.allowIps}
              onChange={(event) => update('allowIps', event.target.value)}
              placeholder='203.0.113.10, 10.0.0.0/8'
            />
          </Field>
        </div>

        <div className='grid gap-3 border-y py-4 sm:grid-cols-2'>
          <ToggleRow
            label={t('Unlimited key quota')}
            description={t(
              'The key is still constrained by models, expiry, and IP rules.'
            )}
            checked={form.unlimitedQuota}
            onCheckedChange={(value) => update('unlimitedQuota', value)}
          />
          <ToggleRow
            label={t('Profile enabled')}
            description={t(
              'Disabled profiles remain in history but cannot issue new access.'
            )}
            checked={form.enabled}
            onCheckedChange={(value) => update('enabled', value)}
          />
        </div>
      </div>
    </Dialog>
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
          <span className='text-muted-foreground text-[10px]'>
            {props.hint}
          </span>
        ) : null}
      </div>
      {props.children}
    </div>
  )
}

function ToggleRow(props: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <div>
        <div className='text-sm font-medium'>{props.label}</div>
        <p className='text-muted-foreground mt-1 text-xs leading-5'>
          {props.description}
        </p>
      </div>
      <Switch
        checked={props.checked}
        onCheckedChange={props.onCheckedChange}
        aria-label={props.label}
      />
    </div>
  )
}
