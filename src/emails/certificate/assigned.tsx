import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Button, Section, Text } from 'react-email'

import { EmailLayout } from '@/emails/layout'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface CertificateAssignedEmailProps {
  locale?: string
  messages?: AbstractIntlMessages
}

const CertificateAssignedEmail = ({
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
}: CertificateAssignedEmailProps) => {
  const t = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.certificate/assigned',
  })
  const common = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.common',
  })

  const footer = <Text className="m-0 text-[12px] leading-5 text-[#71717a]">{t('footer')}</Text>

  return (
    <EmailLayout footer={footer} locale={locale} messages={messages} preview={t('preview')}>
      <Text className="m-0 text-[14px] leading-6 text-[#0a0a0a]">{common('greeting')}</Text>
      <Text className="text-[14px] leading-6 text-[#0a0a0a]">{t('intro')}</Text>
      <Section className="my-6 text-center">
        <Button
          className="rounded-lg bg-brand px-6 py-3 text-[14px] font-semibold text-white no-underline"
          href={`${metadata.url}/certificates`}
        >
          {t('button')}
        </Button>
      </Section>
    </EmailLayout>
  )
}

CertificateAssignedEmail.PreviewProps = {} satisfies CertificateAssignedEmailProps

export default CertificateAssignedEmail
