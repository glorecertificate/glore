import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Button, Hr, Link, Section, Text } from 'react-email'

import { EmailLayout } from '@/emails/layout'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface AuthVerifyEmailEmailProps {
  url: string
  userName?: string
  locale?: string
  messages?: AbstractIntlMessages
}

const AuthVerifyEmailEmail = ({
  url,
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
}: AuthVerifyEmailEmailProps) => {
  const t = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.auth/verify-email',
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
      <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('buttonInstruction')}</Text>
      <Section className="my-6 text-center">
        <Button className="rounded-lg bg-brand px-6 py-3 text-[14px] font-semibold text-white no-underline" href={url}>
          {t('button')}
        </Button>
      </Section>
      <Text className="text-[12px] leading-5 text-[#71717a]">{t('manualLink')}</Text>
      <Link className="text-[12px] break-all text-[#3bb5da]" href={url}>
        {url}
      </Link>
      <Hr className="mx-0 my-6 border-[#e4e4e7]" />
      <Text className="m-0 text-[12px] leading-5 text-[#71717a]">{t('instructions')}</Text>
    </EmailLayout>
  )
}

AuthVerifyEmailEmail.PreviewProps = {
  url: `${metadata.url}/verify-email?token=preview-token`,
  userName: 'Jane',
} satisfies AuthVerifyEmailEmailProps

export default AuthVerifyEmailEmail
