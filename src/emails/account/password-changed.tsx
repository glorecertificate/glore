import { Button, Link, Section, Text } from '@react-email/components'
import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'

import { EmailLayout } from '@/emails/layout'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface AccountPasswordChangedEmailProps {
  userName?: string
  locale?: string
  messages?: AbstractIntlMessages
}

const AccountPasswordChangedEmail = ({
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
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
        emailLink: chunks => <Link href={`mailto:${metadata.email}`}>{chunks}</Link>,
      })}
    </Text>
  )

  return (
    <EmailLayout footer={footer} locale={locale} messages={messages} preview={t('preview')}>
      <Text className="m-0 text-[14px] leading-6 text-[#0a0a0a]">
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className="text-[14px] leading-6 text-[#0a0a0a]">{t('intro')}</Text>
      <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('details')}</Text>
      <Section className="mt-6 text-center">
        <Button
          className="rounded-lg bg-brand px-6 py-3 text-[14px] font-semibold text-white no-underline"
          href={`${metadata.url}/login`}
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
