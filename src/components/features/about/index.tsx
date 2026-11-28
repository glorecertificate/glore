import { getMessages, getTranslations } from 'next-intl/server'

import { InfoSection } from '@/components/features/about/info-section'
import { type InfoTone, chipVariants } from '@/components/features/about/info-tone'
import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SOCIAL_LABELS, socialLinks } from '@/lib/app-settings'
import { loadSettings } from '@/lib/settings'

interface TitledText {
  description: string
  title: string
}

const SECTIONS: { icon: IconName; key: 'mission' | 'network' | 'values' | 'vision'; tone: InfoTone }[] = [
  { icon: 'award', key: 'mission', tone: 'action' },
  { icon: 'compass', key: 'vision', tone: 'info' },
  { icon: 'heart', key: 'values', tone: 'earned' },
  { icon: 'network', key: 'network', tone: 'navy' },
]

const SKILL_KEYS = [
  'problemSolving',
  'communication',
  'conflict',
  'empathy',
  'organization',
  'creativity',
  'teamwork',
  'leadership',
] as const

const TRUST_ITEMS: { icon: IconName; key: string; tone: InfoTone }[] = [
  { icon: 'user-check', key: 'validation', tone: 'action' },
  { icon: 'lock', key: 'immutable', tone: 'info' },
  { icon: 'qr-code', key: 'verifiable', tone: 'navy' },
]

const LINK = 'font-medium text-link underline underline-offset-4 hover:text-brand-text focus-visible:focus-ring'

const FACT_KEYS = ['founded', 'erasmus', 'free'] as const

const URL_PREFIX = /^https?:\/\/(www\.)?/u
const TRAILING_SLASH = /\/$/u

