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

import metadata from '@config/metadata'
import { deepMerge } from '@glore/utils/deep-merge'

import { EMAIL_THEME, MAIL_APP_URL } from '../constants'
import { type EmailProps } from '../types'
import { getTranslations } from '../utils'
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
  const t = await getTranslations('Email.common', { locale })

  return (
    <Html lang={locale} title={subject} {...props}>
      <Head>{head}</Head>
      <Tailwind config={{ presets: [pixelBasedPreset], theme: { extend: deepMerge(EMAIL_THEME, tailwindConfig) } }}>
        {preview && <Preview>{preview}</Preview>}
        <Body className="bg-offwhite font-sans text-base">
          <EmailLink href={MAIL_APP_URL} variant="wrapper">
            <EmailLogo className="mx-auto my-8" src={logo} />
          </EmailLink>
          <Container className="rounded-lg bg-white px-11 py-6 shadow-lg">
            {children}
            <EmailText className="text-gray-500">
              {t('outro')}
              <br />
              {t('signature')}
            </EmailText>
          </Container>
          <Container className="mt-4">
            <Section>
              <Row>
                <Column className="w-[33.33%] text-right">
                  <EmailLink href={MAIL_APP_URL}>{t('app')}</EmailLink>
                </Column>
                <Column className="w-[33.33%] text-center">
                  <EmailLink href={metadata.website}>{t('homepage')}</EmailLink>
                </Column>
                <Column className="w-[33.33%] text-left">
                  <EmailLink href={`mailto:${metadata.email}`}>{t('contactUs')}</EmailLink>
                </Column>
              </Row>
            </Section>
            <Section className="mb-10 text-center text-gray-400">
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
