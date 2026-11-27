import { type ReactNode } from 'react'

import { type AbstractIntlMessages } from 'next-intl'
import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Tailwind, Text } from 'react-email'

import { EMAIL_CLASSES } from '@/emails/classes'
import { EMAIL_COLORS, EMAIL_COLORS_DARK } from '@/emails/colors.generated'
import { type EmailCategory, type EmailTranslator, emailTranslator } from '@/emails/translate'
import { type AppSettings, DEFAULT_SETTINGS, SOCIAL_LABELS, type SocialPlatform, socialLinks } from '@/lib/app-settings'
import { publicFile } from '@/lib/utils'
import metadata from '~/config/metadata.json'

const countryName = (countries: EmailTranslator, code: string) =>
  countries.has(code) ? countries(code) : code.toUpperCase()

const FOOTER_ORDER: SocialPlatform[] = ['instagram', 'facebook', 'linkedin', 'x', 'youtube']

const unlinked = (text: string) => text.replaceAll(/(\d)(?=\d)/gu, '$1\u2060')

const socialIconStyle: React.CSSProperties = { display: 'block', height: '16px', width: '16px' }

const TOKEN_NAMES = {
  action: 'brand',
  actionText: 'link',
  border: 'border-subtle',
  canvas: 'canvas',
  danger: 'danger',
  faint: 'fg-3',
  muted: 'fg-2',
  onDanger: 'on-danger',
  onFill: 'on-fill',
  sunken: 'sunken',
  surface: 'surface-0',
  text: 'fg-1',
} as const

const paletteColors = (palette: Record<keyof typeof TOKEN_NAMES, string>, suffix: string) =>
  Object.fromEntries(
    Object.entries(TOKEN_NAMES).map(([key, name]) => [`${name}${suffix}`, palette[key as keyof typeof TOKEN_NAMES]])
  )

const tailwindConfig = {
  theme: {
    extend: {
      colors: { ...paletteColors(EMAIL_COLORS, ''), ...paletteColors(EMAIL_COLORS_DARK, '-dark') },
    },
  },
}

const imageStyle: React.CSSProperties = {
  display: 'block',
  height: 'auto',
  margin: '0 auto',
  maxWidth: '100%',
}

const bandGradient = (palette: typeof EMAIL_COLORS | typeof EMAIL_COLORS_DARK) =>
  `linear-gradient(100deg,${palette.bandFrom}_0%,${palette.bandVia}_45%,${palette.bandVia2}_75%,${palette.bandTo}_100%)`

const plateClass = `bg-[${EMAIL_COLORS.bandFrom}] bg-[${bandGradient(EMAIL_COLORS)}] dark:bg-[${EMAIL_COLORS_DARK.bandFrom}] dark:bg-[${bandGradient(EMAIL_COLORS_DARK)}]`

const plateStyle: React.CSSProperties = {
  borderRadius: '16px 16px 0 0',
}

interface EmailLayoutProps {
  category?: EmailCategory | null
  children: ReactNode
  footer?: ReactNode
  locale?: string
  messages?: AbstractIntlMessages
  preview: string
  settings?: AppSettings
}

export const EmailLayout = ({
  category = null,
  children,
  footer,
  locale = 'en',
  messages,
  preview,
  settings = DEFAULT_SETTINGS,
}: EmailLayoutProps) => {
  const common = emailTranslator('Email.common', { locale, messages })
  const countries = emailTranslator('Intl.Countries', { locale, messages })
  const isOptional = category !== null && category !== 'mandatory'
  const preferencesUrl = `${process.env.APP_URL}/settings?tab=notifications`
  const { legalEntity, website } = settings
  const links = socialLinks(settings).toSorted(
    (a, b) => FOOTER_ORDER.indexOf(a.platform) - FOOTER_ORDER.indexOf(b.platform)
  )
  const icons: { href: string; icon: 'glore' | SocialPlatform; label: string }[] = [
    { href: website, icon: 'glore', label: common('homepage') },
    ...links.map(({ href, platform }) => ({ href, icon: platform, label: SOCIAL_LABELS[platform] })),
  ]

  return (
    <Html dir="ltr" lang={locale}>
      <Tailwind config={tailwindConfig}>
        <Head>
          <meta content="light dark" name="color-scheme" />
          <meta content="light dark" name="supported-color-schemes" />
        </Head>
        <Preview>{preview}</Preview>
        <Body className={EMAIL_CLASSES.page}>
          <Section className={EMAIL_CLASSES.canvas}>
            <Container className="mx-auto max-w-140">
              <Section className={EMAIL_CLASSES.card}>
                <Section bgcolor={EMAIL_COLORS.bandFrom} className={plateClass} style={plateStyle}>
                  <Link className="no-underline" href={process.env.APP_URL}>
                    <Img
                      alt={metadata.name}
                      height={144}
                      src={publicFile('/email/logo.png')}
                      style={imageStyle}
                      width={560}
                    />
                  </Link>
                </Section>
                <Section className={EMAIL_CLASSES.content}>
                  {children}
                  {footer && (
                    <>
                      <Hr className={EMAIL_CLASSES.divider} />
                      {footer}
                    </>
                  )}
                </Section>
              </Section>
              <Section className="pt-6 text-center">
                {category === 'mandatory' && <Text className={EMAIL_CLASSES.reason}>{common('reasonMandatory')}</Text>}
                {isOptional && (
                  <Text className={EMAIL_CLASSES.reason}>
                    {common('reasonOptional', { topic: common(`topic_${category}`) })}{' '}
                    <Link className={EMAIL_CLASSES.reasonLink} href={preferencesUrl}>
                      {common('managePreferences')}
                    </Link>
                  </Text>
                )}
                <Text className={`m-0 ${EMAIL_CLASSES.fine}`}>
                  {unlinked(
                    common('address', {
                      address: legalEntity.address,
                      country: countryName(countries, legalEntity.country),
                      name: legalEntity.name,
                    })
                  )}
                </Text>
                <Text className={`m-0 ${EMAIL_CLASSES.fine}`}>
                  {common('copyright', { name: legalEntity.name, year: new Date().getFullYear() })}
                </Text>
                <Text className="m-0 mt-4 text-center">
                  {icons.map(({ href, icon, label }) => (
                    <Link className={EMAIL_CLASSES.socialChip} href={href} key={icon} title={label}>
                      <Img
                        alt={label}
                        height={16}
                        src={publicFile(`/email/social/${icon}.png`)}
                        style={socialIconStyle}
                        width={16}
                      />
                    </Link>
                  ))}
                </Text>
              </Section>
            </Container>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  )
}
