import { type ReactNode } from 'react'

import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Tailwind, Text } from '@react-email/components'
import { type AbstractIntlMessages, type Locale, createTranslator } from 'next-intl'

import { publicFile } from '@/lib/utils'
import metadata from '~/config/metadata.json'
import defaultMessages from '~/messages/en.json'

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        brand: '#3bb5da',
      },
    },
  },
}

const logoStyle: React.CSSProperties = {
  margin: '0 auto',
}

interface EmailLayoutProps {
  children: ReactNode
  footer: ReactNode
  locale?: string
  messages?: AbstractIntlMessages
  preview: string
}

export const EmailLayout = ({
  children,
  footer,
  locale = 'en',
  messages = defaultMessages as AbstractIntlMessages,
  preview,
}: EmailLayoutProps) => {
  const common = createTranslator({
    locale: locale as Locale,
    messages: messages as typeof defaultMessages,
    namespace: 'Email.common',
  })

  return (
    <Html dir="ltr" lang={locale}>
      <Tailwind config={tailwindConfig}>
        <Head>
          {/* <style>{`
            .logo-dark { display: none !important; }
            @media (prefers-color-scheme: dark) {
              .logo-light { display: none !important; }
              .logo-dark { display: block !important; }
            }
          `}</style> */}
        </Head>
        <Preview>{preview}</Preview>
        <Body className="m-0 bg-[#f4f4f5] py-10 font-sans">
          <Container className="mx-auto max-w-140 px-4">
            <Section className="pb-6 text-center">
              <Link className="no-underline" href={metadata.website}>
                <Img
                  alt={metadata.name}
                  className="logo-light"
                  height={40}
                  src={publicFile(`/logo.png`)}
                  style={logoStyle}
                />
                {/* <Img
                  alt={metadata.name}
                  className="logo-dark"
                  height={40}
                  src={publicFile(`/logo-dark.png`)}
                  style={logoStyle}
                /> */}
              </Link>
            </Section>
            <Section className="rounded-2xl border border-[#e4e4e7] bg-white px-10 py-10">
              {children}
              <Hr className="mx-0 my-6 border-[#e4e4e7]" />
              {footer}
            </Section>
            <Section className="pt-6 text-center">
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
