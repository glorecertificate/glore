import { type ReactNode } from 'react'

import { Button, Link, Section, Text } from 'react-email'

import { EMAIL_CLASSES } from '@/emails/classes'
import { EmailLayout } from '@/emails/layout'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import { DEFAULT_SETTINGS } from '@/lib/app-settings'

interface NoticeProps extends EmailBaseProps {
  action?: { href: string; label: string; tone?: 'brand' | 'danger' }
  children?: ReactNode
  details?: string[]
  intro: string
  note?: string
  preview: string
  quote?: { label?: string; text: string }
  userName?: string | null
  footer: string
}

const NO_DETAILS: string[] = []

export const Notice = ({
  action,
  category,
  children,
  details = NO_DETAILS,
  footer,
  intro,
  locale = 'en',
  messages,
  note,
  preview,
  quote,
  settings = DEFAULT_SETTINGS,
  userName,
}: NoticeProps) => {
  const common = emailTranslator('Email.common', { locale, messages })

  return (
    <EmailLayout
      category={category}
      footer={
        <Text className={`m-0 ${EMAIL_CLASSES.fine}`}>
          {footer}{' '}
          <Link className={EMAIL_CLASSES.fineLink} href={`mailto:${settings.email}`}>
            {common('contactUs')}
          </Link>
        </Text>
      }
      locale={locale}
      messages={messages}
      preview={preview}
      settings={settings}
    >
      <Text className={`m-0 ${EMAIL_CLASSES.body}`}>
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className={EMAIL_CLASSES.body}>{intro}</Text>
      {details.map(detail => (
        <Text className={EMAIL_CLASSES.detail} key={detail}>
          {detail}
        </Text>
      ))}
      {quote && (
        <Section className={EMAIL_CLASSES.quote}>
          {quote.label && <Text className={`m-0 ${EMAIL_CLASSES.fine}`}>{quote.label}</Text>}
          <Text className={EMAIL_CLASSES.quoteText}>{quote.text}</Text>
        </Section>
      )}
      {children}
      {action && (
        <Section className="my-6 text-center">
          <Button
            className={action.tone === 'danger' ? EMAIL_CLASSES.buttonDanger : EMAIL_CLASSES.button}
            href={action.href}
          >
            {action.label}
          </Button>
        </Section>
      )}
      {note && <Text className={`m-0 ${EMAIL_CLASSES.fine}`}>{note}</Text>}
    </EmailLayout>
  )
}
