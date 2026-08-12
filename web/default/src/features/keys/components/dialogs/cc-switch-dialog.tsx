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
import { ChevronRight } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ComboboxInput } from '@/components/ui/combobox-input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { getUserModels } from '@/lib/api'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { ITERLOOP_API_ORIGIN } from '@/lib/iterloop-host'

const CC_SWITCH_DOWNLOAD_URL = 'https://ccswitch.io'

interface ModelFieldConfig {
  key: string
  labelKey: string
  required: boolean
  /** Preferred model ids, most preferred first. Omit to leave the field empty. */
  preferred?: readonly string[]
  /** Used when none of the preferred ids is available to this key. */
  fallbackPrefix?: string
}

interface AppConfig {
  label: string
  defaultName: string
  /** Appended to the API origin to form the endpoint CC Switch stores. */
  endpointSuffix: string
  /** Identifies which of this account's models this client can actually call. */
  modelPrefixes: readonly string[]
  /**
   * Families that belong to another client but that this client's protocol also
   * serves, offered only once the user opts into mixing families.
   */
  crossModelPrefixes: readonly string[]
  /**
   * Models the relay serves on the Responses API only. They share the gpt-
   * prefix but are bound to a Codex account upstream, which rejects them on the
   * Anthropic Messages path, so they must never reach a Claude Code slot.
   */
  responsesOnlySuffixes?: readonly string[]
  modelFields: readonly ModelFieldConfig[]
}

