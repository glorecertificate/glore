import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Button, Hr, Link, Section, Text } from 'react-email'

import { EmailLayout } from '@/emails/layout'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface TeamInviteEmailProps {
  url: string
  inviteeName: string
  role: 'admin' | 'editor'
  userName?: string
  locale?: string
  messages?: AbstractIntlMessages
}

const TeamInviteEmail = ({
  url,
  inviteeName,
  role,
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
}: TeamInviteEmailProps) => {
  const t = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.team/invite',
  })
  const common = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.common',
  })

  const roleLabel = role === 'admin' ? t('role_admin') : t('role_editor')

  const footer = (
    <Text className="m-0 text-[12px] leading-5 text-[#71717a]">
      {t.rich('footer', {
        invitee: inviteeName,
        emailLink: chunks => <Link href={`mailto:${metadata.email}`}>{chunks}</Link>,
      })}
    </Text>
  )

  return (
    <EmailLayout footer={footer} locale={locale} messages={messages} preview={t('preview')}>
      <Text className="m-0 text-[14px] leading-6 text-[#0a0a0a]">
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className="text-[14px] leading-6 text-[#0a0a0a]">
        {t('intro', { invitee: inviteeName, role: roleLabel })}
      </Text>
      <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('description')}</Text>
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
      <Text className="m-0 text-[12px] leading-5 text-[#71717a]">{t('expiry')}</Text>
    </EmailLayout>
  )
}

TeamInviteEmail.PreviewProps = {
  url: `${metadata.url}/join?token=preview-token`,
  inviteeName: 'Alex',
  role: 'editor',
  userName: 'Jane',
} satisfies TeamInviteEmailProps

export default TeamInviteEmail
