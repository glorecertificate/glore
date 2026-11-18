import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Link, Text } from 'react-email'

import { EMAIL_CLASSES } from '@/emails/classes'
import { EmailLayout } from '@/emails/layout'
import { type EmailBaseProps } from '@/emails/translate'
import { DEFAULT_SETTINGS } from '@/lib/app-settings'
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
  settings = DEFAULT_SETTINGS,
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
    <Text className={`m-0 ${EMAIL_CLASSES.fine}`}>
      {t.rich('footer', {
        emailLink: chunks => (
          <Link className={EMAIL_CLASSES.link} href={`mailto:${settings.email}`}>
            {chunks}
          </Link>
        ),
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
      <Text className={`m-0 ${EMAIL_CLASSES.body}`}>
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className={EMAIL_CLASSES.body}>{t('intro', { email: newEmail })}</Text>
      <Text className={EMAIL_CLASSES.detail}>{t('details', { oldEmail, newEmail })}</Text>
      <Text className={EMAIL_CLASSES.detail}>{t('security')}</Text>
    </EmailLayout>
  )
}

AccountEmailChangedEmail.PreviewProps = {
  oldEmail: 'old@example.com',
  newEmail: 'new@example.com',
  userName: 'Jane',
} satisfies AccountEmailChangedEmailProps

export default AccountEmailChangedEmail
