import {
  Body,
  Column,
  Container,
  Head,
  Html,
  type HtmlProps,
  Preview,
  pixelBasedPreset,
  Row,
  Section,
  Tailwind,
} from '@react-email/components'

import metadata from '~/config/metadata.json'

import { mailer } from '@/email/config'
import { type EmailProps } from '@/email/types'
import { getEmailTranslations } from '@/email/utils'
import { APP_URL } from '@/lib/metadata'
import { EmailLink } from './link'
import { EmailLogo } from './logo'
import { EmailText } from './text'

export const EmailColumn = Column
export const EmailContainer = Container
export const EmailRow = Row
export const EmailSection = Section

export interface EmailLayoutProps extends HtmlProps, EmailProps {}

export const EmailLayout = async ({
  children,
  footer,
  head,
  locale,
  logo,
  preview,
  subject,
  tailwindConfig = {},
  ...props
}: EmailLayoutProps) => {
  const t = await getEmailTranslations('Email.common', locale)

  return (
    <Html lang={locale} title={subject} {...props}>
      <Head>{head}</Head>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              ...mailer.theme,
              ...tailwindConfig,
            },
          },
        }}
      >
        {preview && <Preview>{preview}</Preview>}
        <Body className="bg-offwhite font-sans text-base">
          <Container className="mx-auto max-w-130 px-4">
            <EmailLink href={APP_URL} variant="wrapper">
              <EmailLogo className="mx-auto mt-10 mb-6" src={logo} />
            </EmailLink>
            <Section className="rounded-xl bg-white px-10 py-8 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
              {children}
              <Section className="mt-4 border-gray-100 border-t pt-4">
                <EmailText className="m-0 text-gray-400 text-sm">
                  {t('outro')}
                  <br />
                  {t('signature')}
                </EmailText>
              </Section>
            </Section>
            <Section className="mt-6">
              <Row>
                <Column className="w-[33.33%] text-right">
                  <EmailLink href={APP_URL}>{t('app')}</EmailLink>
                </Column>
                <Column className="w-[33.33%] text-center">
                  <EmailLink href={metadata.website}>{t('homepage')}</EmailLink>
                </Column>
                <Column className="w-[33.33%] text-left">
                  <EmailLink href={`mailto:${metadata.email}`}>{t('contactUs')}</EmailLink>
                </Column>
              </Row>
            </Section>
            <Section className="mt-2 mb-10 text-center text-gray-400">
              {footer && <EmailText className="mb-1 text-sm">{footer}</EmailText>}
              <EmailText className="mb-1 text-sm">{t('copyright', { year: new Date().getFullYear() })}</EmailText>
              <EmailText className="mt-0 text-sm">{t('address')}</EmailText>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