export const AboutContent = async () => {
  const messages = (await getMessages()) as { About: AboutMessages }
  const [t, settings] = await Promise.all([getTranslations('About'), loadSettings()])
  const links = socialLinks(settings)
  const websiteLabel = settings.website.replace(URL_PREFIX, '').replace(TRAILING_SLASH, '')

  const content = messages.About
  const { howItWorks } = content
  const steps = [howItWorks.step1, howItWorks.step2, howItWorks.step3, howItWorks.step4].filter(
    (value): value is TitledText => Boolean(value)
  )

  return (
    <div className="flex flex-col gap-10">
      {/* Intro */}
      <Card className="gap-0 overflow-hidden p-0 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-6 sm:p-8">
          <p className="max-w-3xl text-lg/8 text-pretty text-fg-1">{content.intro.body}</p>
          <div className="flex max-w-3xl flex-col gap-2 border-t pt-6">
            <h2 className="type-overline text-fg-3">{content.story.title}</h2>
            <p className="text-sm/relaxed text-pretty text-fg-2">{content.story.description}</p>
          </div>
        </div>
        <dl className="grid divide-y border-t bg-surface-sunken sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:w-72 lg:shrink-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y lg:border-t-0 lg:border-l">
          {FACT_KEYS.map(key => (
            <div
              className="flex flex-row-reverse items-center justify-end gap-4 px-6 py-4 sm:flex-col-reverse sm:items-start sm:justify-start sm:gap-1 sm:py-6 lg:justify-center"
              key={key}
            >
              <dt className="text-sm/relaxed text-pretty text-fg-2">{content.facts[key].label}</dt>
              <dd className="w-24 shrink-0 type-stat text-fg-title sm:w-auto">{content.facts[key].value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* Principles */}
      <Card className="gap-0 p-0">
        <div className="grid sm:grid-cols-2">
          {SECTIONS.map(({ icon, key, tone }) => (
            <div
              className="flex gap-4 border-t p-6 first:border-t-0 sm:p-8 sm:odd:border-r sm:nth-2:border-t-0"
              key={key}
            >
              <div aria-hidden className={chipVariants({ tone })}>
                <LucideIcon name={icon} className="size-4.5" />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <h3 className="type-heading text-fg-1">{content.sections[key].title}</h3>
                <p className="text-sm/relaxed text-pretty text-fg-2">{content.sections[key].description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* How it works */}
      <InfoSection description={content.howItWorks.description} title={content.howItWorks.title}>
        <Card className="p-6 sm:p-8">
          <ol className="grid gap-8 lg:grid-cols-4 lg:gap-6">
            {steps.map((step, index) => (
              <li className="relative flex gap-4 lg:flex-col" key={step.title}>
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-action text-sm font-semibold text-fg-on-fill tabular-nums"
                >
                  {index + 1}
                </span>
                {index < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-10 -bottom-6 left-4 w-px -translate-x-1/2 bg-border lg:top-4 lg:-right-4 lg:bottom-auto lg:left-10 lg:h-px lg:w-auto lg:translate-x-0"
                  />
                )}
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h3 className="type-heading text-fg-1">{step.title}</h3>
                  <p className="text-sm/relaxed text-pretty text-fg-2">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </InfoSection>

      {/* Trust */}
      <InfoSection description={content.trust.description} title={content.trust.title}>
        <Card className="grid gap-0 divide-y p-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {TRUST_ITEMS.map(({ icon, key, tone }) => (
            <div className="flex gap-4 p-5 sm:flex-col sm:p-6" key={key}>
              <div aria-hidden className={chipVariants({ tone })}>
                <LucideIcon name={icon} className="size-4.5" />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="type-heading text-fg-1">{content.trust.items[key]?.title}</h3>
                <p className="text-sm/relaxed text-pretty text-fg-2">{content.trust.items[key]?.description}</p>
              </div>
            </div>
          ))}
        </Card>
      </InfoSection>

      {/* Skills */}
      <InfoSection description={content.skills.description} title={content.skills.title}>
        <Card className="p-5 sm:p-6">
          <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {SKILL_KEYS.map(skill => (
              <li className="flex items-center gap-3 text-sm font-medium text-fg-1" key={skill}>
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-earned-subtle text-earned-text"
                >
                  <LucideIcon name="check" className="size-3.5" />
                </span>
                {content.skills.items[skill]}
              </li>
            ))}
          </ul>
        </Card>
      </InfoSection>

      {/* Contact */}
      <Card className="gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex max-w-xl flex-col gap-2">
          <h2 className="font-display text-xl font-semibold tracking-tight text-balance text-fg-title">
            {content.contact.title}
          </h2>
          <p className="text-sm/relaxed text-pretty text-fg-2">
            {t.rich('contact.description', {
              email: chunks => (
                <a className={LINK} href={`mailto:${settings.email}`}>
                  {chunks}
                </a>
              ),
            })}
          </p>
          <p className="flex items-start gap-2 pt-2 text-xs/relaxed text-pretty text-fg-3">
            <LucideIcon name="shield-check" className="mt-0.5 size-3.5 shrink-0" />
            {content.contact.coordinator}
          </p>
        </div>
        <div className="flex flex-col gap-4 lg:items-end">
          <div className="grid gap-2 sm:grid-cols-3 lg:w-72 lg:grid-cols-1">
            <Button asChild className="justify-start">
              <a href={`mailto:${settings.email}`}>
                <LucideIcon name="mail" />
                {settings.email}
              </a>
            </Button>
            <Button asChild className="justify-start" variant="outline">
              <a href={settings.website} rel="noopener noreferrer" target="_blank">
                <LucideIcon name="globe" />
                {websiteLabel}
              </a>
            </Button>
            <Button asChild className="justify-start" variant="outline">
              <a href={`tel:${settings.phone}`}>
                <LucideIcon name="phone" />
                {settings.phone}
              </a>
            </Button>
          </div>
          {links.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm lg:justify-end">
              {links.map(({ href, platform }) => (
                <a
                  className={`inline-flex items-center gap-1 ${LINK}`}
                  href={href}
                  key={platform}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {SOCIAL_LABELS[platform]}
                  <LucideIcon name="arrow-up-right" className="size-3.5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

interface AboutMessages {
  contact: {
    coordinator: string
    description: string
    title: string
  }
  howItWorks: {
    description: string
    step1: TitledText
    step2: TitledText
    step3: TitledText
    step4?: TitledText
    title: string
  }
  facts: Record<'erasmus' | 'founded' | 'free', { label: string; value: string }>
  intro: {
    body: string
    tagline: string
  }
  sections: Record<'mission' | 'vision' | 'values' | 'network', TitledText>
  skills: {
    description: string
    items: Record<string, string>
    title: string
  }
  story: TitledText
  title: string
  trust: {
    description: string
    items: Record<string, TitledText>
    title: string
  }
}
