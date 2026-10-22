import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Link, Text } from 'react-email'

import { EmailLayout } from '@/emails/layout'
import { type EmailBaseProps } from '@/emails/translate'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface AccountEmailChangedEmailProps extends EmailBaseProps {
  oldEmail: string
  newEmail: string
  userName?: string
}

const AccountEmailChangedEmail = ({
  category,
  oldEmail,
  newEmail,
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
    <EmailLayout category={category} footer={footer} locale={locale} messages={messages} preview={t('preview')}>
      <Text className="m-0 text-[14px] leading-6 text-[#0a0a0a]">
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className="text-[14px] leading-6 text-[#0a0a0a]">{t('intro', { email: newEmail })}</Text>
      <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('details', { oldEmail, newEmail })}</Text>
      <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('security')}</Text>
    </EmailLayout>
  )
}

AccountEmailChangedEmail.PreviewProps = {
  oldEmail: 'old@example.com',
  newEmail: 'new@example.com',
  userName: 'Jane',
} satisfies AccountEmailChangedEmailProps

export default AccountEmailChangedEmail
