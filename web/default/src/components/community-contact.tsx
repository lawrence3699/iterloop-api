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
import { ExternalLink, MessagesSquare } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'

import { IconDiscord, IconWhatsapp } from '@/assets/brand-icons'
import { Dialog } from '@/components/dialog'

const DISCORD_COMMUNITY_URL = 'https://discord.gg/wzDqtGdey'

export function CommunityContact() {
  const { t } = useTranslation()

  return (
    <Dialog
      title={t('Join the community')}
      description={t('Scan the QR code to join the conversation.')}
      contentClassName='sm:max-w-2xl'
      contentHeight='auto'
      bodyClassName='py-2'
      initialFocus={false}
      trigger={
        <button
          type='button'
          className='group fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-60 flex size-16 items-center justify-center rounded-full border-2 border-white/80 text-white shadow-[0_14px_36px_rgba(208,36,15,0.5)] transition duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-[0_20px_46px_rgba(208,36,15,0.64)] focus-visible:ring-4 focus-visible:ring-[#ff9931]/60 focus-visible:outline-none motion-safe:animate-[pulse_2.6s_ease-in-out_infinite] motion-reduce:transition-none'
          style={{
            background:
              'linear-gradient(135deg, #d0240f 0%, #e85d25 58%, #ff9931 100%)',
            color: '#fff',
          }}
          aria-label={t('Open community contact options')}
        >
          <span
            aria-hidden='true'
            className='absolute -inset-2 rounded-full border-2 border-[#ff9931]/70 opacity-70 motion-safe:animate-ping motion-reduce:animate-none'
          />
          <span
            aria-hidden='true'
            className='absolute inset-1 rounded-full bg-white/20 blur-sm'
          />
          <span
            aria-hidden='true'
            className='absolute inset-0 rounded-full bg-linear-to-tr from-transparent via-white/25 to-transparent opacity-80'
          />
          <MessagesSquare className='relative size-7 stroke-[2.5]' />
        </button>
      }
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <section className='border-border/70 bg-muted/20 flex flex-col items-center rounded-2xl border p-5 text-center shadow-sm'>
          <div className='mb-3 flex size-10 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#169c4b]'>
            <IconWhatsapp aria-hidden='true' className='size-5' />
          </div>
          <h3 className='text-base font-semibold'>{t('WhatsApp group')}</h3>
          <p className='text-muted-foreground mt-1 text-sm'>
            {t('Scan the QR code to join the conversation.')}
          </p>
          <div
            role='img'
            aria-label={t('WhatsApp group QR code')}
            className='mt-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5'
          >
            <img
              src='/media/iterloop-whatsapp-community-qr.png'
              alt=''
              className='size-48 rounded-lg object-contain sm:size-52'
            />
          </div>
        </section>

        <section className='border-border/70 bg-muted/20 flex flex-col items-center rounded-2xl border p-5 text-center shadow-sm'>
          <div className='mb-3 flex size-10 items-center justify-center rounded-xl bg-[#5865F2]/15 text-[#5865F2]'>
            <IconDiscord aria-hidden='true' className='size-5' />
          </div>
          <h3 className='text-base font-semibold'>{t('Discord community')}</h3>
          <p className='text-muted-foreground mt-1 text-sm'>
            {t('Scan the QR code to join the conversation.')}
          </p>
          <a
            href={DISCORD_COMMUNITY_URL}
            target='_blank'
            rel='noreferrer'
            aria-label={t('Discord community QR code')}
            className='mt-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-[#5865F2]/45 focus-visible:outline-none'
          >
            <QRCodeSVG
              value={DISCORD_COMMUNITY_URL}
              size={208}
              level='Q'
              includeMargin={false}
            />
          </a>
          <a
            href={DISCORD_COMMUNITY_URL}
            target='_blank'
            rel='noreferrer'
            className='mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#5865F2] transition hover:text-[#4650c6] focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-[#5865F2]/45 focus-visible:outline-none'
          >
            {t('Open Discord')}
            <ExternalLink aria-hidden='true' className='size-3.5' />
          </a>
        </section>
      </div>
    </Dialog>
  )
}
