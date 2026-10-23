import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Button, Link, Section, Text } from 'react-email'

import { EmailLayout } from '@/emails/layout'
import { type EmailBaseProps } from '@/emails/translate'
import { DEFAULT_SETTINGS } from '@/lib/app-settings'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface AccountPasswordChangedEmailProps extends EmailBaseProps {
  userName?: string
}

const AccountPasswordChangedEmail = ({
  category,
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
  settings = DEFAULT_SETTINGS,
}: AccountPasswordChangedEmailProps) => {
  const t = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.account/password-changed',
  })
  const common = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.common',
  })

  const footer = (
    <Text className="m-0 text-[12px] leading-5 text-[#71717a]">
      {t.rich('footer', {
        emailLink: chunks => <Link href={`mailto:${settings.email}`}>{chunks}</Link>,
      })}
    </Text>
  )

  return (
    <EmailLayout
      category={category}
      footer={footer}
      locale={locale}
      messages={messages}
      preview={t('preview')}
      settings={settings}
    >
      <Text className="m-0 text-[14px] leading-6 text-[#0a0a0a]">
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className="text-[14px] leading-6 text-[#0a0a0a]">{t('intro')}</Text>
      <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('details')}</Text>
      <Section className="mt-6 text-center">
        <Button
          className="rounded-lg bg-brand px-6 py-3 text-[14px] font-semibold text-white no-underline"
          href={`mailto:${settings.email}`}
        >
          {common('contactUs')}
        </Button>
      </Section>
    </EmailLayout>
  )
}

AccountPasswordChangedEmail.PreviewProps = {
  userName: 'Jane',
} satisfies AccountPasswordChangedEmailProps

export default AccountPasswordChangedEmail
