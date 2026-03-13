import { Link, Text } from '@react-email/components'
import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'

import { EmailLayout } from '@/emails/components/layout'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface AccountEmailChangedEmailProps {
  oldEmail: string
  newEmail: string
  type: 'new' | 'old'
  userName?: string
  locale?: string
  messages?: AbstractIntlMessages
}

const AccountEmailChangedEmail = ({
  oldEmail,
  newEmail,
  type,
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
}: AccountEmailChangedEmailProps) => {
  const t = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.account/email-changed',
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
      <Text className="text-[14px] leading-6 text-[#0a0a0a]">
        {type === 'new' ? t('introNew', { email: newEmail }) : t('introOld', { email: newEmail })}
      </Text>
      <Text className="text-[13px] leading-5.5 text-[#71717a]">
        {type === 'new' ? t('detailsNew', { oldEmail, newEmail }) : t('detailsOld', { oldEmail, newEmail })}
      </Text>
      <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('security')}</Text>
    </EmailLayout>
  )
}

AccountEmailChangedEmail.PreviewProps = {
  oldEmail: 'old@example.com',
  newEmail: 'new@example.com',
  type: 'new',
  userName: 'Jane',
} satisfies AccountEmailChangedEmailProps

export default AccountEmailChangedEmail
