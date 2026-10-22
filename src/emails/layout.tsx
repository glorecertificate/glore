import { type ReactNode, use } from 'react'

import { type AbstractIntlMessages } from 'next-intl'
import { Body, Container, Hr, Html, Img, Link, Preview, Section, Tailwind, Text } from 'react-email'

import { EmailContext } from '@/emails/context'
import { emailTranslator } from '@/emails/translate'
import { publicFile } from '@/lib/utils'
import metadata from '~/config/metadata.json'

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        brand: '#267997',
      },
    },
  },
}

const headerStyle: React.CSSProperties = {
  display: 'block',
  margin: '0 auto',
}

interface EmailLayoutProps {
  children: ReactNode
  footer?: ReactNode
  locale?: string
  messages?: AbstractIntlMessages
  preview: string
}

export const EmailLayout = ({ children, footer, locale = 'en', messages, preview }: EmailLayoutProps) => {
  const common = emailTranslator('Email.common', { locale, messages })
  const { category } = use(EmailContext)
  const isOptional = category !== null && category !== 'mandatory'
  const preferencesUrl = `${process.env.APP_URL}/settings?tab=notifications`

  return (
    <Html dir="ltr" lang={locale}>
      <Tailwind config={tailwindConfig}>
        <Preview>{preview}</Preview>
        <Body className="m-0 bg-[#f4f4f5] py-8 font-sans">
          <Container className="mx-auto max-w-140 px-4">
            <Section className="pb-4 text-center">
              <Link className="no-underline" href={process.env.APP_URL}>
                <Img
                  alt={metadata.name}
                  height={144}
                  src={publicFile('/email/header.png')}
                  style={headerStyle}
                  width={560}
                />
              </Link>
            </Section>
            <Section className="rounded-2xl border border-[#e4e4e7] bg-white p-10">
              {children}
              {footer && (
                <>
                  <Hr className="mx-0 my-6 border-[#e4e4e7]" />
                  {footer}
                </>
              )}
            </Section>
            <Section className="pt-6 text-center">
              {category === 'mandatory' && (
                <Text className="m-0 mb-3 text-[12px] leading-5 text-[#71717a]">{common('reasonMandatory')}</Text>
              )}
              {isOptional && (
                <Text className="m-0 mb-3 text-[12px] leading-5 text-[#71717a]">
                  {common('reasonOptional', { topic: common(`topic_${category}`) })}{' '}
                  <Link className="text-[#71717a] underline" href={preferencesUrl}>
                    {common('managePreferences')}
                  </Link>
                </Text>
              )}
              <Text className="m-0 text-[12px] leading-5 text-[#a1a1aa]">{common('address')}</Text>
              <Text className="m-0 text-[12px] leading-5 text-[#a1a1aa]">
                {common('copyright', { year: new Date().getFullYear() })}
              </Text>
              <Link className="text-[12px] text-[#a1a1aa] underline" href={metadata.website}>
                {common('homepage')}
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
