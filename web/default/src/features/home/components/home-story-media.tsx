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
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

export type HomeStoryScene =
  | 'overview'
  | 'keys'
  | 'logs'
  | 'issuance'
  | 'config'

type HomeStoryMediaProps = {
  scene: HomeStoryScene
  className?: string
  priority?: boolean
  sizes?: string
}

const ALT_TEXT: Record<HomeStoryScene, string> = {
  overview: 'IterLoop console overview',
  keys: 'IterLoop API key management',
  logs: 'IterLoop usage logs',
  issuance: 'IterLoop API issuance',
  config: 'IterLoop client configuration documentation',
}

export function HomeStoryMedia(props: HomeStoryMediaProps) {
  const { i18n, t } = useTranslation()
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'zh'
  const base = `/media/home/story/story-${props.scene}-${language}`
  const sizes =
    props.sizes ??
    '(max-width: 767px) calc(100vw - 40px), (max-width: 1100px) calc(100vw - 64px), 826px'

  return (
    <picture className={cn('iterloop-story-media', props.className)}>
      <source
        type='image/avif'
        srcSet={`${base}-768.avif 768w, ${base}-1440.avif 1440w`}
        sizes={sizes}
      />
      <source
        type='image/webp'
        srcSet={`${base}-768.webp 768w, ${base}-1440.webp 1440w`}
        sizes={sizes}
      />
      <img
        src={`${base}-1440.png`}
        srcSet={`${base}-768.png 768w, ${base}-1440.png 1440w`}
        sizes={sizes}
        width='1440'
        height='900'
        alt={t(ALT_TEXT[props.scene])}
        loading={props.priority ? 'eager' : 'lazy'}
        decoding='async'
        fetchPriority={props.priority ? 'high' : 'auto'}
      />
    </picture>
  )
}
