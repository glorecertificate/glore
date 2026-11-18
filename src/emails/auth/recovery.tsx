import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Button, Link, Section, Text } from 'react-email'

import { EMAIL_CLASSES } from '@/emails/classes'
import { EmailLayout } from '@/emails/layout'
import { type EmailBaseProps } from '@/emails/translate'
import { DEFAULT_SETTINGS } from '@/lib/app-settings'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface AuthRecoveryEmailProps extends EmailBaseProps {
  url: string
  userName?: string
}

const AuthRecoveryEmail = ({
  category,
  url,
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
  settings = DEFAULT_SETTINGS,
}: AuthRecoveryEmailProps) => {
  const t = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.auth/recovery',
  })
  const common = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.common',
  })

  const footer = (
    <Text className={`mt-4 mb-0 ${EMAIL_CLASSES.fine}`}>
      {' '}
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
      <Text className={EMAIL_CLASSES.detail}>{t('buttonInstruction')}</Text>
      <Section className="my-6 text-center">
        <Button className={EMAIL_CLASSES.button} href={url}>
          {t('button')}
        </Button>
      </Section>
      <Text className={EMAIL_CLASSES.fine}>{t('manualLink')}</Text>
      <Link className={EMAIL_CLASSES.manualLink} href={url}>
        {url}
      </Link>
      <Text className={`mt-4 mb-0 ${EMAIL_CLASSES.fine}`}>{t('instructions')}</Text>
    </EmailLayout>
  )
}

AuthRecoveryEmail.PreviewProps = {
  url: `${metadata.url}/reset-password?token=preview-token`,
  userName: 'Jane',
} satisfies AuthRecoveryEmailProps

export default AuthRecoveryEmail
