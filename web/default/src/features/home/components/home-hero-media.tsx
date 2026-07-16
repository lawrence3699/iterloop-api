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
import { ArrowRightLeft, Check, KeyRound, SquareTerminal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { HomeStoryMedia } from './home-story-media'

export function HomeHeroMedia() {
  const { t } = useTranslation()

  return (
    <div
      className='iterloop-hero-media'
      aria-label={t('One key, from IterLoop to your client.')}
    >
      <div className='iterloop-hero-main-window'>
        <div className='iterloop-hero-browser-bar'>
          <span aria-hidden='true'>
            <i />
            <i />
            <i />
          </span>
          <code>console.iter-loop.com/keys</code>
          <KeyRound aria-hidden='true' />
        </div>
        <HomeStoryMedia scene='keys' priority sizes='640px' />
      </div>

      <div className='iterloop-hero-switch-panel'>
        <div>
          <span>
            <ArrowRightLeft aria-hidden='true' />
            CC Switch
          </span>
          <Check aria-hidden='true' />
        </div>
        <dl>
          <div>
            <dt>{t('Client')}</dt>
            <dd>Codex</dd>
          </div>
          <div>
            <dt>{t('Model')}</dt>
            <dd>gpt-5.6-sol</dd>
          </div>
        </dl>
        <strong>{t('Ready to import')}</strong>
      </div>

      <div className='iterloop-hero-result-panel'>
        <div>
          <SquareTerminal aria-hidden='true' />
          <span>Codex</span>
        </div>
        <code>$ codex --model gpt-5.6-sol</code>
        <p>response.completed</p>
        <strong>
          <Check aria-hidden='true' />
          {t('Connected')}
        </strong>
      </div>
    </div>
  )
}
