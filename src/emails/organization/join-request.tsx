import { Button, Section, Text } from '@react-email/components'
import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'

import { EmailLayout } from '@/emails/layout'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface OrganizationJoinRequestEmailProps {
  organizationName: string
  status: 'accepted' | 'pending' | 'rejected'
  comment?: string | null
  userName?: string
  locale?: string
  messages?: AbstractIntlMessages
}

const OrganizationJoinRequestEmail = ({
  organizationName,
  status,
  comment,
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
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
  const footer = <Text className="m-0 text-[12px] leading-5 text-[#71717a]">{t('footer')}</Text>

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
    <EmailLayout footer={footer} locale={locale} messages={messages} preview={preview}>
      <Text className="m-0 text-[14px] leading-6 text-[#0a0a0a]">
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className="text-[14px] leading-6 text-[#0a0a0a]">{intro}</Text>
      {isPending && <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('detailsPending')}</Text>}
      {isAccepted && <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('detailsAccepted')}</Text>}
      {!isAccepted && !isPending && comment && (
        <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('detailsRejected', { comment })}</Text>
      )}
      {isAccepted && (
        <Section className="my-6 text-center">
          <Button
            className="rounded-lg bg-brand px-6 py-3 text-[14px] font-semibold text-white no-underline"
            href={`${metadata.url}/login`}
          >
            {t('button')}
          </Button>
        </Section>
      )}
    </EmailLayout>
  )
}

OrganizationJoinRequestEmail.PreviewProps = {
  organizationName: 'Acme Corp',
  status: 'accepted',
  userName: 'Jane',
} satisfies OrganizationJoinRequestEmailProps

export default OrganizationJoinRequestEmail