const APP_CONFIGS: Record<'claude' | 'codex', AppConfig> = {
  claude: {
    label: 'Claude Code',
    defaultName: 'IterLoop',
    // Claude Code speaks the Anthropic Messages API, served from the API origin
    // root — appending /v1 here would double the version prefix.
    endpointSuffix: '',
    modelPrefixes: ['claude-'],
    // The Messages endpoint also answers for Grok and for general GPT models,
    // so a Claude Code slot can be pointed at either family.
    crossModelPrefixes: ['grok-', 'gpt-'],
    responsesOnlySuffixes: ['-sol', '-terra', '-luna'],
    modelFields: [
      // Deliberately has no default: leaving ANTHROPIC_MODEL unset is what keeps
      // every Claude model in the catalog reachable through /model. Pinning one
      // here would lock the client to it.
      {
        key: 'model',
        labelKey: 'Pin a model (optional)',
        required: false,
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
    modelPrefixes: ['gpt-', 'codex-'],
    // The Responses endpoint answers for every family the relay serves, so the
    // Codex default can be a Claude or Grok model.
    crossModelPrefixes: ['claude-', 'grok-'],
    modelFields: [
      // Required: config.toml carries exactly one model, and CC Switch falls back
      // to "gpt-5-codex" when the deep link omits it — a model IterLoop does not
      // serve, which would leave the imported provider broken.
      {
        key: 'model',
        labelKey: 'Default Model',
        required: true,
        preferred: ['gpt-5.6-sol'],
        fallbackPrefix: 'gpt-',
      },
    ],
  },
}

type AppType = keyof typeof APP_CONFIGS

function pickDefaultModels(
  app: AppType,
  availableModels: string[]
): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const field of APP_CONFIGS[app].modelFields) {
    const preferred = field.preferred?.find((name) =>
      availableModels.includes(name)
    )
    const prefix = field.fallbackPrefix
    const chosen =
      preferred ??
      (prefix
        ? availableModels.find((name) => name.startsWith(prefix))
        : undefined)
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
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [mixFamilies, setMixFamilies] = useState(false)

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

  const currentConfig = APP_CONFIGS[app]

  // Only the models this client can actually call. Its own family always
  // qualifies; the families served by the same protocol are added once the user
  // opts in, minus the ones the relay answers on the Responses API alone.
  const usableModels = useMemo(() => {
    const { modelPrefixes, crossModelPrefixes, responsesOnlySuffixes } =
      currentConfig
    return availableModels.filter((model) => {
      if (modelPrefixes.some((prefix) => model.startsWith(prefix))) return true
      if (!mixFamilies) return false
      if (responsesOnlySuffixes?.some((suffix) => model.endsWith(suffix))) {
        return false
      }
      return crossModelPrefixes.some((prefix) => model.startsWith(prefix))
    })
  }, [availableModels, currentConfig, mixFamilies])

  const modelOptions = useMemo(
    () => usableModels.map((m) => ({ value: m, label: m })),
    [usableModels]
  )

  useEffect(() => {
    if (!props.open) return
    setApp('claude')

    setName(APP_CONFIGS.claude.defaultName)

    setAdvancedOpen(false)

    setMixFamilies(false)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModels({})
  }, [props.open])

  // The model list arrives asynchronously, so defaults are filled once it lands.
  useEffect(() => {
    if (!props.open || usableModels.length === 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModels((prev) =>
      Object.keys(prev).length > 0 ? prev : pickDefaultModels(app, usableModels)
    )
  }, [props.open, app, usableModels])

  const endpoint = `${ITERLOOP_API_ORIGIN}${currentConfig.endpointSuffix}`

  const handleAppChange = (val: string) => {
    const appVal = val as AppType
    setApp(appVal)
    setName(APP_CONFIGS[appVal].defaultName)
    setModels({})
  }

  const handleMixFamiliesChange = (checked: boolean) => {
    setMixFamilies(checked)
    if (checked) return
    // Dropping the opt-in has to drop the picks it enabled, or the import would
    // carry a model this client cannot reach.
    setModels((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([, model]) =>
          currentConfig.modelPrefixes.some((prefix) => model.startsWith(prefix))
        )
      )
    )
  }

  const importUrl = () => {
    const required = currentConfig.modelFields.find(
      (f) => f.required && !models[f.key]
    )
    if (required) {
      toast.warning(t('Please select a default model'))
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

  let availabilityNote: string
  if (mixFamilies) {
    availabilityNote = t(
      '{{count}} models on this key can be reached from {{client}}, across Claude, Codex and Grok.',
      { count: usableModels.length, client: currentConfig.label }
    )
  } else if (app === 'claude') {
    availabilityNote = t(
      'All {{count}} Claude models on this key stay available — switch between them with /model inside Claude Code.',
      { count: usableModels.length }
    )
  } else {
    availabilityNote = t(
      'This key serves {{count}} Codex models. Codex stores one default in its config; run codex -m <model> to use another.',
      { count: usableModels.length }
    )
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('Import to CC Switch')}
      contentClassName='sm:max-w-md'
      contentHeight='auto'
      bodyClassName={advancedOpen ? 'space-y-4 pb-52' : 'space-y-4'}
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

        <p className='text-muted-foreground text-xs'>{availabilityNote}</p>

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger
            className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs'
            aria-label={t('Advanced options')}
          >
            <ChevronRight
              aria-hidden='true'
              className={`size-3.5 transition-transform ${advancedOpen ? 'rotate-90' : ''}`}
            />
            {t('Advanced options')}
          </CollapsibleTrigger>
          <CollapsibleContent className='space-y-4 pt-4'>
            <div className='flex items-start justify-between gap-4'>
              <div className='space-y-1'>
                <Label htmlFor='cc-switch-mix-families'>
                  {t('Use models from other families')}
                </Label>
                <p className='text-muted-foreground text-xs'>
                  {app === 'claude'
                    ? t(
                        'Point the slots below at Grok or GPT models on the same key. Codex-only models stay hidden because Claude Code cannot reach them.'
                      )
                    : t(
                        'Point the default below at a Claude or Grok model on the same key.'
                      )}
                </p>
              </div>
              <Switch
                id='cc-switch-mix-families'
                checked={mixFamilies}
                onCheckedChange={handleMixFamiliesChange}
                aria-label={t('Use models from other families')}
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
          </CollapsibleContent>
        </Collapsible>

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
