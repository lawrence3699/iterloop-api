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

import { DocSection, DocsLayout } from '../components/docs-layout'

export function BillingQuestionsDocs() {
  const { t } = useTranslation()
  return (
    <DocsLayout
      active='billing-questions'
      title='Billing questions'
      description='Answers to the most common questions about credit, top-ups, refunds, and usage-based pricing on IterLoop.'
    >
      <DocSection id='new-credit' title='Do I get free credit when I sign up?'>
        <p>
          {t(
            'Yes. New accounts automatically receive a $2 credit as soon as you register, whether you sign up with email or with Google. There is no code to redeem, it is applied for you.'
          )}
        </p>
      </DocSection>

      <DocSection id='top-up' title='How do I add funds to my account?'>
        <p>
          {t(
            'IterLoop is pay-as-you-go. You can top up any time with a card via Stripe, and charges are settled in Australian dollars (AUD). The preset top-up amounts shown adapt to your site language, or you can enter a custom amount, with a minimum charge of A$1.00 per top-up.'
          )}
        </p>
      </DocSection>

      <DocSection id='refunds' title='What happens if I get a refund or file a dispute?'>
        <p>
          {t(
            'If a top-up is refunded or disputed through Stripe, IterLoop removes the matching share of credit from your balance in proportion to the refund. A full refund removes the full amount that was credited to you, and a partial refund removes only a proportional part. If a dispute is later resolved in your favor, the credit that was removed is restored to your balance.'
          )}
        </p>
      </DocSection>

      <DocSection id='balance-limits' title='Balance, limits, and receipts'>
        <h3>{t('Does my balance expire?')}</h3>
        <p>
          {t(
            'No. Your credit balance does not expire or reset over time. Note that this is separate from API keys, which can optionally be given their own expiry date when you create them.'
          )}
        </p>
        <h3>{t('Is there a spending limit?')}</h3>
        <p>
          {t(
            'There is no hard cap on how much you can spend. If you would like a heads-up before your balance runs low, you can optionally set a low-balance email alert threshold in your account settings.'
          )}
        </p>
        <h3>{t('Do I get a receipt for my payment?')}</h3>
        <p>
          {t(
            'Yes. Stripe automatically emails a payment receipt to the email address you used at checkout.'
          )}
        </p>
      </DocSection>

      <DocSection id='usage-billing' title='How is my usage actually billed?'>
        <h3>{t('Prompt caching')}</h3>
        <p>
          {t(
            'When a request reuses a cached prompt prefix, those cached input tokens are billed at a reduced rate below normal input pricing, shown as the "Cache" price on the pricing table. Writing a new entry to the cache costs a bit more than normal input, which reflects the one-time cost of creating that cache.'
          )}
        </p>
        <h3>{t('Failed or interrupted requests')}</h3>
        <p>
          {t(
            "You are only billed for tokens that were actually generated. If a request fails before producing any output, it is fully refunded and costs you nothing. If a request streams some output before failing partway through, you are billed only for the tokens it actually produced."
          )}
        </p>
      </DocSection>
    </DocsLayout>
  )
}
