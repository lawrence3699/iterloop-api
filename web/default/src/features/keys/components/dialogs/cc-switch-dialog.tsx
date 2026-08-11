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
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { ComboboxInput } from '@/components/ui/combobox-input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getUserModels } from '@/lib/api'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { ITERLOOP_API_ORIGIN } from '@/lib/iterloop-host'

const CC_SWITCH_DOWNLOAD_URL = 'https://ccswitch.io'

interface ModelFieldConfig {
  key: string
  labelKey: string
  required: boolean
  /** Preferred model ids, most preferred first. */
  preferred: readonly string[]
  /** Used when none of the preferred ids is available to this key. */
  fallbackPrefix: string
}

interface AppConfig {
  label: string
  defaultName: string
  /** Appended to the API origin to form the endpoint CC Switch stores. */
  endpointSuffix: string
  modelFields: readonly ModelFieldConfig[]
}

const APP_CONFIGS: Record<'claude' | 'codex', AppConfig> = {
  claude: {
    label: 'Claude Code',
    defaultName: 'IterLoop',
    // Claude Code speaks the Anthropic Messages API, served from the API origin
    // root — appending /v1 here would double the version prefix.
    endpointSuffix: '',
    modelFields: [
      {
        key: 'model',
        labelKey: 'Primary Model',
        required: true,
        preferred: ['claude-sonnet-4-6'],
        fallbackPrefix: 'claude-sonnet',
      },
      {
        key: 'haikuModel',
        labelKey: 'Haiku Model',
        required: false,
        preferred: ['claude-haiku-4-5-20251001'],
        fallbackPrefix: 'claude-haiku',
      },
      {
        key: 'sonnetModel',
        labelKey: 'Sonnet Model',
        required: false,
        preferred: ['claude-sonnet-4-6'],
        fallbackPrefix: 'claude-sonnet',
      },
      {
        key: 'opusModel',
        labelKey: 'Opus Model',
        required: false,
        preferred: ['claude-opus-5'],
        fallbackPrefix: 'claude-opus',
      },
    ],
  },
  codex: {
    label: 'Codex',
    defaultName: 'IterLoop Codex',
    // Codex speaks the OpenAI Responses API, which lives under /v1.
    endpointSuffix: '/v1',
    modelFields: [
      {
        key: 'model',
        labelKey: 'Primary Model',
        required: true,
        preferred: ['gpt-5.6-sol'],
        fallbackPrefix: 'gpt-',
      },
    ],
  },
}

type AppType = keyof typeof APP_CONFIGS

/**
 * Pre-fills the model fields so the dialog is genuinely one-click. A default is
 * only used when this key can actually reach the model, so a retired model never
 * leaves a field pointing at something the request would reject.
 */
function pickDefaultModels(
  app: AppType,
  availableModels: string[]
): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const field of APP_CONFIGS[app].modelFields) {
    const chosen =
      field.preferred.find((name) => availableModels.includes(name)) ??
      availableModels.find((name) => name.startsWith(field.fallbackPrefix))
    if (chosen) defaults[field.key] = chosen
  }
  return defaults
}

function buildCCSwitchURL(
  app: AppType,
  name: string,
  models: Record<string, string>,
  apiKey: string
): string {
  const endpoint = `${ITERLOOP_API_ORIGIN}${APP_CONFIGS[app].endpointSuffix}`
  const params: [string, string][] = [
    ['resource', 'provider'],
    ['app', app],
    ['name', name],
    ['endpoint', endpoint],
    ['apiKey', apiKey],
    ...Object.entries(models).filter(([, v]) => v),
    ['homepage', ITERLOOP_API_ORIGIN],
    ['enabled', 'true'],
  ]
  // Percent-encode rather than using URLSearchParams, which writes spaces as
  // "+" — the CC Switch deep-link spec documents %20.
  const query = params
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  return `ccswitch://v1/import?${query}`
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokenKey: string
}

