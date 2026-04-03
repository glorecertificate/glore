import { Button, Section, Text } from '@react-email/components'
import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'

import { EmailLayout } from '@/emails/layout'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface OrganizationMemberAddedEmailProps {
  organizationName: string
  inviterName: string
  role: string
  isNewUser?: boolean
  userName?: string
  locale?: string
  messages?: AbstractIntlMessages
}

const OrganizationMemberAddedEmail = ({
  organizationName,
  inviterName,
  role,
  isNewUser = false,
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
}: OrganizationMemberAddedEmailProps) => {
  const t = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.organization/member-added',
  })
  const common = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.common',
  })

  const footer = <Text className="m-0 text-[12px] leading-5 text-[#71717a]">{t('footer')}</Text>

  return (
    <EmailLayout footer={footer} locale={locale} messages={messages} preview={t('preview', { organizationName })}>
      <Text className="m-0 text-[14px] leading-6 text-[#0a0a0a]">
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className="text-[14px] leading-6 text-[#0a0a0a]">
        {t('intro', { inviterName, organizationName, role })}
      </Text>
      <Text className="text-[13px] leading-5.5 text-[#71717a]">
        {isNewUser ? t('detailsNew') : t('detailsExisting')}
      </Text>
      <Section className="my-6 text-center">
        <Button
          className="rounded-lg bg-brand px-6 py-3 text-[14px] font-semibold text-white no-underline"
          href={isNewUser ? `${metadata.url}/onboarding` : `${metadata.url}/login`}
        >
          {isNewUser ? t('buttonNewUser') : t('button')}
        </Button>
      </Section>
    </EmailLayout>
  )
}

OrganizationMemberAddedEmail.PreviewProps = {
  organizationName: 'Acme Corp',
  inviterName: 'Alex',
  role: 'learner',
  isNewUser: false,
  userName: 'Jane',
} satisfies OrganizationMemberAddedEmailProps

export default OrganizationMemberAddedEmail
