import metadata from '@config/metadata'
import {
  Body,
  Column,
  Container,
  Head,
  Html,
  type HtmlProps,
  Preview,
  Row,
  Section,
  Tailwind,
  pixelBasedPreset,
} from '@react-email/components'

import { type Messages } from '@glore/i18n'
import { Link } from '@glore/mailer/components/link'
import { Logo } from '@glore/mailer/components/logo'
import { Text } from '@glore/mailer/components/text'
import { mailerConfig } from '@glore/mailer/config'
import { type EmailOptions, type EmailTemplate } from '@glore/mailer/types'
import { deepMerge } from '@glore/utils/deep-merge'
import { resolveTemplate } from '@glore/utils/string'

export interface LayoutProps extends HtmlProps, Partial<EmailOptions<EmailTemplate>> {
  t: Messages['Email']['common']
}

const Footer = ({ footer, t }: LayoutProps) => (
  <Container className="mt-6">
    <Section>
      <Row>
        <Column className="text-right">
          <Link href={process.env.APP_URL}>{t.app}</Link>
        </Column>
        <Column className="text-center">
          <Link href={metadata.website}>{t.homepage}</Link>
        </Column>
        <Column className="text-left">
          <Link href={`mailto:${metadata.email}`}>{t.contactUs}</Link>
        </Column>
      </Row>
    </Section>
    <Section className="mb-10 text-center text-gray-400">
      {footer && <Text className="mb-1 text-sm">{footer}</Text>}
      <Text className="mb-1 text-sm">{resolveTemplate(t.copyright, { year: new Date().getFullYear() })}</Text>
      <Text className="mt-0 text-sm">{t.address}</Text>
    </Section>
  </Container>
)

export const Layout = ({
  children,
  footer,
  head,
  locale,
  logo,
  preview,
  subject,
  t,
  tailwindConfig = {},
  ...props
}: LayoutProps) => (
  <Html lang={locale} title={subject} {...props}>
    <Head>{head}</Head>
    <Tailwind
      config={{ presets: [pixelBasedPreset], theme: { extend: deepMerge(mailerConfig.theme, tailwindConfig) } }}
    >
      {preview && <Preview>{preview}</Preview>}
      <Body className="bg-offwhite font-sans text-base">
        <Link href={process.env.APP_URL} variant="wrapper">
          <Logo className="mx-auto my-8" src={logo} />
        </Link>
        <Container className="rounded-lg bg-white px-11 py-6 shadow-lg">
          {children}
          <Section>
            <Text className="text-gray-500">
              {t.outro}
              <br />
              {t.signature}
            </Text>
          </Section>
        </Container>
        <Footer footer={footer} t={t} />
      </Body>
    </Tailwind>
  </Html>
)

export { Column, Container, Row, Section }