export function CCSwitchDialog(props: Props) {
  const { t } = useTranslation()
  const [app, setApp] = useState<AppType>('claude')
  const [name, setName] = useState<string>(APP_CONFIGS.claude.defaultName)
  const [models, setModels] = useState<Record<string, string>>({})

  const { data: modelsData } = useQuery({
    queryKey: ['user-models-ccswitch'],
    queryFn: getUserModels,
    enabled: props.open,
    staleTime: 5 * 60 * 1000,
  })

  const availableModels = useMemo(
    () => modelsData?.data ?? [],
    [modelsData?.data]
  )

  const modelOptions = useMemo(
    () => availableModels.map((m) => ({ value: m, label: m })),
    [availableModels]
  )

  useEffect(() => {
    if (!props.open) return
    setApp('claude')

    setName(APP_CONFIGS.claude.defaultName)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModels({})
  }, [props.open])

  // The model list arrives asynchronously, so defaults are filled once it lands.
  // Anything the user already picked wins.
  useEffect(() => {
    if (!props.open || availableModels.length === 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModels((prev) =>
      prev.model ? prev : pickDefaultModels(app, availableModels)
    )
  }, [props.open, app, availableModels])

  const currentConfig = APP_CONFIGS[app]
  const endpoint = `${ITERLOOP_API_ORIGIN}${currentConfig.endpointSuffix}`

  const handleAppChange = (val: string) => {
    const appVal = val as AppType
    setApp(appVal)
    setName(APP_CONFIGS[appVal].defaultName)
    setModels(pickDefaultModels(appVal, availableModels))
  }

  const importUrl = () => {
    if (!models.model) {
      toast.warning(t('Please select a primary model'))
      return null
    }
    const key = props.tokenKey.startsWith('sk-')
      ? props.tokenKey
      : `sk-${props.tokenKey}`
    return buildCCSwitchURL(app, name, models, key)
  }

  const handleSubmit = () => {
    const url = importUrl()
    if (!url) return
    // A custom scheme has to replace the current location: window.open leaves an
    // orphaned blank tab behind in Chrome and Safari.
    window.location.href = url
    props.onOpenChange(false)
  }

  const handleCopyLink = async () => {
    const url = importUrl()
    if (!url) return
    const ok = await copyToClipboard(url)
    if (ok) toast.success(t('Copied'))
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('Import to CC Switch')}
      contentClassName='sm:max-w-md'
      contentHeight='auto'
      bodyClassName={
        currentConfig.modelFields.length === 1 ? 'space-y-4 pb-52' : 'space-y-4'
      }
      footer={
        <>
          <Button variant='outline' onClick={() => props.onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={handleSubmit}>{t('Open CC Switch')}</Button>
        </>
      }
    >
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label>{t('Application')}</Label>
          <RadioGroup
            value={app}
            onValueChange={handleAppChange}
            className='flex gap-4'
          >
            {(Object.entries(APP_CONFIGS) as [AppType, AppConfig][]).map(
              ([key, cfg]) => (
                <div key={key} className='flex items-center gap-2'>
                  <RadioGroupItem value={key} id={`app-${key}`} />
                  <Label htmlFor={`app-${key}`} className='cursor-pointer'>
                    {cfg.label}
                  </Label>
                </div>
              )
            )}
          </RadioGroup>
        </div>

        <div className='space-y-2'>
          <Label>{t('Base URL')}</Label>
          <p className='text-muted-foreground font-mono text-xs'>{endpoint}</p>
        </div>

        <div className='space-y-2'>
          <Label>{t('Name')}</Label>
          <ComboboxInput
            options={[]}
            value={name}
            onValueChange={setName}
            placeholder={currentConfig.defaultName}
            emptyText=''
            allowCustomValue={true}
          />
        </div>

        {currentConfig.modelFields.map((field) => (
          <div key={field.key} className='space-y-2'>
            <Label>
              {t(field.labelKey)}
              {field.required && (
                <span className='text-destructive ml-0.5'>*</span>
              )}
            </Label>
            <ComboboxInput
              options={modelOptions}
              value={models[field.key] || ''}
              onValueChange={(v) =>
                setModels((prev) => ({ ...prev, [field.key]: v }))
              }
              placeholder={t('Select or enter model name')}
              emptyText={t('No models found')}
            />
          </div>
        ))}

        <p className='text-muted-foreground text-xs'>
          {t('Nothing happened? Install CC Switch first, then try again.')}{' '}
          <a
            href={CC_SWITCH_DOWNLOAD_URL}
            target='_blank'
            rel='noreferrer'
            className='underline underline-offset-2'
          >
            {t('Download CC Switch')}
          </a>
          {' · '}
          <button
            type='button'
            onClick={handleCopyLink}
            className='underline underline-offset-2'
          >
            {t('Copy import link')}
          </button>
        </p>
      </div>
    </Dialog>
  )
}
