import { Button, Section, Text } from '@react-email/components'
import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'

import { EmailLayout } from '@/emails/layout'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface CertificateReviewEmailProps {
  status: 'approved' | 'changes_requested'
  comment?: string
  documentUrl?: string
  userName?: string
  locale?: string
  messages?: AbstractIntlMessages
}

const CertificateReviewEmail = ({
  status,
  comment,
  documentUrl,
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
}: CertificateReviewEmailProps) => {
  const t = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.certificate/review',
  })
  const common = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.common',
  })

  const isApproved = status === 'approved'
  const footer = <Text className="m-0 text-[12px] leading-5 text-[#71717a]">{t('footer')}</Text>

  return (
    <EmailLayout
      footer={footer}
      locale={locale}
      messages={messages}
      preview={isApproved ? t('previewApproved') : t('previewChanges')}
    >
      <Text className="m-0 text-[14px] leading-6 text-[#0a0a0a]">
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className="text-[14px] leading-6 text-[#0a0a0a]">
        {isApproved ? t('introApproved') : t('introChanges')}
      </Text>
      {isApproved ? (
        <>
          <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('detailsApproved')}</Text>
          {documentUrl && (
            <>
              <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('detailsApprovedDownload')}</Text>
              <Section className="my-6 text-center">
                <Button
                  className="rounded-lg bg-brand px-6 py-3 text-[14px] font-semibold text-white no-underline"
                  href={documentUrl}
                >
                  {t('buttonApproved')}
                </Button>
              </Section>
            </>
          )}
          {!documentUrl && (
            <Section className="my-6 text-center">
              <Button
                className="rounded-lg bg-brand px-6 py-3 text-[14px] font-semibold text-white no-underline"
                href={`${metadata.url}/certificates`}
              >
                {t('buttonApproved')}
              </Button>
            </Section>
          )}
        </>
      ) : (
        <>
          {comment && (
            <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('detailsChanges', { comment })}</Text>
          )}
          <Section className="my-6 text-center">
            <Button
              className="rounded-lg bg-[#ef4444] px-6 py-3 text-[14px] font-semibold text-white no-underline"
              href={`${metadata.url}/certificates`}
            >
              {t('buttonChanges')}
            </Button>
          </Section>
        </>
      )}
    </EmailLayout>
  )
}

CertificateReviewEmail.PreviewProps = {
  status: 'approved',
  documentUrl: `${metadata.url}/certificates/preview-id`,
  userName: 'Jane',
} satisfies CertificateReviewEmailProps

export default CertificateReviewEmail
