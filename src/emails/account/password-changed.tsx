import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Link, Text } from 'react-email'

import { EMAIL_CLASSES } from '@/emails/classes'
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
      <Text className={EMAIL_CLASSES.body}>{t('intro')}</Text>
      <Text className={EMAIL_CLASSES.detail}>{t('details')}</Text>
    </EmailLayout>
  )
}

AccountPasswordChangedEmail.PreviewProps = {
  userName: 'Jane',
} satisfies AccountPasswordChangedEmailProps

export default AccountPasswordChangedEmail
