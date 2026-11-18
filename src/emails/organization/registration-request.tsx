import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'
import { Button, Section, Text } from 'react-email'

import { EMAIL_CLASSES } from '@/emails/classes'
import { EmailLayout } from '@/emails/layout'
import { type EmailBaseProps } from '@/emails/translate'
import { DEFAULT_SETTINGS } from '@/lib/app-settings'
import { type MessageKey } from '@/lib/i18n'
import defaultMessages from '~/messages/en.json'

type Messages = typeof defaultMessages

interface OrganizationRegistrationRequestEmailProps extends EmailBaseProps {
  city: string
  organizationId: number
  organizationName: string
  registrantEmail: string
  registrantName: string
  country?: string | null
  message?: string | null
  userName?: string
}

const OrganizationRegistrationRequestEmail = ({
  category,
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
  settings = DEFAULT_SETTINGS,
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

  const countryKey = country?.toLowerCase() as MessageKey<'Intl.Countries'>
  const countryName = countries.has(countryKey) ? countries(countryKey) : country?.toUpperCase()
  const location = [city, countryName].filter(Boolean).join(', ')
  const footer = <Text className={`m-0 ${EMAIL_CLASSES.fine}`}>{t('footer')}</Text>

  return (
    <EmailLayout
      category={category}
      footer={footer}
      locale={locale}
      messages={messages}
      preview={t('preview', { organizationName })}
      settings={settings}
    >
      <Text className={`m-0 ${EMAIL_CLASSES.body}`}>
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className={EMAIL_CLASSES.body}>{t('intro', { organizationName })}</Text>
      <Text className={EMAIL_CLASSES.detail}>{t('details', { registrantEmail, registrantName })}</Text>
      {location && <Text className={EMAIL_CLASSES.detail}>{t('location', { location })}</Text>}
      {message && <Text className={EMAIL_CLASSES.detail}>{t('message', { message })}</Text>}
      <Section className="my-6 text-center">
        <Button className={EMAIL_CLASSES.button} href={`${process.env.APP_URL}/admin/organizations/${organizationId}`}>
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
