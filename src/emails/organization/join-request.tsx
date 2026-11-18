import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Button, Section, Text } from 'react-email'

import { EMAIL_CLASSES } from '@/emails/classes'
import { EmailLayout } from '@/emails/layout'
import { type EmailBaseProps } from '@/emails/translate'
import { DEFAULT_SETTINGS } from '@/lib/app-settings'
import config from '~/config/app.json'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface OrganizationJoinRequestEmailProps extends EmailBaseProps {
  organizationName: string
  status: 'accepted' | 'pending' | 'rejected'
  comment?: string | null
  url?: string
  userName?: string
}

const OrganizationJoinRequestEmail = ({
  category,
  organizationName,
  status,
  comment,
  url,
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
  settings = DEFAULT_SETTINGS,
}: OrganizationJoinRequestEmailProps) => {
  const t = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.organization/join-request',
  })
  const common = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.common',
  })

  const isAccepted = status === 'accepted'
  const isPending = status === 'pending'
  const footer = <Text className={`m-0 ${EMAIL_CLASSES.fine}`}>{t('footer')}</Text>

  const preview = isPending
    ? t('previewPending', { organizationName })
    : isAccepted
      ? t('previewAccepted', { organizationName })
      : t('previewRejected', { organizationName })

  const intro = isPending
    ? t('introPending', { organizationName })
    : isAccepted
      ? t('introAccepted', { organizationName })
      : t('introRejected', { organizationName })

  return (
    <EmailLayout
      category={category}
      footer={footer}
      locale={locale}
      messages={messages}
      preview={preview}
      settings={settings}
    >
      <Text className={`m-0 ${EMAIL_CLASSES.body}`}>
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className={EMAIL_CLASSES.body}>{intro}</Text>
      {isPending && <Text className={EMAIL_CLASSES.detail}>{t('detailsPending')}</Text>}
      {isAccepted && (
        <Text className={EMAIL_CLASSES.detail}>{url ? t('detailsAcceptedNew') : t('detailsAccepted')}</Text>
      )}
      {!isPending && comment && <Text className={EMAIL_CLASSES.detail}>{t('detailsComment', { comment })}</Text>}
      {isAccepted && (
        <>
          <Section className="my-6 text-center">
            <Button className={EMAIL_CLASSES.button} href={url ?? `${process.env.APP_URL}/login`}>
              {url ? t('buttonSetup') : t('button')}
            </Button>
          </Section>
          {url && <Text className={EMAIL_CLASSES.fine}>{t('expiry', { days: config.invitationExpiryDays })}</Text>}
        </>
      )}
    </EmailLayout>
  )
}

OrganizationJoinRequestEmail.PreviewProps = {
  comment: 'Welcome to GloRe! Reach out to us any time if you need a hand getting started.',
  organizationName: 'Acme Corp',
  status: 'accepted',
  url: `${metadata.url}/api/v1/join?token=preview-token`,
  userName: 'Jane',
} satisfies OrganizationJoinRequestEmailProps

export default OrganizationJoinRequestEmail
