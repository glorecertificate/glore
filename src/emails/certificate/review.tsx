import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Button, Section, Text } from 'react-email'

import { EMAIL_CLASSES } from '@/emails/classes'
import { EmailLayout } from '@/emails/layout'
import { type EmailBaseProps } from '@/emails/translate'
import { DEFAULT_SETTINGS } from '@/lib/app-settings'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface CertificateReviewEmailProps extends EmailBaseProps {
  status: 'approved' | 'changes_requested'
  comment?: string
  documentUrl?: string
  url?: string
  userName?: string
}

const CertificateReviewEmail = ({
  category,
  status,
  comment,
  documentUrl,
  url = `${process.env.APP_URL}/certificates`,
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
  settings = DEFAULT_SETTINGS,
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
  const footer = <Text className={`m-0 ${EMAIL_CLASSES.fine}`}>{t('footer')}</Text>

  return (
    <EmailLayout
      category={category}
      footer={footer}
      locale={locale}
      messages={messages}
      preview={isApproved ? t('previewApproved') : t('previewChanges')}
      settings={settings}
    >
      <Text className={`m-0 ${EMAIL_CLASSES.body}`}>
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className={EMAIL_CLASSES.body}>{isApproved ? t('introApproved') : t('introChanges')}</Text>
      {isApproved ? (
        <>
          <Text className={EMAIL_CLASSES.detail}>{t('detailsApproved')}</Text>
          {documentUrl && (
            <>
              <Text className={EMAIL_CLASSES.detail}>{t('detailsApprovedDownload')}</Text>
              <Section className="my-6 text-center">
                <Button className={EMAIL_CLASSES.button} href={documentUrl}>
                  {t('buttonApproved')}
                </Button>
              </Section>
            </>
          )}
          {!documentUrl && (
            <Section className="my-6 text-center">
              <Button className={EMAIL_CLASSES.button} href={url}>
                {t('buttonApproved')}
              </Button>
            </Section>
          )}
        </>
      ) : (
        <>
          {comment && <Text className={EMAIL_CLASSES.detail}>{t('detailsChanges', { comment })}</Text>}
          <Section className="my-6 text-center">
            <Button className={EMAIL_CLASSES.buttonDanger} href={url}>
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
