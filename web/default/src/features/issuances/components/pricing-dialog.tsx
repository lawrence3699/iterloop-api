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
import { Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { updateIterLoopPricingSettings } from '../api'
import type { IterLoopPricingPreview, IterLoopPricingSettings } from '../types'

export function PricingDialog(props: {
  open: boolean
  settings?: IterLoopPricingSettings
  onOpenChange: (open: boolean) => void
  onApplied: () => Promise<void> | void
}) {
  const { t } = useTranslation()
  const [codexRatio, setCodexRatio] = useState('0.4')
  const [claudeRatio, setClaudeRatio] = useState('0.7')
  const [preview, setPreview] = useState<IterLoopPricingPreview | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!props.open) return
    setCodexRatio(String(props.settings?.codex_ratio ?? 0.4))
    setClaudeRatio(String(props.settings?.claude_ratio ?? 0.7))
    setPreview(null)
  }, [props.open, props.settings])

  const submit = async (confirm: boolean) => {
    const codex = Number(codexRatio)
    const claude = Number(claudeRatio)
    if (!Number.isFinite(codex) || !Number.isFinite(claude)) {
      toast.error(t('Enter valid pricing ratios'))
      return
    }
    setBusy(true)
    try {
      const response = await updateIterLoopPricingSettings({
        codex_ratio: codex,
        claude_ratio: claude,
        confirm,
      })
      if (!response.success || !response.data) {
        toast.error(response.message || t('Failed to update pricing ratios'))
        return
      }
      setPreview(response.data)
      if (response.data.applied) {
        toast.success(t('Pricing ratios updated'))
        await props.onApplied()
        props.onOpenChange(false)
      }
    } finally {
      setBusy(false)
    }
  }

  const footer = preview ? (
    <>
      <Button
        variant='outline'
        onClick={() => setPreview(null)}
        disabled={busy}
      >
        {t('Back')}
      </Button>
      <Button onClick={() => submit(true)} disabled={busy}>
        {busy ? <Loader2 className='animate-spin' /> : <Check />}
        {t('Confirm pricing update')}
      </Button>
    </>
  ) : (
    <>
      <Button variant='outline' onClick={() => props.onOpenChange(false)}>
        {t('Cancel')}
      </Button>
      <Button onClick={() => submit(false)} disabled={busy}>
        {busy ? <Loader2 className='animate-spin' /> : null}
        {t('Preview update')}
      </Button>
    </>
  )

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('Pricing ratios')}
      description={t(
        'Codex-only and Claude-only keys use their matching ratio. Combined keys choose the ratio from the requested model family.'
      )}
      contentClassName='sm:max-w-lg'
      footer={footer}
    >
      {preview ? (
        <div className='border-y'>
          <PreviewRow
            label='Codex'
            current={preview.current.codex_ratio}
            next={preview.preview.codex_ratio}
          />
          <PreviewRow
            label='Claude'
            current={preview.current.claude_ratio}
            next={preview.preview.claude_ratio}
          />
          <div className='text-muted-foreground py-3 text-xs leading-5'>
            {t(
              'Confirming writes both values atomically and records the administrator request in the audit log.'
            )}
          </div>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2'>
          <RatioField
            id='iterloop-codex-ratio'
            label={t('Codex ratio')}
            value={codexRatio}
            onChange={setCodexRatio}
          />
          <RatioField
            id='iterloop-claude-ratio'
            label={t('Claude ratio')}
            value={claudeRatio}
            onChange={setClaudeRatio}
          />
        </div>
      )}
    </Dialog>
  )
}

function RatioField(props: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className='grid gap-1.5'>
      <Label htmlFor={props.id} className='text-xs'>
        {props.label}
      </Label>
      <Input
        id={props.id}
        type='number'
        min='0.01'
        max='10'
        step='0.01'
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  )
}

function PreviewRow(props: { label: string; current: number; next: number }) {
  return (
    <div className='grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b py-3 last:border-b-0'>
      <span className='text-sm font-medium'>{props.label}</span>
      <span className='text-muted-foreground font-mono text-xs'>
        {props.current}x
      </span>
      <span className='font-mono text-sm'>{props.next}x</span>
    </div>
  )
}
