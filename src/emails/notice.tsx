import { type ReactNode } from 'react'

import { Button, Link, Section, Text } from 'react-email'

import { EmailLayout } from '@/emails/layout'
import { type EmailBaseProps, emailTranslator } from '@/emails/translate'
import metadata from '~/config/metadata.json'

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

const quoteStyle: React.CSSProperties = {
  borderLeft: '3px solid #d4d4d8',
  margin: '16px 0',
  paddingLeft: '12px',
}

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
  userName,
}: NoticeProps) => {
  const common = emailTranslator('Email.common', { locale, messages })

  return (
    <EmailLayout
      category={category}
      footer={
        <Text className="m-0 text-[12px] leading-5 text-[#71717a]">
          {footer}{' '}
          <Link className="text-[#71717a] underline" href={`mailto:${metadata.email}`}>
            {common('contactUs')}
          </Link>
        </Text>
      }
      locale={locale}
      messages={messages}
      preview={preview}
    >
      <Text className="m-0 text-[14px] leading-6 text-[#0a0a0a]">
        {userName ? common('greetingUser', { user: userName }) : common('greeting')}
      </Text>
      <Text className="text-[14px] leading-6 text-[#0a0a0a]">{intro}</Text>
      {details.map(detail => (
        <Text className="text-[13px] leading-5.5 text-[#71717a]" key={detail}>
          {detail}
        </Text>
      ))}
      {quote && (
        <Section style={quoteStyle}>
          {quote.label && <Text className="m-0 text-[12px] leading-5 text-[#71717a]">{quote.label}</Text>}
          <Text className="m-0 text-[14px] leading-6 whitespace-pre-line text-[#3f3f46]">{quote.text}</Text>
        </Section>
      )}
      {children}
      {action && (
        <Section className="my-6 text-center">
          <Button
            className={`rounded-lg ${action.tone === 'danger' ? 'bg-[#dc2626]' : 'bg-brand'} px-6 py-3 text-[14px] font-semibold text-white no-underline`}
            href={action.href}
          >
            {action.label}
          </Button>
        </Section>
      )}
      {note && <Text className="m-0 text-[12px] leading-5 text-[#71717a]">{note}</Text>}
    </EmailLayout>
  )
}
