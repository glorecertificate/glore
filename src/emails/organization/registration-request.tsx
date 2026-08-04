import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Button, Section, Text } from 'react-email'

import { EmailLayout } from '@/emails/layout'
import { type MessageKey } from '@/lib/i18n'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface OrganizationRegistrationRequestEmailProps {
  city: string
  organizationId: number
  organizationName: string
  registrantEmail: string
  registrantName: string
  country?: string | null
  message?: string | null
  userName?: string
  locale?: string
  messages?: AbstractIntlMessages
}

const OrganizationRegistrationRequestEmail = ({
  city,
  organizationId,
  organizationName,
  registrantEmail,
  registrantName,
  country,
  message,
  userName,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
}: OrganizationRegistrationRequestEmailProps) => {
  const t = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.organization/registration-request',
  })
  const common = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Email.common',
  })
  const countries = createTranslator({
    locale: locale as Locale,
    messages: messages as unknown as Messages,
    namespace: 'Intl.Countries',
  })

  const countryKey = country as MessageKey<'Intl.Countries'>
  const countryName = countries.has(countryKey) ? countries(countryKey) : country?.toUpperCase()
  const location = [city, countryName].filter(Boolean).join(', ')
  const footer = <Text className="m-0 text-[12px] leading-5 text-[#71717a]">{t('footer')}</Text>

  return (
    <EmailLayout footer={footer} locale={locale} messages={messages} preview={t('preview', { organizationName })}>
      <Text className="m-0 text-[14px] leading-6 text-[#0a0a0a]">
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className="text-[14px] leading-6 text-[#0a0a0a]">{t('intro', { organizationName })}</Text>
      <Text className="text-[13px] leading-5.5 text-[#71717a]">
        {t('details', { registrantEmail, registrantName })}
      </Text>
      {location && <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('location', { location })}</Text>}
      {message && <Text className="text-[13px] leading-5.5 text-[#71717a]">{t('message', { message })}</Text>}
      <Section className="my-6 text-center">
        <Button
          className="rounded-lg bg-brand px-6 py-3 text-[14px] font-semibold text-white no-underline"
          href={`${process.env.APP_URL}/admin/organizations/${organizationId}`}
        >
          {t('button')}
        </Button>
      </Section>
    </EmailLayout>
  )
}

OrganizationRegistrationRequestEmail.PreviewProps = {
  city: 'Milan',
  country: 'it',
  message: 'We run youth mobility projects across Europe and would like to issue GloRe certificates.',
  organizationId: 1,
  organizationName: 'Acme Corp',
  registrantEmail: 'jane@acme.org',
  registrantName: 'Jane Doe',
  userName: 'Alex',
} satisfies OrganizationRegistrationRequestEmailProps

export default OrganizationRegistrationRequestEmail
